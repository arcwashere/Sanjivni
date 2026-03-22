import { useState, useEffect } from "react";
import { Bell, Check, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  reminder_time: string | null;
  is_completed: boolean;
  created_at: string;
}

const ParentReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const fetchReminders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("reminders")
      .select("*")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setReminders(data as Reminder[]);
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const markComplete = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const reminder = reminders.find((r) => r.id === id);

    const { error } = await supabase
      .from("reminders")
      .update({ is_completed: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update reminder");
      return;
    }

    // Log as daily activity
    await supabase.from("daily_activities").insert({
      user_id: user.id,
      activity_type: `Completed reminder: ${reminder?.title || "Unknown"}`,
      notes: reminder?.description || null,
    });

    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_completed: true } : r))
    );
    toast.success("Reminder marked as done!");
  };

  const pending = reminders.filter((r) => !r.is_completed);
  const completed = reminders.filter((r) => r.is_completed);

  return (
    <section>
      <h2 className="section-title mb-3 flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" />
        Reminders
      </h2>

      {reminders.length === 0 ? (
        <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2">
          <Bell className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No reminders yet</p>
          <p className="text-xs text-muted-foreground">Your caregiver can add reminders for you</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
              <button
                onClick={() => markComplete(r.id)}
                className="mt-0.5 w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0 hover:bg-primary/10 transition-colors"
              >
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                {r.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                )}
                {r.reminder_time && (
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(r.reminder_time), "MMM d, h:mm a")}
                  </p>
                )}
              </div>
            </div>
          ))}

          {completed.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground pt-2 font-medium">Completed</p>
              {completed.map((r) => (
                <div key={r.id} className="bg-muted/30 border border-border/50 rounded-xl p-4 flex items-start gap-3 opacity-60">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-through">{r.title}</p>
                    {r.reminder_time && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(r.reminder_time), "MMM d, h:mm a")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default ParentReminders;
