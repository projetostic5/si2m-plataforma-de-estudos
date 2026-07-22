import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  RefreshCw,
  Clock,
  AlertTriangle,
  Loader2,
  Users,
} from 'lucide-react';

type ExamStatus = {
  exam_id: string;
  exam_name: string;
  completed: boolean;
  percentage: number | null;
  passed: boolean | null;
  completed_at: string | null;
};

type StudentReport = {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  exams: ExamStatus[];
  all_exams_completed: boolean;
  has_study_plan: boolean;
  study_plan_created_at: string | null;
};

type ReportData = {
  students: StudentReport[];
  exams: { id: string; name: string }[];
};

export function ReportsView() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'completed' | 'pending'>('completed');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-reports`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        },
      );
      if (!res.ok) throw new Error('Falha ao carregar relatório');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const completedStudents = data?.students.filter((s) => s.all_exams_completed) ?? [];
  const pendingStudents = data?.students.filter((s) => !s.all_exams_completed) ?? [];
  const withPlan = completedStudents.filter((s) => s.has_study_plan);

  const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPct = (v: number | null) => (v === null ? '-' : `${v.toFixed(1)}%`);

  const exportSubtopicErrors = async () => {
    try {
      const { data: rows, error: queryError } = await supabase.rpc('get_subtopic_error_report');
      if (queryError) throw queryError;
      if (!rows || rows.length === 0) {
        alert('Nenhum dado de simulado encontrado.');
        return;
      }

      const header = 'Tópico;Subtópico;Percentual de erros nas respostas dos simulados';
      const lines = rows.map(
        (r: { topico: string; subtopico: string; percentual_erros: number }) =>
          `${r.topico};${r.subtopico};${r.percentual_erros}`,
      );
      const csv = '\uFEFF' + [header, ...lines].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'relatorio_subtopicos_erros.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar relatório de subtópicos');
    }
  };

  const exportPDF = (section: 'completed' | 'pending') => {
    const students = section === 'completed' ? completedStudents : pendingStudents;
    const title =
      section === 'completed'
        ? 'Estudantes que Concluíram os Simulados A e B'
        : 'Estudantes Pendentes - Simulados A e B';
    const now = new Date().toLocaleString('pt-BR');

    const rows = students
      .map((s, i) => {
        const examCells = s.exams
          .map((e) => {
            const status = e.completed ? formatPct(e.percentage) : 'Não realizou';
            return `<td style="text-align:center;padding:8px 12px;border-bottom:1px solid #ddd;">${status}</td>`;
          })
          .join('');
        const planCell =
          section === 'completed'
            ? `<td style="text-align:center;padding:8px 12px;border-bottom:1px solid #ddd;">${s.has_study_plan ? 'Sim' : 'Não'}</td>`
            : '';
        return `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #ddd;">${i + 1}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #ddd;">${s.full_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #ddd;">${s.email}</td>
          ${examCells}
          ${planCell}
        </tr>`;
      })
      .join('');

    const examHeaders = data?.exams.map((e) => `<th style="text-align:center;padding:8px 12px;background:#0d9488;color:#fff;">${e.name}</th>`).join('') ?? '';
    const planHeader = section === 'completed' ? '<th style="padding:8px 12px;background:#0d9488;color:#fff;">Plano de Estudo</th>' : '';

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  * { font-family: 'Helvetica Neue', Arial, sans-serif; }
  body { margin: 0; padding: 32px; color: #1e293b; }
  .header { display:flex; align-items:center; gap:16px; margin-bottom:24px; border-bottom:2px solid #0d9488; padding-bottom:16px; }
  .logo { width:48px; height:48px; background:#0d9488; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; font-size:20px; }
  h1 { font-size:22px; margin:0; color:#0f766e; }
  .subtitle { color:#64748b; font-size:13px; margin-top:4px; }
  .meta { margin-bottom:16px; color:#64748b; font-size:12px; }
  .summary { display:flex; gap:16px; margin-bottom:24px; }
  .summary-card { padding:16px 20px; border-radius:12px; background:#f1f5f9; border:1px solid #e2e8f0; }
  .summary-card .num { font-size:28px; font-weight:bold; color:#0f766e; }
  .summary-card .lbl { font-size:12px; color:#64748b; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th { text-align:left; padding:8px 12px; background:#0d9488; color:#fff; font-weight:600; }
  th:first-child { border-top-left-radius:8px; }
  th:last-child { border-top-right-radius:8px; }
  td { font-size:13px; }
  tr:nth-child(even) { background:#f8fafc; }
  .footer { margin-top:32px; color:#94a3b8; font-size:11px; border-top:1px solid #e2e8f0; padding-top:12px; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">S2</div>
    <div>
      <h1>${title}</h1>
      <div class="subtitle">S2iM - Sistema de Gestão de Simulados</div>
    </div>
  </div>
  <div class="meta">Relatório gerado em: ${now}</div>
  <div class="summary">
    <div class="summary-card"><div class="num">${students.length}</div><div class="lbl">Total de estudantes</div></div>
    <div class="summary-card"><div class="num">${students.filter((s) => s.has_study_plan).length}</div><div class="lbl">Com plano de estudo</div></div>
    <div class="summary-card"><div class="num">${students.filter((s) => !s.has_study_plan).length}</div><div class="lbl">Sem plano de estudo</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:40px;">#</th>
        <th>Nome</th>
        <th>E-mail</th>
        ${examHeaders}
        ${planHeader}
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="99" style="padding:24px;text-align:center;color:#94a3b8;">Nenhum estudante encontrado.</td></tr>'}</tbody>
  </table>
  <div class="footer">Documento confidencial - Uso administrativo interno</div>
  <script>window.onload=function(){window.print()}</script>
</body>
</html>`;

    const w = window.open('', '_blank');
    if (!w) {
      alert('Por favor, permita pop-ups para exportar o PDF.');
      return;
    }
    w.document.write(html);
    w.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-slate-400">{error}</p>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors">
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  const currentStudents = filter === 'completed' ? completedStudents : pendingStudents;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-emerald-400" />
          <h2 className="text-2xl font-bold text-white">Relatórios</h2>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white bg-slate-800/50 border border-slate-700/50 rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total de Estudantes" value={data?.students.length ?? 0} icon={Users} color="from-blue-500 to-cyan-600" />
        <SummaryCard label="Concluíram A e B" value={completedStudents.length} icon={CheckCircle2} color="from-emerald-500 to-teal-600" />
        <SummaryCard label="Com Plano Gerado" value={withPlan.length} icon={FileText} color="from-violet-500 to-purple-600" />
        <SummaryCard label="Pendentes" value={pendingStudents.length} icon={XCircle} color="from-amber-500 to-orange-600" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')} icon={CheckCircle2} label={`Concluíram os Simulados (${completedStudents.length})`} />
        <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')} icon={Clock} label={`Pendentes (${pendingStudents.length})`} />
      </div>

      {/* Export buttons */}
      <div className="flex justify-end gap-3 mb-4">
        <button
          onClick={exportSubtopicErrors}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/30"
        >
          <Download className="w-4 h-4" /> Exportar CSV de Subtópicos
        </button>
        <button
          onClick={() => exportPDF(filter)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
        >
          <Download className="w-4 h-4" /> Exportar PDF
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-400">#</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-400">Nome</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-400">E-mail</th>
                {data?.exams.map((exam) => (
                  <th key={exam.id} className="text-center px-4 py-3 text-sm font-semibold text-slate-400">{exam.name}</th>
                ))}
                {filter === 'completed' && (
                  <th className="text-center px-4 py-3 text-sm font-semibold text-slate-400">Plano de Estudo</th>
                )}
              </tr>
            </thead>
            <tbody>
              {currentStudents.length === 0 ? (
                <tr>
                  <td colSpan={99} className="px-4 py-12 text-center text-slate-500">
                    Nenhum estudante encontrado nesta categoria.
                  </td>
                </tr>
              ) : (
                currentStudents.map((s, i) => (
                  <tr key={s.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{s.full_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{s.email}</td>
                    {s.exams.map((e) => (
                      <td key={e.exam_id} className="px-4 py-3 text-center">
                        {e.completed ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            e.passed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {formatPct(e.percentage)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-500">
                            <XCircle className="w-3 h-3" />
                            Pendente
                          </span>
                        )}
                      </td>
                    ))}
                    {filter === 'completed' && (
                      <td className="px-4 py-3 text-center">
                        {s.has_study_plan ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-500/15 text-violet-400">
                            <FileText className="w-3 h-3" />
                            Gerado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-500">
                            Não gerado
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function FilterButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
        active
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}


