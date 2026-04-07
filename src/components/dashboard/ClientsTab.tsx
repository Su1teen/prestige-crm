import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Pencil, Trash2, Search } from "lucide-react";
import { clients } from "@/data/mockData";

const statusStyles: Record<string, string> = {
  "New": "bg-blue-100 text-blue-700",
  "Contacted": "bg-amber-100 text-amber-700",
  "Hot Lead": "bg-emerald-100 text-emerald-700",
  "Meeting": "bg-purple-100 text-purple-700",
  "Lost": "bg-slate-100 text-slate-500",
};

const ClientsTab = () => {
  const [search, setSearch] = useState("");
  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.property.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">{clients.length} active prospects</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 w-64"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground sticky top-0 bg-secondary/50">Client</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground sticky top-0 bg-secondary/50">Property</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground sticky top-0 bg-secondary/50">Budget</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground sticky top-0 bg-secondary/50">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground sticky top-0 bg-secondary/50">Last Contact</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground sticky top-0 bg-secondary/50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client, i) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="group border-b border-border last:border-b-0 hover:bg-secondary/40 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${client.avatar_colors[0]}, ${client.avatar_colors[1]})` }}
                      >
                        {client.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-foreground">{client.property}</p>
                    <span className="inline-block mt-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[11px] font-medium">
                      {client.unit}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">{client.budget}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[client.status]}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{client.lastContact}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientsTab;
