import { useNavigate } from "react-router-dom";
import { Dumbbell, ArrowRight } from "lucide-react";

const PhysioProgress = () => {
  const navigate = useNavigate();

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
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Weekly Progress</span>
          <span className="text-sm font-semibold text-primary">12 / 21 reps</span>
        </div>
        <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden mb-4">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: "57%" }} />
        </div>
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
