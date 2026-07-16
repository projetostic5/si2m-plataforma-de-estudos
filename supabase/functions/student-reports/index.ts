import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const examResult = await supabase
      .from("exams")
      .select("id, name")
      .eq("counts_for_study_plan", true)
      .order("name");

    const exams = examResult.data || [];
    const examIds = exams.map((e) => e.id);

    const { data: students, error: studentsError } = await supabase
      .from("profiles")
      .select("id, full_name, created_at")
      .eq("role", "student")
      .order("full_name");

    if (studentsError) throw studentsError;

    const { data: attempts, error: attemptsError } = await supabase
      .from("exam_attempts")
      .select("user_id, exam_id, completed_at, percentage, passed")
      .in("exam_id", examIds)
      .not("completed_at", "is", null);

    if (attemptsError) throw attemptsError;

    const { data: plans, error: plansError } = await supabase
      .from("study_plan_versions")
      .select("user_id, created_at, completed_at");

    if (plansError) throw plansError;

    const userIds = students.map((s) => s.id);
    const { data: authUsers } = await supabase.auth.admin.listUsers();

    const emailMap = new Map<string, string>();
    for (const u of authUsers.users) {
      emailMap.set(u.id, u.email || "");
    }

    const attemptMap = new Map<string, Record<string, { percentage: number; passed: boolean; completed_at: string }>>();
    for (const a of attempts || []) {
      if (!attemptMap.has(a.user_id)) attemptMap.set(a.user_id, {});
      attemptMap.get(a.user_id)![a.exam_id] = {
        percentage: Number(a.percentage),
        passed: a.passed,
        completed_at: a.completed_at,
      };
    }

    const planMap = new Map<string, string>();
    for (const p of plans || []) {
      if (!planMap.has(p.user_id)) planMap.set(p.user_id, p.created_at);
    }

    const report = students.map((s) => {
      const userAttempts = attemptMap.get(s.id) || {};
      const examStatus = exams.map((exam) => ({
        exam_id: exam.id,
        exam_name: exam.name,
        completed: !!userAttempts[exam.id],
        percentage: userAttempts[exam.id]?.percentage ?? null,
        passed: userAttempts[exam.id]?.passed ?? null,
        completed_at: userAttempts[exam.id]?.completed_at ?? null,
      }));
      const allExamsDone = examStatus.every((e) => e.completed);
      return {
        id: s.id,
        full_name: s.full_name,
        email: emailMap.get(s.id) || "",
        created_at: s.created_at,
        exams: examStatus,
        all_exams_completed: allExamsDone,
        has_study_plan: planMap.has(s.id),
        study_plan_created_at: planMap.get(s.id) || null,
      };
    });

    return new Response(JSON.stringify({ students: report, exams }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
