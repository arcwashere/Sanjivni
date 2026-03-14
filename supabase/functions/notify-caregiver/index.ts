import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { type, parent_id, data } = await req.json();

    // Create admin client to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get parent name
    const { data: parentProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", parent_id)
      .maybeSingle();

    const parentName = parentProfile?.full_name || "Your connected parent";

    // Get connected caregivers
    const { data: connections } = await supabase
      .from("caregiver_connections")
      .select("caregiver_id")
      .eq("parent_id", parent_id);

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ message: "No caregivers to notify" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get caregiver emails
    const caregiverIds = connections.map((c) => c.caregiver_id);
    const emailPromises = caregiverIds.map(async (id) => {
      const { data: { user } } = await supabase.auth.admin.getUserById(id);
      return user?.email;
    });
    const emails = (await Promise.all(emailPromises)).filter(Boolean) as string[];

    if (emails.length === 0) {
      return new Response(JSON.stringify({ message: "No caregiver emails found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build email content based on type
    let subject = "";
    let htmlBody = "";

    if (type === "vitals") {
      subject = `${parentName}'s Vital Signs Updated`;
      htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #2d6a4f; margin-bottom: 16px;">💓 Vital Signs Update</h2>
          <p style="color: #555; margin-bottom: 16px;">${parentName}'s vitals have been recorded:</p>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
            <p style="margin: 8px 0;"><strong>Heart Rate:</strong> ${data?.heart_rate || "--"} bpm</p>
            <p style="margin: 8px 0;"><strong>Blood Pressure:</strong> ${data?.blood_pressure_systolic || "--"}/${data?.blood_pressure_diastolic || "--"} mmHg</p>
            <p style="margin: 8px 0;"><strong>Temperature:</strong> ${data?.temperature || "--"} °F</p>
          </div>
          <p style="color: #888; font-size: 12px;">This is an automated notification from your health monitoring app.</p>
        </div>
      `;
    } else if (type === "exercise") {
      subject = `${parentName} Completed an Exercise! 🏋️`;
      htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #2d6a4f; margin-bottom: 16px;">🏋️ Exercise Completed</h2>
          <p style="color: #555; margin-bottom: 16px;">${parentName} has completed their exercise: <strong>${data?.exercise_name || "an exercise"}</strong></p>
          <p style="color: #888; font-size: 12px;">This is an automated notification from your health monitoring app.</p>
        </div>
      `;
    }

    // Send emails via Resend and validate each response
    const sendResults = await Promise.all(
      emails.map(async (email) => {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Health Monitor <onboarding@resend.dev>",
            to: email,
            subject,
            html: htmlBody,
          }),
        });

        const raw = await response.text();
        let parsed: Record<string, unknown> | null = null;
        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch {
          parsed = { raw };
        }

        return {
          email,
          ok: response.ok,
          status: response.status,
          body: parsed,
        };
      })
    );

    const failed = sendResults.filter((r) => !r.ok);
    if (failed.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Some emails failed to send",
          failed,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: `Emails sent to ${sendResults.length} caregiver(s)`,
        results: sendResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
