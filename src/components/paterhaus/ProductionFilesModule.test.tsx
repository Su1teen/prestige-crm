import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { internalDocumentsApi } from "@/lib/paterhausApi";
import { ProductionFilesModule } from "./ProductionFilesModule";

vi.mock("@/lib/paterhausApi", () => ({ internalDocumentsApi: { list: vi.fn(), upload: vi.fn(), downloadUrl: vi.fn(), delete: vi.fn() } }));
vi.mock("./LiveFilesHubModule", () => ({ LiveFilesHubModule: () => <div>Live client attachments</div> }));
const renderFiles = (admin: boolean) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
  <ProductionFilesModule email={admin ? "info@paterhaus.com" : "r_tszi@paterhaus.com"} admin={admin} />
</QueryClientProvider>);
beforeEach(() => { vi.clearAllMocks(); vi.mocked(internalDocumentsApi.list).mockResolvedValue({ items: [] }); });

describe("production files permissions", () => {
  it("marketing sees client attachments but cannot load or switch to internal files", () => {
    renderFiles(false);
    expect(screen.getByText("Live client attachments")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Internal files" })).not.toBeInTheDocument();
    expect(internalDocumentsApi.list).not.toHaveBeenCalled();
  });

  it("admin sees both client and internal sources", async () => {
    renderFiles(true);
    fireEvent.click(screen.getByRole("button", { name: "Internal files" }));
    expect(await screen.findByText("No internal documents")).toBeInTheDocument();
    expect(internalDocumentsApi.list).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Upload internal document" })).toBeInTheDocument();
  });
});
