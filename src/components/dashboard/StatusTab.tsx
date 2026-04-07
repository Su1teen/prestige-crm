import { motion } from "framer-motion";
import { clients } from "@/data/mockData";

const columns = [
  { id: "New", color: "bg-blue-500" },
  { id: "Contacted", color: "bg-amber-500" },
  { id: "Hot Lead", color: "bg-emerald-500" },
  { id: "Meeting", color: "bg-purple-500" },
  { id: "Lost", color: "bg-slate-400" },
] as const;

const StatusTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pipeline Status</h1>
        <p className="text-sm text-muted-foreground mt-1">Drag-and-drop Kanban board</p>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-4">
        {columns.map((col) => {
          const items = clients.filter((c) => c.status === col.id);
          return (
            <div key={col.id} className="min-w-[260px] flex-1">
              <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                <div className={`h-1 ${col.color}`} />
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{col.id}</h3>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="p-3 space-y-3 min-h-[200px]">
                  {items.map((client, i) => (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ y: -4, boxShadow: "var(--shadow-hover)" }}
                      className="bg-card border border-border rounded-xl p-3.5 shadow-card cursor-grab transition-all duration-300"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${client.avatar_colors[0]}, ${client.avatar_colors[1]})` }}
                        >
                          {client.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
                      </div>
                      <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[11px] font-medium mb-2">
                        {client.property} · {client.unit}
                      </span>
                      <p className="text-xs text-muted-foreground italic line-clamp-2 leading-relaxed">
                        {client.ai_summary}
                      </p>
                    </motion.div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">No leads</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTab;
