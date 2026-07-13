import { supabase } from './supabase';
import type { StudentProfile } from './supabase';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SimuladoResult {
  examName: string;
  attemptId: string;
  percentage: number;
  completedAt: string;
  wrongCount: number;
}

export interface WrongItem {
  questionId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  dimensionId: string;
  dimensionName: string;
  themeId: string;
  themeName: string;
  topicName?: string;
  source: string;
}

export interface ThemeBlock {
  dimensionId: string;
  dimensionName: string;
  themeId: string;
  themeName: string;
  topicName?: string;
  wrongCount: number;
  minutes: number;
  sources: string[];
}

export interface StudyDay {
  date: Date;
  dayIndex: number;
  blocks: ThemeBlock[];
  totalMinutes: number;
  capacityMinutes: number;
}

export interface StudyPlanData {
  studyDays: Array<Omit<StudyDay, 'date'> & { date: string }>;
  dimensionTotals: Array<{ name: string; minutes: number }>;
  totalWrong: number;
  simuladoResults: SimuladoResult[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

export const KNOWLEDGE_MULT: Record<string, number> = { basic: 1.5, intermediate: 1.0, advanced: 0.7 };
export const DIFF_MULT: Record<string, number> = { easy: 0.7, medium: 1.0, hard: 1.3 };
export const BASE_MIN = 45;
export const EFFICIENCY = 0.85;

// ── Helpers ────────────────────────────────────────────────────────────────────

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(1, Math.ceil((target.getTime() - today.getTime()) / 86_400_000));
}

export function getDefault30DaysDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

export function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
}

export function generatePlan(
  wrongItems: WrongItem[],
  hoursPerDay: number,
  daysRemaining: number,
  knowledgeLevel: 'basic' | 'intermediate' | 'advanced',
): StudyDay[] {
  const kMult = KNOWLEDGE_MULT[knowledgeLevel] ?? 1.0;
  const capacityPerDay = Math.round(hoursPerDay * 60 * EFFICIENCY);

  const map: Record<string, {
    dimensionId: string;
    dimensionName: string;
    themeId: string;
    themeName: string;
    topicName?: string;
    wrongCount: number;
    rawMinutes: number;
    sources: Set<string>;
  }> = {};

  for (const item of wrongItems) {
    const key = item.themeId;
    if (!map[key]) {
      map[key] = {
        dimensionId: item.dimensionId,
        dimensionName: item.dimensionName,
        themeId: item.themeId,
        themeName: item.themeName,
        topicName: item.topicName,
        wrongCount: 0,
        rawMinutes: 0,
        sources: new Set(),
      };
    }
    const dMult = DIFF_MULT[item.difficulty] ?? 1.0;
    map[key].wrongCount++;
    map[key].rawMinutes += BASE_MIN * kMult * dMult;
    map[key].sources.add(item.source);
  }

  let themes = Object.values(map).sort((a, b) => b.rawMinutes - a.rawMinutes);

  const totalRaw = themes.reduce((s, t) => s + t.rawMinutes, 0);
  const totalCapacity = daysRemaining * capacityPerDay;
  const scale = totalRaw > totalCapacity ? totalCapacity / totalRaw : 1;

  themes = themes.map(t => ({
    ...t,
    rawMinutes: Math.max(30, Math.round((t.rawMinutes * scale) / 15) * 15),
  }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: StudyDay[] = [];
  let dayIdx = 0;
  let dayMinutes = 0;
  let dayBlocks: ThemeBlock[] = [];

  const commitDay = () => {
    if (dayBlocks.length > 0) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayIdx);
      days.push({ date, dayIndex: dayIdx, blocks: dayBlocks, totalMinutes: dayMinutes, capacityMinutes: capacityPerDay });
    }
    dayIdx++;
    dayMinutes = 0;
    dayBlocks = [];
  };

  for (const theme of themes) {
    let remaining = theme.rawMinutes;
    while (remaining > 0 && dayIdx < daysRemaining) {
      const available = capacityPerDay - dayMinutes;
      if (available < 15) { commitDay(); continue; }
      const alloc = Math.min(remaining, available);
      dayBlocks.push({
        dimensionId: theme.dimensionId,
        dimensionName: theme.dimensionName,
        themeId: theme.themeId,
        themeName: theme.themeName,
        topicName: theme.topicName,
        wrongCount: theme.wrongCount,
        minutes: alloc,
        sources: Array.from(theme.sources),
      });
      dayMinutes += alloc;
      remaining -= alloc;
      if (dayMinutes >= capacityPerDay) commitDay();
    }
  }

  if (dayBlocks.length > 0) commitDay();
  return days;
}

