import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import {
  createLiveAttachmentDownloadUrl,
  fetchLiveFiles,
  type LiveFile,
} from "@/lib/paterhausConversationsApi";
import { LiveFilesHubModule } from "./LiveFilesHubModule";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/paterhausConversationsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/paterhausConversationsApi")>();
  return {
    ...original,
    fetchLiveFiles: vi.fn(),
    createLiveAttachmentDownloadUrl: vi.fn(),
  };
});

const file: LiveFile = {
  id: "91",
  chatId: "canonical-chat",
  historyId: "24",
  senderType: "contact",
  senderName: "Sultan",
  number: "77021464983",
  fileName: "Letter of Intent.docx",
  mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  kind: "word",
  sizeBytes: 42905,
  caption: null,
  summary: "Letter of intent regarding a pilot implementation.",
  createdAt: "2026-09-22T10:00:00.000Z",
};

const filesMock = vi.mocked(fetchLiveFiles);
const downloadMock = vi.mocked(createLiveAttachmentDownloadUrl);

beforeEach(() => {
  vi.clearAllMocks();
  filesMock.mockResolvedValue({ items: [file], nextCursor: null });
});

describe("LiveFilesHubModule", () => {
  it("loads real attachment metadata", async () => {
    render(<LiveFilesHubModule email="r_tszi@paterhaus.com" />);
    expect(await screen.findByText("Letter of Intent.docx")).toBeInTheDocument();
    expect(screen.getByText("Sultan")).toBeInTheDocument();
    expect(screen.getByText("77021464983")).toBeInTheDocument();
    expect(screen.getByText("Letter of intent regarding a pilot implementation.")).toBeInTheDocument();
  });

  it("searches and filters through the backend API", async () => {
    render(<LiveFilesHubModule email="r_tszi@paterhaus.com" />);
    await screen.findByText("Letter of Intent.docx");

    fireEvent.change(screen.getByRole("textbox", { name: "Search files" }), {
      target: { value: "Sultan" },
    });
    await waitFor(() => expect(filesMock).toHaveBeenLastCalledWith(
      "r_tszi@paterhaus.com",
      expect.objectContaining({ search: "Sultan" }),
      expect.any(AbortSignal),
    ));

    fireEvent.change(screen.getByRole("combobox", { name: "Filter file type" }), {
      target: { value: "word" },
    });
    await waitFor(() => expect(filesMock).toHaveBeenLastCalledWith(
      "r_tszi@paterhaus.com",
      expect.objectContaining({ search: "Sultan", kind: "word" }),
      expect.any(AbortSignal),
    ));
  });

  it("requests a temporary backend URL before opening a download", async () => {
    downloadMock.mockResolvedValue({ url: "https://signed.example/file", expiresIn: 300 });
    const open = vi.spyOn(window, "open").mockReturnValue({} as Window);
    render(<LiveFilesHubModule email="r_tszi@paterhaus.com" />);
    await screen.findByText("Letter of Intent.docx");

    fireEvent.click(screen.getByRole("button", { name: /Download Letter of Intent\.docx/ }));
    await waitFor(() => expect(downloadMock).toHaveBeenCalledWith("r_tszi@paterhaus.com", "91"));
    expect(open).toHaveBeenCalledWith("https://signed.example/file", "_blank", "noopener,noreferrer");
  });

  it("shows a useful error when a signed URL cannot be created", async () => {
    downloadMock.mockRejectedValue(new Error("unavailable"));
    render(<LiveFilesHubModule email="r_tszi@paterhaus.com" />);
    await screen.findByText("Letter of Intent.docx");
    fireEvent.click(screen.getByRole("button", { name: /Download Letter of Intent\.docx/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(
      "The download link could not be created. Please try again.",
    ));
  });

  it("distinguishes empty and failed file lists", async () => {
    filesMock.mockResolvedValueOnce({ items: [], nextCursor: null });
    const { unmount } = render(<LiveFilesHubModule email="r_tszi@paterhaus.com" />);
    expect(await screen.findByText("No files found")).toBeInTheDocument();
    unmount();

    filesMock.mockRejectedValueOnce(new Error("offline"));
    render(<LiveFilesHubModule email="r_tszi@paterhaus.com" />);
    expect(await screen.findByText("Live files are temporarily unavailable.")).toBeInTheDocument();
    expect(screen.queryByText("No files found")).not.toBeInTheDocument();
  });
});
