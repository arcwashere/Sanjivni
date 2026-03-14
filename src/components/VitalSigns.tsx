import { Heart, Droplets, Thermometer } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VitalData {
  heart_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  temperature: number | null;
}

interface VitalSignsProps {
  userId?: string; // optional: if provided, show vitals for this user (caregiver view)
  userName?: string;
}

const VitalSigns = ({ userId, userName: propName }: VitalSignsProps) => {
  const [userName, setUserName] = useState(propName || "");
  const [vitals, setVitals] = useState<VitalData | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(userId || null);

  useEffect(() => {
    const init = async () => {
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        uid = user.id;
        setTargetUserId(uid);

        if (!propName) {
          const { data } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", uid)
            .maybeSingle();
          setUserName(data?.full_name || user.user_metadata?.full_name || "Your");
        }
      }

      // Fetch latest vitals
      const { data: vitalsData } = await supabase
        .from("vital_signs")
        .select("heart_rate, blood_pressure_systolic, blood_pressure_diastolic, temperature")
        .eq("user_id", uid)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (vitalsData) setVitals(vitalsData);
    };
    init();
  }, [userId, propName]);

  // Real-time subscription
  useEffect(() => {
    if (!targetUserId) return;

    const channel = supabase
      .channel(`vitals-${targetUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vital_signs",
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setVitals({
            heart_rate: newData.heart_rate,
            blood_pressure_systolic: newData.blood_pressure_systolic,
            blood_pressure_diastolic: newData.blood_pressure_diastolic,
            temperature: newData.temperature,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId]);

  const vitalCards = [
    {
      label: "Heart Rate",
      value: vitals?.heart_rate?.toString() || "--",
      unit: "bpm",
      icon: Heart,
      color: "bg-red-50 text-[hsl(var(--vital-heart))]",
      border: "border-red-100",
    },
    {
      label: "Blood Pressure",
      value: vitals ? `${vitals.blood_pressure_systolic || "--"}/${vitals.blood_pressure_diastolic || "--"}` : "--/--",
      unit: "mmHg",
      icon: Droplets,
      color: "bg-blue-50 text-[hsl(var(--vital-bp))]",
      border: "border-blue-100",
    },
    {
      label: "Temperature",
      value: vitals?.temperature?.toString() || "--",
      unit: "°F",
      icon: Thermometer,
      color: "bg-amber-50 text-[hsl(var(--vital-temp))]",
      border: "border-amber-100",
    },
  ];

  return (
    <section>
      <h2 className="section-title mb-3">{userName || "Your"}'s Vital Signs</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {vitalCards.map((v) => (
          <div
            key={v.label}
            className={`vital-card flex-shrink-0 snap-start ${v.color} border ${v.border}`}
          >
            <v.icon className="w-6 h-6 mb-2" />
            <p className="text-sm opacity-70">{v.label}</p>
            <p className="text-2xl font-bold mt-1">{v.value}</p>
            <p className="text-xs opacity-60">{v.unit}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default VitalSigns;
