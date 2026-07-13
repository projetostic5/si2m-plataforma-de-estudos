import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface UserInput {
  full_name: string;
  email: string;
  password?: string;
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  let pw = "";
  for (let i = 0; i < 10; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (callerProfile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const users: UserInput[] = body.users;
    // sendInvite=true → inviteUserByEmail (student sets own password via email link)
    // sendInvite=false → createUser with generated temp password (shown to admin)
    const sendInvite: boolean = body.sendInvite === true;

    if (!Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ error: "Informe uma lista de usuários válida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const u of users) {
      const email = u.email?.trim().toLowerCase();
      const full_name = u.full_name?.trim();

      if (!email || !full_name) {
        results.push({ email, full_name, success: false, error: "Nome ou email inválido", password: null });
        continue;
      }

      let userId: string;

      if (sendInvite) {
        // Invite flow: Supabase sends email with password-reset link
        const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          email,
          { data: { full_name } }
        );

        if (inviteError) {
          results.push({ email, full_name, success: false, error: inviteError.message, password: null });
          continue;
        }
        userId = invited.user.id;
      } else {
        // Temp password flow: admin sees password in UI
        const password = u.password?.trim() || generatePassword();
        const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (createError) {
          results.push({ email, full_name, success: false, error: createError.message, password: null });
          continue;
        }
        userId = created.user.id;

        // Check if profile already exists (re-run safety)
        const { data: existing } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (!existing) {
          const { error: profileError } = await supabaseAdmin.from("profiles").insert({
            id: userId,
            full_name,
            role: "student",
          });

          if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(userId);
            results.push({ email, full_name, success: false, error: profileError.message, password: null });
            continue;
          }
        }

        results.push({ email, full_name, success: true, error: null, password });
        continue;
      }

      // Insert profile for invite flow
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (!existing) {
        const { error: profileError } = await supabaseAdmin.from("profiles").insert({
          id: userId,
          full_name,
          role: "student",
        });

        if (profileError) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
          results.push({ email, full_name, success: false, error: profileError.message, password: null });
          continue;
        }
      }

      results.push({ email, full_name, success: true, error: null, password: null });
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
