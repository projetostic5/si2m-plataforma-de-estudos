import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatMinutes, type StudyPlanData, type SimuladoResult } from '../lib/studyPlanGenerator';
import { getDimColor, DayCard } from './StudyPlan';
import {
  ArrowLeft,
  LayoutDashboard,
  CalendarDays,
  Clock,
  Target,
  TrendingUp,
  ChevronRight,
  Layers,
  BookOpen,
} from 'lucide-react';
import type { StudyDay } from '../lib/studyPlanGenerator';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PlanVersion {
  id: string;
  attempt_id: string;
  completed_at: string;
  plan_data: StudyPlanData;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatVersionId(isoDate: string): string {
  return new Date(isoDate).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function deserializeDays(days: StudyPlanData['studyDays']): StudyDay[] {
  return days.map((d, idx) => ({
    ...d,
    date: new Date(d.date),
    dayIndex: idx,
  }));
}

// ── Version detail view ────────────────────────────────────────────────────────

function PlanVersionDetail({
  version,
  onBack,
}: {
  version: PlanVersion;
  onBack: () => void;
}) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));
  const { plan_data } = version;
  const studyDays = deserializeDays(plan_data.studyDays);
  const { dimensionTotals, totalWrong, simuladoResults } = plan_data;
  const maxDimMin = dimensionTotals[0]?.minutes ?? 1;
  const totalStudyHours = Math.round(studyDays.reduce((s, d) => s + d.totalMinutes, 0) / 60 * 10) / 10;

  const toggleDay = (idx: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">Plano de Estudos</h2>
          <p className="text-slate-400 text-sm mt-0.5 font-mono">
            Log: {formatVersionId(version.completed_at)}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            icon: CalendarDays,
            label: 'Dias de estudo',
            value: String(studyDays.length),
            color: 'bg-gradient-to-br from-blue-500 to-blue-600',
          },
          {
            icon: Target,
            label: 'Tópicos a revisar',
            value: String(new Set(studyDays.flatMap(d => d.blocks.map(b => b.themeId))).size),
            sub: `${totalWrong} erros analisados`,
            color: 'bg-gradient-to-br from-amber-500 to-orange-600',
          },
          {
            icon: TrendingUp,
            label: 'Total de estudo',
            value: `${totalStudyHours}h`,
            color: 'bg-gradient-to-br from-rose-500 to-pink-600',
          },
          {
            icon: Clock,
            label: 'Gerado em',
            value: new Date(version.completed_at).toLocaleDateString('pt-BR'),
            sub: new Date(version.completed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
          },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
            <p className="text-xs font-medium text-slate-400">{label}</p>
            {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Simulado sources */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 mb-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Fontes do Plano
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {simuladoResults.map((r: SimuladoResult) => {
            const passed = r.percentage >= 70;
            return (
              <div key={r.attemptId} className="flex items-center justify-between bg-slate-900/50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">{r.examName}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.completedAt).toLocaleDateString('pt-BR')} · {r.wrongCount} erros
                  </p>
                </div>
                <p className={`text-xl font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {r.percentage.toFixed(0)}%
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dimension breakdown */}
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

      {/* Day-by-day */}
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

// ── Main component ─────────────────────────────────────────────────────────────

export function StudyPlanHistory() {
  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PlanVersion | null>(null);

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('study_plan_versions')
      .select('id, attempt_id, completed_at, plan_data, created_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    setVersions((data as PlanVersion[]) ?? []);
    setLoading(false);
  };

  if (selected) {
    return <PlanVersionDetail version={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboards</h2>
          <p className="text-slate-400 text-sm">Histórico de planos de estudo gerados</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && versions.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Nenhum plano salvo ainda</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Após finalizar um simulado, um novo plano de estudos será gerado e salvo aqui automaticamente.
          </p>
        </div>
      )}

      {!loading && versions.length > 0 && (
        <div className="space-y-3">
          {versions.map((v, idx) => {
            const days = v.plan_data.studyDays.length;
            const topics = new Set(
              v.plan_data.studyDays.flatMap(d => d.blocks.map(b => b.themeId))
            ).size;
            const exams = v.plan_data.simuladoResults.map(r => r.examName).join(' + ');
            const isLatest = idx === 0;

            return (
              <button
                key={v.id}
                onClick={() => setSelected(v)}
                className="w-full text-left bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 hover:bg-slate-800/70 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isLatest
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
                        : 'bg-slate-700'
                    }`}>
                      <LayoutDashboard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-white font-semibold font-mono text-sm">
                          {formatVersionId(v.completed_at)}
                        </p>
                        {isLatest && (
                          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full font-medium">
                            Mais recente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {exams} · {days} {days === 1 ? 'dia' : 'dias'} de estudo · {topics} {topics === 1 ? 'tópico' : 'tópicos'}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {v.plan_data.simuladoResults.map(r => (
                          <span
                            key={r.attemptId}
                            className={`text-xs font-medium ${r.percentage >= 70 ? 'text-emerald-400' : 'text-red-400'}`}
                          >
                            {r.examName}: {r.percentage.toFixed(0)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
