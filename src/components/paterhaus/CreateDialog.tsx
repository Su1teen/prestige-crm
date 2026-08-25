import { useMemo, useState } from "react";
import { BookOpenText, StickyNote } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import {
  knowledgeCategoryLabels,
  knowledgeTypeLabels,
  type KnowledgeCategory,
  type KnowledgeItemType,
} from "@/data/paterhaus/knowledgeBase";

type CreateKind = "knowledge" | "ownerNote";

export const CreateDialog = ({
  open,
  onOpenChange,
  defaultKind = "knowledge",
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultKind?: CreateKind;
  onNavigate?: (section: "knowledge" | "pipeline") => void;
}) => {
  const { t } = useLanguage();
  const workspace = usePaterhausWorkspace();
  const [activeTab, setActiveTab] = useState<CreateKind>(defaultKind);

  // Knowledge form state
  const [kbTitle, setKbTitle] = useState("");
  const [kbCategory, setKbCategory] = useState<KnowledgeCategory>("general");
  const [kbType, setKbType] = useState<KnowledgeItemType>("guide");
  const [kbSummary, setKbSummary] = useState("");
  const [kbTags, setKbTags] = useState("");

  // Owner note form state
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [noteText, setNoteText] = useState("");

  const leads = useMemo(() => workspace.opportunities, [workspace.opportunities]);

  const handleSaveKnowledge = () => {
    if (!kbTitle.trim()) {
      toast.error(t("create.knowledgeTitleField"));
      return;
    }
    workspace.addKnowledgeItem({
      title: kbTitle.trim(),
      category: kbCategory,
      type: kbType,
      summary: kbSummary.trim(),
      tags: kbTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    toast.success(t("create.knowledgeSaved"));
    setKbTitle("");
    setKbSummary("");
    setKbTags("");
    onOpenChange(false);
    onNavigate?.("knowledge");
  };

  const handleSaveNote = () => {
    if (!selectedLeadId) {
      toast.error(t("create.ownerNoteSelectLead"));
      return;
    }
    if (!noteText.trim()) {
      toast.error(t("create.ownerNoteText"));
      return;
    }
    const lead = leads.find((l) => l.id === selectedLeadId);
    if (!lead) return;
    workspace.addTimelineEvent(selectedLeadId, {
      type: "note_added",
      timestamp: new Date().toISOString(),
      details: noteText.trim(),
    });
    toast.success(t("create.ownerNoteSaved"));
    setNoteText("");
    onOpenChange(false);
    onNavigate?.("pipeline");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setActiveTab(defaultKind);
        onOpenChange(value);
      }}
    >
      <DialogContent className="dark max-h-[90vh] overflow-y-auto border-border bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("create.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("create.dialogDescription")}</DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CreateKind)} className="mt-2">
          <TabsList className="flex w-full">
            <TabsTrigger value="knowledge" className="flex-1">
              <BookOpenText className="mr-1.5 h-4 w-4" />
              {t("create.type.knowledge")}
            </TabsTrigger>
            <TabsTrigger value="ownerNote" className="flex-1">
              <StickyNote className="mr-1.5 h-4 w-4" />
              {t("create.type.ownerNote")}
            </TabsTrigger>
          </TabsList>

          {/* Knowledge tab */}
          <TabsContent value="knowledge" className="space-y-3">
            <div>
              <label className="block text-sm text-foreground">
                {t("create.knowledgeTitleField")}
                <Input
                  value={kbTitle}
                  onChange={(e) => setKbTitle(e.target.value)}
                  className="mt-1"
                  placeholder={t("create.knowledgeTitleField")}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-foreground">
                {t("create.knowledgeCategory")}
                <select
                  value={kbCategory}
                  onChange={(e) => setKbCategory(e.target.value as KnowledgeCategory)}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {(Object.keys(knowledgeCategoryLabels) as KnowledgeCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {knowledgeCategoryLabels[cat]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-foreground">
                {t("create.knowledgeType")}
                <select
                  value={kbType}
                  onChange={(e) => setKbType(e.target.value as KnowledgeItemType)}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {(Object.keys(knowledgeTypeLabels) as KnowledgeItemType[]).map((type) => (
                    <option key={type} value={type}>
                      {knowledgeTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm text-foreground">
                {t("create.knowledgeSummary")}
                <textarea
                  value={kbSummary}
                  onChange={(e) => setKbSummary(e.target.value)}
                  className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={t("create.knowledgeSummary")}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm text-foreground">
                {t("create.knowledgeTags")}
                <Input
                  value={kbTags}
                  onChange={(e) => setKbTags(e.target.value)}
                  className="mt-1"
                  placeholder="guide, dubai, sop"
                />
              </label>
            </div>
          </TabsContent>

          {/* Owner note tab */}
          <TabsContent value="ownerNote" className="space-y-3">
            {leads.length === 0 ? (
              <p className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                {t("create.ownerNoteNoLeads")}
              </p>
            ) : (
              <>
                <div>
                  <label className="block text-sm text-foreground">
                    {t("create.ownerNoteSelectLead")}
                    <select
                      value={selectedLeadId}
                      onChange={(e) => setSelectedLeadId(e.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">—</option>
                      {leads.map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.ownerName} · {lead.prospectProperty}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div>
                  <label className="block text-sm text-foreground">
                    {t("create.ownerNoteText")}
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="mt-1 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder={t("create.ownerNoteText")}
                    />
                  </label>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("create.cancel")}
          </Button>
          {activeTab === "knowledge" ? (
            <Button onClick={handleSaveKnowledge} disabled={!kbTitle.trim()}>
              {t("create.save")}
            </Button>
          ) : (
            <Button onClick={handleSaveNote} disabled={!selectedLeadId || !noteText.trim()}>
              {t("create.save")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
