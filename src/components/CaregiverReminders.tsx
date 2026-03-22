import { useState, useEffect } from "react";
import { Bell, Plus, Check, Clock, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  reminder_time: string | null;
  is_completed: boolean;
  created_at: string;
}

interface Props {
  parentId: string;
  parentName: string;
}

const CaregiverReminders = ({ parentId, parentName }: Props) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReminders = async () => {
    const { data } = await supabase
      .from("reminders")
      .select("*")
      .eq("parent_id", parentId)
      .order("created_at", { ascending: false });

    if (data) setReminders(data as Reminder[]);
  };

  useEffect(() => {
    fetchReminders();
  }, [parentId]);

  const addReminder = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const { error } = await supabase.from("reminders").insert({
      parent_id: parentId,
      caregiver_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      reminder_time: reminderTime || null,
    });

    if (error) {
      toast.error("Failed to add reminder");
    } else {
      toast.success("Reminder added!");
      setTitle("");
      setDescription("");
      setReminderTime("");
      setShowForm(false);
      fetchReminders();
    }
    setSubmitting(false);
  };

  const pending = reminders.filter((r) => !r.is_completed);
  const completed = reminders.filter((r) => r.is_completed);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Reminders for {parentName}
        </h2>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <Input
            placeholder="Reminder title (e.g. Take medication)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[60px]"
          />
          <Input
            type="datetime-local"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={addReminder} disabled={submitting} size="sm">
              {submitting ? "Adding..." : "Add Reminder"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {reminders.length === 0 && !showForm ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">No reminders yet. Add one for {parentName}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
              <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-primary/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
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
              <p className="text-xs text-muted-foreground pt-2 font-medium">Completed by parent</p>
              {completed.map((r) => (
                <div key={r.id} className="bg-muted/30 border border-border/50 rounded-xl p-4 flex items-start gap-3 opacity-60">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground line-through">{r.title}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default CaregiverReminders;
