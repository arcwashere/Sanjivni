import { useNavigate } from "react-router-dom";
import { Dumbbell, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ExerciseSummary {
  exercise_type: string;
  total_reps: number;
}

const exerciseLabels: Record<string, string> = {
  "hands-up": "Hands Up & Stretch",
  "flyaways": "Hand Flyaways",
  "sit-reach": "Sit & Reach",
};

const PhysioProgress = () => {
  const navigate = useNavigate();
  const [totalReps, setTotalReps] = useState(0);
  const [weeklyReps, setWeeklyReps] = useState(0);
  const [exerciseBreakdown, setExerciseBreakdown] = useState<ExerciseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const weeklyGoal = 50;

  useEffect(() => {
    const fetchReps = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      // Get all reps for the user
      const { data: allReps } = await supabase
        .from("exercise_reps")
        .select("exercise_type, rep_count, completed_at")
        .eq("user_id", user.id);

      if (allReps) {
        const total = allReps.reduce((sum, r) => sum + r.rep_count, 0);
        setTotalReps(total);

        const weekly = allReps
          .filter((r) => new Date(r.completed_at) >= weekAgo)
          .reduce((sum, r) => sum + r.rep_count, 0);
        setWeeklyReps(weekly);

        // Breakdown by exercise type
        const map: Record<string, number> = {};
        allReps.forEach((r) => {
          map[r.exercise_type] = (map[r.exercise_type] || 0) + r.rep_count;
        });
        setExerciseBreakdown(
          Object.entries(map).map(([exercise_type, total_reps]) => ({ exercise_type, total_reps }))
        );
      }
      setLoading(false);
    };
    fetchReps();
  }, []);

  const progressPercent = Math.min((weeklyReps / weeklyGoal) * 100, 100);

  return (
    <section>
      <h2 className="section-title mb-3">Physio Progress</h2>
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Exercise Plan</p>
            <p className="text-sm text-muted-foreground">3 exercises • Camera-assisted</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Weekly progress */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Weekly Goal</span>
              <span className="text-sm font-semibold text-primary">
                {weeklyReps} / {weeklyGoal} reps
              </span>
            </div>
            <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Total all-time */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs text-muted-foreground">All-time Total</span>
              <span className="text-lg font-bold text-primary">{totalReps} reps</span>
            </div>

            {/* Per-exercise breakdown */}
            {exerciseBreakdown.length > 0 && (
              <div className="space-y-2 mb-4">
                {exerciseBreakdown.map((ex) => (
                  <div key={ex.exercise_type} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <span className="text-sm text-foreground">
                      {exerciseLabels[ex.exercise_type] || ex.exercise_type}
                    </span>
                    <span className="text-sm font-semibold text-primary">{ex.total_reps}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <button
          onClick={() => navigate("/parent/exercise-plan")}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 font-medium hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          Start Exercise Plan <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};

export default PhysioProgress;
