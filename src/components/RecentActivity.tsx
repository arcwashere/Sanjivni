import { useState, useEffect } from "react";
import { Pill, Footprints, HeartPulse, UtensilsCrossed, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const activityConfig: Record<string, { icon: typeof Activity; label: string; color: string }> = {
  medication: { icon: Pill, label: "Took medication", color: "text-blue-500" },
  morning_walk: { icon: Footprints, label: "Morning walk completed", color: "text-green-500" },
  bp_check: { icon: HeartPulse, label: "Blood pressure checked", color: "text-red-500" },
  lunch: { icon: UtensilsCrossed, label: "Lunch logged", color: "text-amber-500" },
};

const RecentActivity = () => {
  const [activities, setActivities] = useState<{ type: string; time: Date }[]>([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("daily_activities")
      .select("activity_type, logged_at")
      .eq("user_id", user.id)
      .gte("logged_at", today.toISOString())
      .order("logged_at", { ascending: false });

    if (data) {
      setActivities(data.map((d) => ({ type: d.activity_type, time: new Date(d.logged_at) })));
    }
  };

  if (activities.length === 0) {
    return (
      <section>
        <h2 className="section-title mb-3">Recent Activity</h2>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">No activities logged today</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="section-title mb-3">Recent Activity</h2>
      <div className="space-y-2">
        {activities.map((a, i) => {
          const config = activityConfig[a.type] || { icon: Activity, label: a.type, color: "text-primary" };
          const Icon = config.icon;

          return (
            <div key={i} className="flex items-center gap-3 py-2.5 px-1">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <p className="flex-1 text-sm text-foreground">{config.label}</p>
              <span className="text-xs text-muted-foreground shrink-0">
                {format(a.time, "h:mm a")}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default RecentActivity;