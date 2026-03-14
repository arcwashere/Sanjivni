import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Copy, RefreshCw, Link2 } from "lucide-react";
import { toast } from "sonner";

const ConnectionCode = () => {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectedCaregivers, setConnectedCaregivers] = useState<string[]>([]);

  const fetchExistingCode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("connection_codes")
      .select("code, is_used, expires_at")
      .eq("parent_id", user.id)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) setCode(data.code);

    // Fetch connected caregivers
    const { data: connections } = await supabase
      .from("caregiver_connections")
      .select("caregiver_id")
      .eq("parent_id", user.id);

    if (connections && connections.length > 0) {
      const caregiverIds = connections.map((c) => c.caregiver_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("full_name")
        .in("user_id", caregiverIds);
      setConnectedCaregivers(
        profiles?.map((p) => p.full_name || "Unknown Caregiver") || []
      );
    }
  };

  useEffect(() => {
    fetchExistingCode();
  }, []);

  const generateCode = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const newCode = String(Math.floor(1000 + Math.random() * 9000));

    const { error } = await supabase.from("connection_codes").insert({
      parent_id: user.id,
      code: newCode,
    });

    if (error) {
      toast.error("Failed to generate code");
    } else {
      setCode(newCode);
      toast.success("Connection code generated!");
    }
    setLoading(false);
  };

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard!");
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="section-title flex items-center gap-2">
        <Link2 className="w-5 h-5 text-primary" />
        Caregiver Connection
      </h2>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        {code ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Share this code with your caregiver
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="flex gap-2">
                {code.split("").map((digit, i) => (
                  <div
                    key={i}
                    className="w-12 h-14 rounded-xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-2xl font-bold text-primary"
                  >
                    {digit}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 text-sm text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button
                onClick={generateCode}
                disabled={loading}
                className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-lg hover:bg-muted/80 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> New Code
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Expires in 24 hours</p>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate a code to connect with your caregiver
            </p>
            <button
              onClick={generateCode}
              disabled={loading}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              {loading ? "Generating..." : "Generate Connection Code"}
            </button>
          </div>
        )}

        {connectedCaregivers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Connected Caregivers</p>
            <div className="flex flex-wrap gap-2">
              {connectedCaregivers.map((name, i) => (
                <span
                  key={i}
                  className="text-xs bg-accent text-accent-foreground px-3 py-1 rounded-full"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ConnectionCode;
