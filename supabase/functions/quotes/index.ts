
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2";

// ✅ templates luxury
import { emailTemplateAdmin, emailTemplateClient } from "./emailTemplates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRole) return json({ error: "Missing Supabase env vars" }, 500);

    const supabase = createClient(supabaseUrl, serviceRole);

    // =========================
    // POST ?action=create-quote
    // =========================
    if (action === "create-quote" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));

      const name = String(body?.name || "").trim();
      const email = String(body?.email || "").trim();
      const message = String(body?.message || "").trim();
      const currency = String(body?.currency || "CAD").trim(); // ✅

      if (!name || !email || !message) return json({ error: "Missing fields" }, 400);

      // 1) Save in DB
      const { data: inserted, error: dbErr } = await supabase
        .from("quotes")
        .insert({ name, email, message, currency })
        .select("id, created_at")
        .single();

      if (dbErr) return json({ error: dbErr.message }, 500);

      // 2) Send emails with Resend
      const resendKey = Deno.env.get("RESEND_API_KEY");
      const adminEmail = Deno.env.get("ADMIN_EMAIL"); // e.g. karitovalenzuela88@gmail.com
      const fromEmail = Deno.env.get("RESEND_FROM");  // e.g. "Caro Flower Art <quotes@caroflower.com>"

      if (!resendKey || !adminEmail || !fromEmail) {
        // DB saved, but emails not configured
        return json({
          ok: true,
          saved: true,
          emailed: false,
          warning: "Missing RESEND_API_KEY / ADMIN_EMAIL / RESEND_FROM env vars",
          quote_id: inserted?.id,
        });
      }

      const resend = new Resend(resendKey);

      // Email to client
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: "Caro Flower Art — Request received ✿ / Solicitud recibida ✿",
        html: emailTemplateClient({ name, email, message, currency }),
      });

      // Email to you (admin)
      await resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: `New quote request — ${name}`,
        reply_to: email, // ✅ so you can reply directly
        html: emailTemplateAdmin({
          name,
          email,
          message,
          currency,
          createdAt: inserted?.created_at || new Date().toISOString(),
        }),
      });

      return json({
        ok: true,
        saved: true,
        emailed: true,
        quote_id: inserted?.id,
      });
    }

    // =======================
    // GET ?action=list-quotes
    // =======================
    if (action === "list-quotes" && req.method === "GET") {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
