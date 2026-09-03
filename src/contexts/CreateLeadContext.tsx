import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { type LiveLeadClassification } from "@/lib/paterhausConversationsApi";
import { CreateLeadDialog } from "@/components/paterhaus/CreateLeadDialog";

interface CreateLeadContextValue {
  /** Whether the current account may create leads manually. */
  canCreateLead: boolean;
  /** Opens the shared Create Lead modal. */
  openCreateLead: () => void;
  /**
   * Monotonically increasing counter bumped after every successful creation.
   * Owner Pipeline watches it to refresh its data without a full page reload.
   */
  leadCreatedTick: number;
}

const CreateLeadContext = createContext<CreateLeadContextValue | null>(null);

interface CreateLeadProviderProps {
  email: string;
  canCreateLead: boolean;
  children: ReactNode;
}

export const CreateLeadProvider = ({
  email,
  canCreateLead,
  children,
}: CreateLeadProviderProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [leadCreatedTick, setLeadCreatedTick] = useState(0);

  const openCreateLead = useCallback(() => {
    if (!canCreateLead) return;
    setOpen(true);
  }, [canCreateLead]);

  const handleCreated = useCallback(
    (lead: LiveLeadClassification) => {
      setLeadCreatedTick((current) => current + 1);
      toast.success(t("createLead.success", { name: lead.displayName }));
    },
    [t],
  );

  const value = useMemo<CreateLeadContextValue>(
    () => ({ canCreateLead, openCreateLead, leadCreatedTick }),
    [canCreateLead, openCreateLead, leadCreatedTick],
  );

  return (
    <CreateLeadContext.Provider value={value}>
      {children}
      {canCreateLead && (
        <CreateLeadDialog
          email={email}
          open={open}
          onOpenChange={setOpen}
          onCreated={handleCreated}
        />
      )}
    </CreateLeadContext.Provider>
  );
};

export const useCreateLead = (): CreateLeadContextValue => {
  const context = useContext(CreateLeadContext);
  if (!context) {
    throw new Error("useCreateLead must be used within CreateLeadProvider");
  }
  return context;
};
