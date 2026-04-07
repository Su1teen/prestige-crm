import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, User, Bell, TrendingUp } from "lucide-react";
import { notifications as initialNotifications } from "@/data/mockData";

const iconMap = {
  ai: Bot,
  manual: User,
  system: Bell,
  lead: TrendingUp,
};

const iconColorMap = {
  ai: "bg-primary/10 text-primary",
  manual: "bg-amber-100 text-amber-600",
  system: "bg-secondary text-muted-foreground",
  lead: "bg-emerald-100 text-emerald-600",
};

const NotificationsTab = () => {
  const [items, setItems] = useState(initialNotifications);
  const [rippleId, setRippleId] = useState<string | null>(null);

  const handleClick = (id: string) => {
    setRippleId(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setTimeout(() => setRippleId(null), 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.filter(n => !n.read).length} unread</p>
        </div>
        <button
          onClick={() => setItems(prev => prev.map(n => ({ ...n, read: true })))}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Mark all as read
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden divide-y divide-border">
        {items.map((notification, i) => {
          const Icon = iconMap[notification.type];
          return (
            <motion.button
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => handleClick(notification.id)}
              className={`w-full flex items-start gap-4 p-4 text-left transition-colors relative overflow-hidden ${
                !notification.read ? "bg-primary/[0.03]" : "hover:bg-secondary/40"
              }`}
            >
              {rippleId === notification.id && (
                <motion.div
                  initial={{ scale: 0, opacity: 0.3 }}
                  animate={{ scale: 4, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-primary/10"
                />
              )}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColorMap[notification.type]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                  {!notification.read && (
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse-dot flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notification.description}</p>
              </div>
              <span className="text-[11px] text-muted-foreground flex-shrink-0 mt-0.5">{notification.time}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationsTab;
