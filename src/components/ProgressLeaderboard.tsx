import { useState, useEffect } from "react";
import { Trophy, Medal, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  name: string;
  count: number;
  rank: number;
  isYou: boolean;
}

const rankColors: Record<number, string> = {
  1: "bg-yellow-100 text-yellow-700",
  2: "bg-gray-100 text-gray-600",
  3: "bg-orange-100 text-orange-600",
};

const ProgressLeaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all parent profiles
      const { data: parents } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("role", "parent");

      if (!parents || parents.length === 0) {
        setLoading(false);
        return;
      }

      // Get this week's activities for all parents
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      const parentIds = parents.map((p) => p.user_id);
      const { data: activities } = await supabase
        .from("daily_activities")
        .select("user_id")
        .in("user_id", parentIds)
        .gte("logged_at", weekAgo.toISOString());

      // Count per user
      const countMap: Record<string, number> = {};
      parentIds.forEach((id) => (countMap[id] = 0));
      activities?.forEach((a) => {
        countMap[a.user_id] = (countMap[a.user_id] || 0) + 1;
      });

      // Build sorted leaderboard
      const sorted = parents
        .map((p) => ({
          name: p.full_name || "Unknown",
          count: countMap[p.user_id] || 0,
          isYou: p.user_id === user.id,
          rank: 0,
        }))
        .sort((a, b) => b.count - a.count)
        .map((e, i) => ({ ...e, rank: i + 1 }));

      setEntries(sorted);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="section-title">Leaderboard</h2>
        <span className="text-xs text-muted-foreground ml-auto">This week</span>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No activity yet this week</p>
      ) : (
        <div className="space-y-2">
          {entries.map((u) => (
            <div
              key={u.rank}
              className={`glass-card rounded-xl p-4 flex items-center gap-3 ${
                u.isYou ? "ring-2 ring-primary/30" : ""
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                  rankColors[u.rank] || "bg-muted text-muted-foreground"
                }`}
              >
                {u.rank <= 3 ? <Medal className="w-4 h-4" /> : u.rank}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {u.name} {u.isYou && <span className="text-xs text-primary font-normal">(You)</span>}
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-primary">{u.count}</span>
                <span className="text-xs text-muted-foreground ml-1">logs</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressLeaderboard;
