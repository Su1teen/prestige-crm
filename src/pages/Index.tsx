import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import ClientsTab from "@/components/dashboard/ClientsTab";
import HistoryTab from "@/components/dashboard/HistoryTab";
import StatusTab from "@/components/dashboard/StatusTab";
import NotificationsTab from "@/components/dashboard/NotificationsTab";

const tabComponents: Record<string, React.FC> = {
  clients: ClientsTab,
  history: HistoryTab,
  status: StatusTab,
  notifications: NotificationsTab,
};

const Index = () => {
  const [activeTab, setActiveTab] = useState("clients");
  const ActiveComponent = tabComponents[activeTab];

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-8 overflow-y-auto">
        <ActiveComponent />
      </main>
    </div>
  );
};

export default Index;
