import { useNavigate } from "react-router-dom";
import { Heart, Users } from "lucide-react";

const IntroPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center mb-12">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Sanjivni</h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Bringing families closer through compassionate elder care
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={() => navigate("/auth?role=caregiver")}
          className="w-full group relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7" />
            </div>
            <div className="text-left">
              <p className="text-xl font-semibold">I'm a Caregiver</p>
              <p className="text-sm opacity-80">Manage & monitor loved ones</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/auth?role=parent")}
          className="w-full group relative overflow-hidden rounded-2xl bg-card border-2 border-primary/30 p-6 text-foreground transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary/60 active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Heart className="w-7 h-7 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-xl font-semibold">I'm a Parent</p>
              <p className="text-sm text-muted-foreground">Track my health & wellness</p>
            </div>
          </div>
        </button>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Your health, your family, connected.
      </p>
    </div>
  );
};

export default IntroPage;
