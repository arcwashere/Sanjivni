import { useState } from "react";
import { Heart, Droplets, Thermometer, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UpdateVitals = () => {
  const [heartRate, setHeartRate] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [temperature, setTemperature] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);

    const vitalsData = {
      user_id: user.id,
      heart_rate: heartRate ? parseInt(heartRate) : null,
      blood_pressure_systolic: systolic ? parseInt(systolic) : null,
      blood_pressure_diastolic: diastolic ? parseInt(diastolic) : null,
      temperature: temperature ? parseFloat(temperature) : null,
    };

    const { error } = await supabase.from("vital_signs").insert(vitalsData);

    if (error) {
      toast.error("Failed to save vitals");
      setSaving(false);
      return;
    }

    // Trigger email notification to caregivers
    const { error: notifyError } = await supabase.functions.invoke("notify-caregiver", {
      body: {
        type: "vitals",
        parent_id: user.id,
        data: {
          heart_rate: vitalsData.heart_rate,
          blood_pressure_systolic: vitalsData.blood_pressure_systolic,
          blood_pressure_diastolic: vitalsData.blood_pressure_diastolic,
          temperature: vitalsData.temperature,
        },
      },
    });

    if (notifyError) {
      toast.warning("Vitals saved, but email could not be delivered yet.");
    } else {
      toast.success("Vitals updated! Your caregiver has been notified.");
    }
    setHeartRate("");
    setSystolic("");
    setDiastolic("");
    setTemperature("");
    setSaving(false);
  };

  return (
    <section className="space-y-3">
      <h2 className="section-title">Update Your Vitals</h2>
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Heart className="w-5 h-5 text-[hsl(var(--vital-heart))]" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Heart Rate (bpm)</label>
            <input
              type="number"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              placeholder="72"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-[hsl(var(--vital-bp))]" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Blood Pressure (mmHg)</label>
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                placeholder="120"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none"
              />
              <span className="self-center text-muted-foreground">/</span>
              <input
                type="number"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                placeholder="80"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Thermometer className="w-5 h-5 text-[hsl(var(--vital-temp))]" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Temperature (°F)</label>
            <input
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="98.6"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || (!heartRate && !systolic && !temperature)}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save & Notify Caregiver"}
        </button>
      </div>
    </section>
  );
};

export default UpdateVitals;