// ── Fetch wrong items & build plan data ───────────────────────────────────────

async function buildPlanData(
  userId: string,
  studentProfile: StudentProfile | null,
): Promise<StudyPlanData | null> {
  const { data: exams } = await supabase
    .from('exams')
    .select('id, name')
    .eq('counts_for_study_plan', true)
    .eq('is_active', true);

  if (!exams?.length) return null;

  const { data: allAttempts } = await supabase
    .from('exam_attempts')
    .select('id, exam_id, percentage, completed_at')
    .eq('user_id', userId)
    .in('exam_id', exams.map(e => e.id))
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  if (!allAttempts?.length) return null;

  const latestMap: Record<string, typeof allAttempts[0]> = {};
  for (const a of allAttempts) {
    if (!latestMap[a.exam_id]) latestMap[a.exam_id] = a;
  }
  const latestAttempts = Object.values(latestMap);

  const examNameById: Record<string, string> = {};
  for (const e of exams) examNameById[e.id] = e.name;

  const { data: answers } = await supabase
    .from('exam_answers')
    .select(`
      id,
      attempt_id,
      is_correct,
      question:questions(
        id,
        difficulty,
        dimension:dimensions(id, name),
        theme:themes(id, name),
        topic:topics(id, name)
      )
    `)
    .in('attempt_id', latestAttempts.map(a => a.id))
    .eq('is_correct', false);

  const simuladoResults: SimuladoResult[] = latestAttempts
    .map(a => ({
      examName: examNameById[a.exam_id] ?? '?',
      attemptId: a.id,
      percentage: a.percentage,
      completedAt: a.completed_at,
      wrongCount: answers?.filter(ans => ans.attempt_id === a.id).length ?? 0,
    }))
    .sort((a, b) => a.examName.localeCompare(b.examName));

  const attemptToSource: Record<string, string> = {};
  for (const a of latestAttempts) {
    attemptToSource[a.id] = (examNameById[a.exam_id] ?? '').replace('SIMULADO ', '');
  }

  const wrongItems: WrongItem[] = (answers ?? [])
    .filter(a => a.question)
    .map(a => {
      const q = a.question as any;
      return {
        questionId: q.id,
        difficulty: q.difficulty ?? 'medium',
        dimensionId: q.dimension?.id ?? '',
        dimensionName: q.dimension?.name ?? 'Sem dimensão',
        themeId: q.theme?.id ?? '',
        themeName: q.theme?.name ?? 'Sem tema',
        topicName: q.topic?.name,
        source: attemptToSource[a.attempt_id] ?? '?',
      };
    })
    .filter(w => w.themeId);

  if (!wrongItems.length) return null;

  const hoursPerDay = studentProfile?.hours_per_day ?? 3;
  const examDate = studentProfile?.next_exam_date ?? getDefault30DaysDate();
  const daysLeft = daysUntil(examDate);
  const kLevel = (studentProfile?.knowledge_level ?? 'intermediate') as 'basic' | 'intermediate' | 'advanced';

  const studyDays = generatePlan(wrongItems, hoursPerDay, daysLeft, kLevel);

  const dimMap: Record<string, number> = {};
  for (const day of studyDays) {
    for (const b of day.blocks) {
      dimMap[b.dimensionName] = (dimMap[b.dimensionName] ?? 0) + b.minutes;
    }
  }
  const dimensionTotals = Object.entries(dimMap)
    .map(([name, minutes]) => ({ name, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  return {
    studyDays: studyDays.map(d => ({ ...d, date: d.date.toISOString() })),
    dimensionTotals,
    totalWrong: wrongItems.length,
    simuladoResults,
  };
}

// ── Save versioned snapshot ────────────────────────────────────────────────────

export async function saveStudyPlanVersion(
  userId: string,
  attemptId: string,
  completedAt: string,
  studentProfile: StudentProfile | null,
): Promise<void> {
  try {
    const planData = await buildPlanData(userId, studentProfile);
    if (!planData) return;

    await supabase.from('study_plan_versions').insert({
      user_id: userId,
      attempt_id: attemptId,
      completed_at: completedAt,
      plan_data: planData,
    });
  } catch (err) {
    console.error('Failed to save study plan version', err);
  }
}
