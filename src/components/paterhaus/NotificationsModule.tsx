import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  ClipboardPlus,
  FileCheck2,
  MessageSquare,
  ReceiptText,
  ShieldAlert,
  UserRound,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import { formatPaterhausDateTime, PATERHAUS_TODAY } from "@/data/paterhaus";
import type { NotificationPriority } from "@/types/paterhaus";
import { SectionHeader, StatusPill } from "./shared";

const priorities: Array<NotificationPriority | "All"> = ["All", "Critical", "Attention", "Info"];
const priorityValues: string[] = priorities;
const isPriorityFilter = (value: string): value is NotificationPriority | "All" => priorityValues.includes(value);
const isReadFilter = (value: string): value is "All" | "Unread" | "Read" => ["All", "Unread", "Read"].includes(value);

const notificationIcon = (title: string) => {
  if (title.includes("Guest")) return MessageSquare;
  if (title.includes("Owner")) return UserRound;
  if (title.includes("DTCM") || title.includes("listing")) return ShieldAlert;
  if (title.includes("Payment")) return ReceiptText;
  if (title.includes("Vendor") || title.includes("Turnover")) return Wrench;
  if (title.includes("reservation")) return CalendarClock;
  if (title.includes("readiness")) return AlertTriangle;
  return Bell;
};

export const NotificationsModule = ({
  onPropertySelect,
  onConversationSelect,
  onTaskSelect,
}: {
  onPropertySelect?: (id: string) => void;
  onConversationSelect?: (id: string) => void;
  onTaskSelect?: (id: string) => void;
}) => {
  const workspace = usePaterhausWorkspace();
  const [readFilter, setReadFilter] = useState<"All" | "Unread" | "Read">("All");
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | "All">("All");
  const visibleNotifications = workspace.notifications.filter((notification) => {
    const matchesRead =
      readFilter === "All" ||
      (readFilter === "Unread" && !notification.read) ||
      (readFilter === "Read" && notification.read);
    return matchesRead && (priorityFilter === "All" || notification.priority === priorityFilter);
  });

  const createTask = (notificationId: string) => {
    const notification = workspace.notifications.find((item) => item.id === notificationId);
    if (!notification?.propertyId) return;
    workspace.createTask({
      propertyId: notification.propertyId,
      title: `Notification follow-up: ${notification.title}`,
      description: notification.description,
      category: "Owner request",
      priority: notification.priority === "Critical" ? "Urgent" : "High",
      dueAt: `${PATERHAUS_TODAY}T17:00:00`,
    });
    workspace.markNotificationRead(notificationId);
    toast.success("Follow-up task created and notification marked read.");
  };

  const markAllRead = () => {
    workspace.notifications
      .filter((notification) => !notification.read)
      .forEach((notification) => {
        workspace.markNotificationRead(notification.id);
      });
    toast.success("All visible notifications marked read.");
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Action centre"
        title="Notifications"
        description="Prioritised local alerts with meaningful destinations and follow-up actions."
      />
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-40 text-xs text-muted-foreground">
          Read state
          <Select
            value={readFilter}
            onValueChange={(value) => {
              if (isReadFilter(value)) setReadFilter(value);
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Filter by read state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All notifications</SelectItem>
              <SelectItem value="Unread">Unread only</SelectItem>
              <SelectItem value="Read">Read only</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="min-w-40 text-xs text-muted-foreground">
          Priority
          <Select
            value={priorityFilter}
            onValueChange={(value) => {
              if (isPriorityFilter(value)) setPriorityFilter(value);
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority === "All" ? "All priorities" : priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <Button type="button" variant="outline" onClick={markAllRead}>
          <Check className="h-4 w-4" /> Mark all read
        </Button>
      </div>
      <div className="space-y-3">
        {visibleNotifications.map((notification) => {
          const Icon = notificationIcon(notification.title);
          const property = notification.propertyId
            ? workspace.properties.find((item) => item.id === notification.propertyId)
            : undefined;
          const conversationId = notification.conversationId;
          const taskId = notification.taskId;
          return (
            <Card
              key={notification.id}
              className={`border-border/80 bg-card/80 p-4 ${notification.read ? "opacity-70" : "border-primary/30"}`}
            >
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground">{notification.title}</h3>
                    <StatusPill status={notification.priority} />
                    {!notification.read && <span className="text-xs text-primary">Unread</span>}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatPaterhausDateTime(notification.createdAt)} · {property?.name ?? "Portfolio context"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {property && (
                      <Button type="button" variant="outline" size="sm" onClick={() => onPropertySelect?.(property.id)}>
                        Open property
                      </Button>
                    )}
                    {conversationId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onConversationSelect?.(conversationId)}
                      >
                        Open conversation
                      </Button>
                    )}
                    {taskId ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => onTaskSelect?.(taskId)}>
                        <FileCheck2 className="h-4 w-4" /> Open task
                      </Button>
                    ) : (
                      <Button type="button" size="sm" onClick={() => createTask(notification.id)}>
                        <ClipboardPlus className="h-4 w-4" /> Create task
                      </Button>
                    )}
                    {!notification.read && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          workspace.markNotificationRead(notification.id);
                          toast.success("Notification marked read.");
                        }}
                      >
                        <Check className="h-4 w-4" /> Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
