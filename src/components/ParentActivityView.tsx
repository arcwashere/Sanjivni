import { useState, useEffect } from "react";
import { Pill, Footprints, HeartPulse, UtensilsCrossed, Check, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const activityMeta: Record<string, { label: string; icon: typeof Pill; color: string }> = {
  medication: { label: "Medication", icon: Pill, color: "text-blue-500 bg-blue-500/10" },
  morning_walk: { label: "Morning Walk", icon: Footprints, color: "text-green-500 bg-green-500/10" },
  bp_check: { label: "BP Check", icon: HeartPulse, color: "text-red-500 bg-red-500/10" },
  lunch: { label: "Lunch", icon: UtensilsCrossed, color: "text-amber-500 bg-amber-500/10" },
};

const allActivityTypes = ["medication", "morning_walk", "bp_check", "lunch"];

interface Props {
  parentId: string;
  parentName: string;
}

const ParentActivityView = ({ parentId, parentName }: Props) => {
  const [loggedActivities, setLoggedActivities] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchLogs = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("daily_activities")
        .select("activity_type, logged_at")
        .eq("user_id", parentId)
        .gte("logged_at", today.toISOString());

      if (data) {
        const map: Record<string, string> = {};
        data.forEach((d) => { map[d.activity_type] = d.logged_at; });
        setLoggedActivities(map);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [parentId]);

  const completedCount = Object.keys(loggedActivities).length;
  const totalCount = allActivityTypes.length;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          Today's Activities
        </h3>
        <span className="text-xs font-medium text-muted-foreground">
          {completedCount}/{totalCount} done
        </span>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {allActivityTypes.map((type) => {
          const meta = activityMeta[type];
          const loggedAt = loggedActivities[type];
          const done = !!loggedAt;
          const Icon = meta.icon;

          return (
            <div
              key={type}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${
                done ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                {done ? <Check className="w-3.5 h-3.5 text-primary" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <div>
                <p className={`text-xs font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>
                  {meta.label}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {done ? format(new Date(loggedAt), "h:mm a") : "Pending"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ParentActivityView;