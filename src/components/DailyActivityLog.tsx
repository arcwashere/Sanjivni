import { useState, useEffect } from "react";
import { Pill, Footprints, HeartPulse, UtensilsCrossed, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const activities = [
  { id: "medication", label: "Medication", icon: Pill, color: "text-blue-500 bg-blue-500/10" },
  { id: "morning_walk", label: "Morning Walk", icon: Footprints, color: "text-green-500 bg-green-500/10" },
  { id: "bp_check", label: "BP Check", icon: HeartPulse, color: "text-red-500 bg-red-500/10" },
  { id: "lunch", label: "Lunch", icon: UtensilsCrossed, color: "text-amber-500 bg-amber-500/10" },
];

const DailyActivityLog = () => {
  const [loggedToday, setLoggedToday] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayLogs();
  }, []);

  const fetchTodayLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("daily_activities")
      .select("activity_type")
      .eq("user_id", user.id)
      .gte("logged_at", today.toISOString());

    if (data) {
      setLoggedToday(data.map((d) => d.activity_type));
    }
  };

  const logActivity = async (activityType: string) => {
    if (loggedToday.includes(activityType)) return;

    setLoading(activityType);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("daily_activities")
      .insert({ user_id: user.id, activity_type: activityType });

    if (error) {
      toast.error("Failed to log activity");
    } else {
      setLoggedToday((prev) => [...prev, activityType]);
      const label = activities.find((a) => a.id === activityType)?.label;
      toast.success(`${label} logged ✓`);
    }
    setLoading(null);
  };

  const completedCount = loggedToday.length;
  const totalCount = activities.length;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Daily Activities</h2>
        <span className="text-xs font-medium text-muted-foreground">
          {completedCount}/{totalCount} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {activities.map((activity) => {
          const done = loggedToday.includes(activity.id);
          const isLoading = loading === activity.id;

          return (
            <button
              key={activity.id}
              onClick={() => logActivity(activity.id)}
              disabled={done || isLoading}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                done
                  ? "bg-primary/5 border-primary/20 opacity-80"
                  : "bg-card border-border hover:border-primary/40 hover:shadow-sm"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${activity.color}`}>
                {done ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <activity.icon className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {activity.label}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {done ? "Done ✓" : "Tap to log"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DailyActivityLog;
