import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Hand } from "lucide-react";
import { chatThreads, type ChatThread } from "@/data/mockData";

const HistoryTab = () => {
  const [activeChat, setActiveChat] = useState<ChatThread>(chatThreads[0]);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">History</h1>
        <p className="text-sm text-muted-foreground mt-1">AI conversation threads</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden flex h-[calc(100vh-200px)]">
        {/* Chat List */}
        <div className="w-80 border-r border-border flex-shrink-0 flex flex-col">
          <div className="p-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Active Chats</p>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {chatThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => { setActiveChat(thread); setIsReplying(false); }}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                  activeChat.id === thread.id ? "bg-sidebar-accent" : "hover:bg-secondary/50"
                }`}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${thread.avatar_colors[0]}, ${thread.avatar_colors[1]})` }}
                >
                  {thread.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground truncate">{thread.clientName}</p>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">{thread.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{thread.lastMessage}</p>
                </div>
                {thread.unread > 0 && (
                  <span className="w-5 h-5 rounded-full gradient-indigo text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {thread.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          <div className="h-14 px-5 flex items-center border-b border-border">
            <p className="font-semibold text-foreground">{activeChat.clientName}</p>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4 chat-pattern">
            {activeChat.messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className={`flex ${msg.sender === "ai" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2.5 text-sm leading-relaxed ${
                    msg.sender === "ai"
                      ? "gradient-indigo text-primary-foreground rounded-bl-2xl rounded-t-2xl"
                      : "bg-card shadow-card text-foreground rounded-br-2xl rounded-t-2xl border border-border"
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.sender === "ai" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Take Over Button / Reply Area */}
          <div className="p-4 border-t border-border">
            <AnimatePresence mode="wait">
              {!isReplying ? (
                <motion.button
                  key="takeover"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setIsReplying(true)}
                  className="w-full py-3 rounded-xl gradient-indigo text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-elevated hover:shadow-hover transition-shadow"
                >
                  <Hand className="w-4 h-4" />
                  Take Over & Reply Manually
                </motion.button>
              ) : (
                <motion.div
                  key="reply"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-end gap-2"
                >
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your message..."
                    rows={2}
                    autoFocus
                    className="flex-1 resize-none rounded-xl border border-border bg-secondary/50 backdrop-blur-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                  <button className="p-3 rounded-xl gradient-indigo text-primary-foreground shadow-elevated hover:shadow-hover transition-shadow">
                    <Send className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryTab;
