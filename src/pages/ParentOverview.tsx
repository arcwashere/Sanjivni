import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, TrendingUp, Calendar, LogOut } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import VitalSigns from "@/components/VitalSigns";
import UpcomingAppointments from "@/components/UpcomingAppointments";
import PhysioProgress from "@/components/PhysioProgress";
import RecentActivity from "@/components/RecentActivity";
import ProgressLeaderboard from "@/components/ProgressLeaderboard";
import AppointmentsList from "@/components/AppointmentsList";
import ConnectionCode from "@/components/ConnectionCode";
import UpdateVitals from "@/components/UpdateVitals";
import DailyActivityLog from "@/components/DailyActivityLog";

const tabs = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "appointments", label: "Appointments", icon: Calendar },
] as const;

type TabId = typeof tabs[number]["id"];

const ParentOverview = () => {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth?role=parent");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      setFullName(data?.full_name || user.user_metadata?.full_name || "");
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-primary text-primary-foreground px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm opacity-80">Parent Dashboard</span>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={handleLogout} className="w-9 h-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <h1 className="text-2xl font-bold">
          {greeting()}, {fullName || "there"} 👋
        </h1>
        <p className="text-sm opacity-80 mt-1">Here's your health summary for today</p>
      </div>

      <div className="px-5 pt-6 space-y-6 max-w-lg mx-auto">
        {activeTab === "overview" && (
          <>
            <VitalSigns />
            <DailyActivityLog />
            <UpdateVitals />
            <ConnectionCode />
            <UpcomingAppointments />
            <PhysioProgress />
            <RecentActivity />
          </>
        )}
        {activeTab === "progress" && <ProgressLeaderboard />}
        {activeTab === "appointments" && <AppointmentsList />}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 flex justify-around items-center max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors ${
              activeTab === tab.id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ParentOverview;
