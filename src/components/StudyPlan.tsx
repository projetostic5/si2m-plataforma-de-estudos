import { useState, useEffect } from 'react';
import { supabase, StudentProfile } from '../lib/supabase';
import {
  generatePlan,
  daysUntil,
  getDefault30DaysDate,
  formatMinutes,
  EFFICIENCY,
  type SimuladoResult,
  type WrongItem,
  type StudyDay,
  type ThemeBlock,
} from '../lib/studyPlanGenerator';
import {
  CalendarDays,
  Clock,
  BookOpen,
  AlertCircle,
  Target,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  RefreshCw,
} from 'lucide-react';

// ─── Color helpers ────────────────────────────────────────────────────────────

const DIMENSION_COLORS = [
  { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', bar: 'bg-blue-500' },
  { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', bar: 'bg-amber-500' },
  { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', bar: 'bg-rose-500' },
  { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', bar: 'bg-cyan-500' },
  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', bar: 'bg-orange-500' },
  { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400', bar: 'bg-teal-500' },
  { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-400', bar: 'bg-sky-500' },
];

const colorCache: Record<string, (typeof DIMENSION_COLORS)[0]> = {};
export function getDimColor(name: string) {
  if (colorCache[name]) return colorCache[name];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffff;
  colorCache[name] = DIMENSION_COLORS[Math.abs(h) % DIMENSION_COLORS.length];
  return colorCache[name];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export function DayCard({ day, expanded, onToggle }: {
  day: StudyDay;
  expanded: boolean;
  onToggle: () => void;
}) {
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const isToday = day.dayIndex === 0;
  const fillPct = Math.min(100, Math.round((day.totalMinutes / day.capacityMinutes) * 100));

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${
      isToday ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-700/50 bg-slate-800/40'
    }`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 text-center flex-shrink-0 ${isToday ? 'text-emerald-400' : 'text-slate-400'}`}>
            <p className="text-xs font-medium uppercase">{weekdays[day.date.getDay()]}</p>
            <p className="text-2xl font-bold text-white leading-none">{day.date.getDate()}</p>
            <p className="text-xs">{months[day.date.getMonth()]}</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {day.blocks.slice(0, 3).map((b, i) => {
                const col = getDimColor(b.dimensionName);
                return (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${col.text} ${col.bg} ${col.border}`}>
                    {b.dimensionName.length > 20 ? b.dimensionName.slice(0, 20) + '…' : b.dimensionName}
                  </span>
                );
              })}
              {day.blocks.length > 3 && (
                <span className="text-xs text-slate-500">+{day.blocks.length - 3} mais</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden max-w-32">
                <div
                  className={`h-full rounded-full transition-all ${isToday ? 'bg-emerald-500' : 'bg-slate-500'}`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">{formatMinutes(day.totalMinutes)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isToday && (
            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 font-medium">
              Hoje
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-700/50 px-5 pb-4 pt-3 space-y-2">
          {day.blocks.map((block: ThemeBlock, i: number) => {
            const col = getDimColor(block.dimensionName);
            return (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${col.bg} ${col.border}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${col.bar}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${col.text}`}>
                    {block.dimensionName}
                  </p>
                  <p className="text-sm text-white font-medium leading-snug">{block.themeName}</p>
                  {block.topicName && (
                    <p className="text-xs text-slate-400 mt-0.5">{block.topicName}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {block.wrongCount} {block.wrongCount === 1 ? 'erro' : 'erros'}
                    </span>
                    <span className="text-xs text-slate-500">
                      Simulado {block.sources.join(' e ')}
                    </span>
                  </div>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${col.text}`}>
                  {formatMinutes(block.minutes)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StudyPlan({ studentProfile }: { studentProfile: StudentProfile | null }) {
  const [loading, setLoading] = useState(true);
  const [studyDays, setStudyDays] = useState<StudyDay[]>([]);
  const [simuladoResults, setSimuladoResults] = useState<SimuladoResult[]>([]);
  const [dimensionTotals, setDimensionTotals] = useState<{ name: string; minutes: number }[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));
  const [totalWrong, setTotalWrong] = useState(0);

  useEffect(() => {
    if (studentProfile?.onboarding_completed) {
      fetchAndBuildPlan();
    } else {
      setLoading(false);
    }
  }, [studentProfile]);

  const fetchAndBuildPlan = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: exams } = await supabase
        .from('exams')
        .select('id, name')
        .eq('counts_for_study_plan', true)
        .eq('is_active', true);

      if (!exams?.length) { setLoading(false); return; }

      const { data: allAttempts } = await supabase
        .from('exam_attempts')
        .select('id, exam_id, percentage, completed_at')
        .eq('user_id', user.id)
        .in('exam_id', exams.map(e => e.id))
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (!allAttempts?.length) { setLoading(false); return; }

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

      const results: SimuladoResult[] = latestAttempts.map(a => ({
        examName: examNameById[a.exam_id] ?? '?',
        attemptId: a.id,
        percentage: a.percentage,
        completedAt: a.completed_at,
        wrongCount: answers?.filter(ans => ans.attempt_id === a.id).length ?? 0,
      }));
      setSimuladoResults(results.sort((a, b) => a.examName.localeCompare(b.examName)));

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

      setTotalWrong(wrongItems.length);

      if (!wrongItems.length) { setLoading(false); return; }

      const hoursPerDay = studentProfile?.hours_per_day ?? 3;
      const examDate = studentProfile?.next_exam_date ?? getDefault30DaysDate();
      const daysLeft = daysUntil(examDate);
      const kLevel = (studentProfile?.knowledge_level ?? 'intermediate') as 'basic' | 'intermediate' | 'advanced';

      const plan = generatePlan(wrongItems, hoursPerDay, daysLeft, kLevel);
      setStudyDays(plan);

      const dimMap: Record<string, number> = {};
      for (const day of plan) {
        for (const b of day.blocks) {
          dimMap[b.dimensionName] = (dimMap[b.dimensionName] ?? 0) + b.minutes;
        }
      }
      setDimensionTotals(
        Object.entries(dimMap)
          .map(([name, minutes]) => ({ name, minutes }))
          .sort((a, b) => b.minutes - a.minutes)
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (idx: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  if (!studentProfile?.onboarding_completed) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Perfil Incompleto</h3>
        <p className="text-slate-400 text-sm">
          Complete seu perfil de estudos na aba "Meu Perfil" para que possamos montar seu plano personalizado.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Gerando seu plano de estudos...</p>
        </div>
      </div>
    );
  }

  if (!simuladoResults.length) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Nenhum Simulado Realizado</h3>
        <p className="text-slate-400 text-sm max-w-sm mx-auto">
          Realize pelo menos um dos simulados disponíveis para que o sistema gere seu plano personalizado com base nos tópicos que você precisa revisar.
        </p>
      </div>
    );
  }

  if (!studyDays.length) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Excelente! Sem erros a revisar</h3>
        <p className="text-slate-400 text-sm max-w-sm mx-auto">
          Você acertou todas as questões dos simulados. Continue praticando para manter o desempenho.
        </p>
      </div>
    );
  }

  const examDate = studentProfile.next_exam_date ?? getDefault30DaysDate();
  const daysLeft = daysUntil(examDate);
  const hoursPerDay = studentProfile.hours_per_day ?? 3;
  const totalStudyHours = Math.round(studyDays.reduce((s, d) => s + d.totalMinutes, 0) / 60 * 10) / 10;
  const maxDimMin = dimensionTotals[0]?.minutes ?? 1;
  const examDateDisplay = new Date(examDate + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Meu Plano de Estudos</h2>
          <p className="text-slate-400 text-sm mt-1">
            Distribuição personalizada baseada nos seus erros nos Simulados A e B
          </p>
        </div>
        <button
          onClick={fetchAndBuildPlan}
          className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white border border-slate-700 rounded-xl hover:border-slate-600 transition-all text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard
          icon={CalendarDays}
          label="Dias até a prova"
          value={String(daysLeft)}
          sub={examDateDisplay}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <MetricCard
          icon={Clock}
          label="Horas de estudo/dia"
          value={`${hoursPerDay}h`}
          sub={`${formatMinutes(Math.round(hoursPerDay * 60 * EFFICIENCY))} efetivos`}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <MetricCard
          icon={Target}
          label="Tópicos para revisar"
          value={String(new Set(studyDays.flatMap(d => d.blocks.map(b => b.themeId))).size)}
          sub={`${totalWrong} erros analisados`}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <MetricCard
          icon={TrendingUp}
          label="Total de estudo"
          value={`${totalStudyHours}h`}
          sub={`em ${studyDays.length} dias`}
          color="bg-gradient-to-br from-rose-500 to-pink-600"
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 mb-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Fontes do Plano
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {simuladoResults.map((r) => {
            const passed = r.percentage >= 70;
            return (
              <div key={r.attemptId} className="flex items-center justify-between bg-slate-900/50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">{r.examName}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.completedAt).toLocaleDateString('pt-BR')} · {r.wrongCount} erros
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.percentage.toFixed(0)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {dimensionTotals.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
            Distribuição por Área de Conhecimento
          </p>
          <div className="space-y-2.5">
            {dimensionTotals.map(({ name, minutes }) => {
              const col = getDimColor(name);
              const pct = Math.round((minutes / maxDimMin) * 100);
              return (
                <div key={name} className="flex items-center gap-3">
                  <p className={`text-xs font-medium w-56 truncate flex-shrink-0 ${col.text}`} title={name}>
                    {name}
                  </p>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${col.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-16 text-right flex-shrink-0">
                    {formatMinutes(minutes)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Plano Dia a Dia
        </p>
        <div className="space-y-2">
          {studyDays.map((day) => (
            <DayCard
              key={day.dayIndex}
              day={day}
              expanded={expandedDays.has(day.dayIndex)}
              onToggle={() => toggleDay(day.dayIndex)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
