import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Users, Link2, UserPlus, User, Dumbbell, ChevronRight, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import VitalSigns from "@/components/VitalSigns";
import NotificationBell from "@/components/NotificationBell";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import ParentActivityView from "@/components/ParentActivityView";

interface ConnectedParent {
  parent_id: string;
  full_name: string;
}

const CaregiverDashboard = () => {
  const [fullName, setFullName] = useState("");
  const [connectedParents, setConnectedParents] = useState<ConnectedParent[]>([]);
  const [selectedParent, setSelectedParent] = useState<ConnectedParent | null>(null);
  const [codeInput, setCodeInput] = useState(["", "", "", ""]);
  const [connecting, setConnecting] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth?role=caregiver");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      setFullName(profile?.full_name || user.user_metadata?.full_name || "");

      const { data: connections } = await supabase
        .from("caregiver_connections")
        .select("parent_id")
        .eq("caregiver_id", user.id);

      if (connections && connections.length > 0) {
        const parentIds = connections.map((c) => c.parent_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", parentIds);

        const parents =
          profiles?.map((p) => ({
            parent_id: p.user_id,
            full_name: p.full_name || "Unknown",
          })) || [];
        setConnectedParents(parents);
        if (parents.length > 0) setSelectedParent(parents[0]);
      }
    };
    fetchData();
  }, [navigate]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...codeInput];
    newCode[index] = value;
    setCodeInput(newCode);
    if (value && index < 3) {
      document.getElementById(`code-input-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codeInput[index] && index > 0) {
      document.getElementById(`code-input-${index - 1}`)?.focus();
    }
  };

  const connectWithCode = async () => {
    const code = codeInput.join("");
    if (code.length !== 4) {
      toast.error("Please enter a 4-digit code");
      return;
    }
    setConnecting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setConnecting(false);
      return;
    }

    const { data: codeData } = await supabase
      .from("connection_codes")
      .select("id, parent_id")
      .eq("code", code)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!codeData) {
      toast.error("Invalid or expired code");
      setConnecting(false);
      return;
    }
    if (codeData.parent_id === user.id) {
      toast.error("You cannot connect to yourself");
      setConnecting(false);
      return;
    }

    const { error: connError } = await supabase
      .from("caregiver_connections")
      .insert({ caregiver_id: user.id, parent_id: codeData.parent_id });

    if (connError) {
      toast.error(
        connError.code === "23505"
          ? "Already connected to this parent"
          : "Failed to connect"
      );
      setConnecting(false);
      return;
    }

    await supabase
      .from("connection_codes")
      .update({ is_used: true })
      .eq("id", codeData.id);

    const { data: parentProfile } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("user_id", codeData.parent_id)
      .maybeSingle();

    const newParent: ConnectedParent = {
      parent_id: codeData.parent_id,
      full_name: parentProfile?.full_name || "Unknown",
    };

    setConnectedParents((prev) => [...prev, newParent]);
    setSelectedParent(newParent);
    setCodeInput(["", "", "", ""]);
    setShowCodeInput(false);
    toast.success(`Connected to ${newParent.full_name}!`);
    setConnecting(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-primary text-primary-foreground px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm opacity-80">Caregiver Dashboard</span>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <h1 className="text-2xl font-bold">Welcome, {fullName || "Caregiver"} 👋</h1>
      </div>

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel defaultSize={isMobile ? 42 : 28} minSize={20} maxSize={45}>
            <aside className="h-full border-r border-border bg-card flex flex-col">
              <div className="px-4 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  My Parents
                </h2>
                <button
                  onClick={() => setShowCodeInput(!showCodeInput)}
                  className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                  title="Add parent"
                >
                  <UserPlus className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>

              {showCodeInput && (
                <div className="px-4 py-3 border-b border-border bg-muted/30 space-y-3">
                  <p className="text-xs text-muted-foreground">Enter 4-digit code</p>
                  <div className="flex gap-2">
                    {codeInput.map((digit, i) => (
                      <input
                        key={i}
                        id={`code-input-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className="w-10 h-11 text-center text-lg font-bold rounded-lg border-2 border-input bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-ring outline-none transition-all"
                      />
                    ))}
                  </div>
                  <button
                    onClick={connectWithCode}
                    disabled={connecting || codeInput.join("").length !== 4}
                    className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {connecting ? "Connecting..." : "Connect"}
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                {connectedParents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <Link2 className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">No parents connected yet</p>
                    <button
                      onClick={() => setShowCodeInput(true)}
                      className="mt-3 text-xs text-primary font-medium hover:underline"
                    >
                      + Add a parent
                    </button>
                  </div>
                ) : (
                  connectedParents.map((parent) => {
                    const isSelected = selectedParent?.parent_id === parent.parent_id;
                    return (
                      <button
                        key={parent.parent_id}
                        onClick={() => setSelectedParent(parent)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-border/50 ${
                          isSelected ? "bg-primary/8 border-l-[3px] border-l-primary" : "hover:bg-accent/50"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {getInitials(parent.full_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                            {parent.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">Connected</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      </button>
                    );
                  })
                )}
              </div>
            </aside>
          </ResizablePanel>

          {!isMobile && <ResizableHandle withHandle />}

          <ResizablePanel defaultSize={isMobile ? 58 : 72} minSize={55}>
            <main className="h-full overflow-y-auto">
              {selectedParent ? (
                <div className="p-6 space-y-6 max-w-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                      {getInitials(selectedParent.full_name)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedParent.full_name}</h2>
                      <p className="text-sm text-muted-foreground">Health overview & exercise progress</p>
                    </div>
                  </div>

                  <VitalSigns userId={selectedParent.parent_id} userName={selectedParent.full_name} />

                  <ParentActivityView parentId={selectedParent.parent_id} parentName={selectedParent.full_name} />

                  <section className="space-y-3">
                    <h2 className="section-title flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-primary" />
                      Exercise Progress
                    </h2>
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Weekly Progress</span>
                        <span className="text-sm font-semibold text-primary">12 / 21 reps</span>
                      </div>
                      <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: "57%" }} />
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-2">
                        {[
                          { name: "Arm Raises", done: 5, total: 7, emoji: "💪" },
                          { name: "Leg Lifts", done: 4, total: 7, emoji: "🦵" },
                          { name: "Stretches", done: 3, total: 7, emoji: "🧘" },
                        ].map((ex) => (
                          <div key={ex.name} className="bg-muted/50 rounded-xl p-3 text-center">
                            <span className="text-2xl">{ex.emoji}</span>
                            <p className="text-xs font-medium text-foreground mt-1">{ex.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{ex.done}/{ex.total} days</p>
                            <div className="w-full h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${(ex.done / ex.total) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Select a Parent</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Choose a parent from the list on the left to view their vitals and exercise progress
                  </p>
                </div>
              )}
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default CaregiverDashboard;
