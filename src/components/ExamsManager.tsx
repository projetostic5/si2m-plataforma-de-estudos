import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase, Discipline, Exam, Question, ExamQuestion } from '../lib/supabase';
import {
  Plus,
  Save,
  X,
  Edit,
  Trash2,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Download,
  Loader2,
  BookMarked,
} from 'lucide-react';

export function ExamsManager({ disciplines }: { disciplines: Discipline[] }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [showQuestionsManager, setShowQuestionsManager] = useState<string | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<ExamQuestion[]>([]);
  const [exportingTopics, setExportingTopics] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discipline_id: '',
    duration_minutes: 60,
    passing_score: 70,
    is_active: true,
    is_public: true,
    counts_for_study_plan: false,
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select(`
        *,
        discipline:disciplines(*)
      `)
      .order('created_at', { ascending: false });
    setExams(data || []);
  };

  const fetchAvailableQuestions = async (disciplineId: string) => {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('discipline_id', disciplineId)
      .eq('is_active', true);
    setAvailableQuestions(data || []);
  };

  const fetchExamQuestions = async (examId: string) => {
    const { data } = await supabase
      .from('exam_questions')
      .select(`
        *,
        question:questions(*)
      `)
      .eq('exam_id', examId)
      .order('question_order');
    setSelectedQuestions(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();

    if (editingExam) {
      await supabase
        .from('exams')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingExam.id);
    } else {
      const { data } = await supabase
        .from('exams')
        .insert({
          ...formData,
          created_by: user?.id,
        })
        .select()
        .single();

      if (data) {
        setShowQuestionsManager(data.id);
        fetchAvailableQuestions(formData.discipline_id);
      }
    }

    resetForm();
    fetchExams();
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      description: exam.description || '',
      discipline_id: exam.discipline_id,
      duration_minutes: exam.duration_minutes,
      passing_score: exam.passing_score,
      is_active: exam.is_active,
      is_public: exam.is_public,
      counts_for_study_plan: exam.counts_for_study_plan ?? false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este simulado?')) return;
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir simulado:', error);
      alert('Erro ao excluir simulado: ' + error.message);
      return;
    }
    fetchExams();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingExam(null);
    setFormData({
      name: '',
      description: '',
      discipline_id: '',
      duration_minutes: 60,
      passing_score: 70,
      is_active: true,
      is_public: true,
      counts_for_study_plan: false,
    });
  };

  const handleAddQuestionToExam = async (questionId: string) => {
    if (!showQuestionsManager) return;

    const nextOrder = selectedQuestions.length + 1;
    await supabase.from('exam_questions').insert({
      exam_id: showQuestionsManager,
      question_id: questionId,
      question_order: nextOrder,
    });

    fetchExamQuestions(showQuestionsManager);
    setAvailableQuestions(availableQuestions.filter(q => q.id !== questionId));
    updateExamTotalQuestions(showQuestionsManager, nextOrder);
  };

  const handleRemoveQuestionFromExam = async (examQuestionId: string, questionId: string) => {
    if (!showQuestionsManager) return;

    await supabase.from('exam_questions').delete().eq('id', examQuestionId);

    const question = selectedQuestions.find(q => q.question_id === questionId)?.question;
    if (question) {
      setAvailableQuestions([...availableQuestions, question]);
    }

    fetchExamQuestions(showQuestionsManager);
    updateExamTotalQuestions(showQuestionsManager, selectedQuestions.length - 1);
  };

  const updateExamTotalQuestions = async (examId: string, total: number) => {
    await supabase
      .from('exams')
      .update({ total_questions: total })
      .eq('id', examId);
    fetchExams();
  };

  const toggleExamStatus = async (examId: string, field: 'is_active' | 'is_public' | 'counts_for_study_plan') => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    await supabase
      .from('exams')
      .update({ [field]: !exam[field] })
      .eq('id', examId);
    fetchExams();
  };

  const moveQuestionOrder = async (examQuestionId: string, direction: 'up' | 'down') => {
    const currentIndex = selectedQuestions.findIndex(q => q.id === examQuestionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= selectedQuestions.length) return;

    const currentQuestion = selectedQuestions[currentIndex];
    const otherQuestion = selectedQuestions[newIndex];

    await Promise.all([
      supabase
        .from('exam_questions')
        .update({ question_order: newIndex + 1 })
        .eq('id', currentQuestion.id),
      supabase
        .from('exam_questions')
        .update({ question_order: currentIndex + 1 })
        .eq('id', otherQuestion.id),
    ]);

    fetchExamQuestions(showQuestionsManager!);
  };

  const handleExportTopics = async () => {
    setExportingTopics(true);
    try {
      // Fetch topics for both simulados in one query
      const { data, error } = await supabase
        .from('exam_questions')
        .select(`
          exam:exams!inner(name),
          question:questions!inner(
            dimension:dimensions!inner(name),
            theme:themes!inner(name)
          )
        `)
        .in('exam.name', ['SIMULADO A', 'SIMULADO B']);

      if (error) throw error;

      type Row = { simulado: string; dimensao: string; tema: string };
      const rows: Row[] = (data || []).map((item: any) => ({
        simulado: item.exam.name as string,
        dimensao: item.question.dimension.name as string,
        tema: item.question.theme.name as string,
      }));

      // Deduplicate and sort per simulado
      const dedup = (simulado: string) => {
        const seen = new Set<string>();
        return rows
          .filter(r => r.simulado === simulado)
          .filter(r => {
            const key = `${r.dimensao}||${r.tema}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .sort((a, b) => a.dimensao.localeCompare(b.dimensao) || a.tema.localeCompare(b.tema));
      };

      const buildSheet = (simulado: string): XLSX.WorkSheet => {
        const items = dedup(simulado);
        const aoa: (string | number)[][] = [
          [simulado, '', ''],
          ['Tópico', 'Subtópico', 'Nº Questões'],
          ...items.map(r => {
            const count = rows.filter(x => x.simulado === simulado && x.dimensao === r.dimensao && x.tema === r.tema).length;
            return [r.dimensao, r.tema, count];
          }),
        ];

        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // Column widths
        ws['!cols'] = [{ wch: 45 }, { wch: 80 }, { wch: 12 }];

        // Merge title row across 3 columns
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];

        // Style title cell
        const titleCell = ws['A1'];
        if (titleCell) {
          titleCell.s = {
            font: { bold: true, sz: 14 },
            alignment: { horizontal: 'center' },
            fill: { fgColor: { rgb: '1a2f1a' } },
          };
        }

        // Style header row
        ['A2', 'B2', 'C2'].forEach(addr => {
          const cell = ws[addr];
          if (cell) {
            cell.s = {
              font: { bold: true },
              fill: { fgColor: { rgb: 'dff0d8' } },
            };
          }
        });

        return ws;
      };

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, buildSheet('SIMULADO A'), 'Simulado A');
      XLSX.utils.book_append_sheet(wb, buildSheet('SIMULADO B'), 'Simulado B');

      XLSX.writeFile(wb, 'topicos_simulados.xlsx');
    } catch (err: any) {
      alert('Erro ao exportar: ' + err.message);
    } finally {
      setExportingTopics(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-white">Simulados</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExportTopics}
            disabled={exportingTopics}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportingTopics ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Exportar Tópicos A/B
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
          >
            <Plus className="w-4 h-4" />
            Novo Simulado
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingExam ? 'Editar Simulado' : 'Novo Simulado'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white"
                  required
                  placeholder="Ex: Simulado de Infectologia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Disciplina *</label>
                <select
                  value={formData.discipline_id}
                  onChange={(e) => setFormData({ ...formData, discipline_id: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white"
                  required
                >
                  <option value="">Selecione...</option>
                  {disciplines.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Descricao</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white resize-none"
                  rows={3}
                  placeholder="Descricao do simulado..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Duracao (min)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white"
                    min={10}
                    max={300}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nota Minima (%)</label>
                  <input
                    type="number"
                    value={formData.passing_score}
                    onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white"
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div className="flex gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span className="text-sm text-slate-300">Ativo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span className="text-sm text-slate-300">Publico</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.counts_for_study_plan}
                    onChange={(e) => setFormData({ ...formData, counts_for_study_plan: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span className="text-sm text-slate-300">Conta para Plano de Estudos</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingExam ? 'Atualizar' : 'Criar e Adicionar Questoes'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions Manager Modal */}
      {showQuestionsManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Gerenciar Questoes do Simulado</h3>
              <button
                onClick={() => {
                  setShowQuestionsManager(null);
                  setSelectedQuestions([]);
                  setAvailableQuestions([]);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-auto flex-1">
              {/* Available Questions */}
              <div className="bg-slate-900/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-4">
                  Questoes Disponiveis ({availableQuestions.length})
                </h4>
                <div className="space-y-2 max-h-[60vh] overflow-auto">
                  {availableQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:border-emerald-500/50 transition-colors cursor-pointer"
                      onClick={() => handleAddQuestionToExam(question.id)}
                    >
                      <p className="text-sm text-white line-clamp-2">{question.question_text}</p>
                      <p className="text-xs text-slate-400 mt-1">{question.dimension_id}</p>
                    </div>
                  ))}
                  {availableQuestions.length === 0 && (
                    <p className="text-center py-8 text-slate-500">Todas questoes ja foram adicionadas</p>
                  )}
                </div>
              </div>

              {/* Selected Questions */}
              <div className="bg-slate-900/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-4">
                  Questoes do Simulado ({selectedQuestions.length})
                </h4>
                <div className="space-y-2 max-h-[60vh] overflow-auto">
                  {selectedQuestions.map((eq, index) => (
                    <div
                      key={eq.id}
                      className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 flex items-start gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-slate-600" />
                        <span className="w-6 h-6 flex items-center justify-center bg-slate-700 rounded text-xs text-white font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white line-clamp-2">{eq.question?.question_text}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {index > 0 && (
                          <button
                            onClick={() => moveQuestionOrder(eq.id, 'up')}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <ChevronRight className="w-4 h-4 rotate-[-90deg]" />
                          </button>
                        )}
                        {index < selectedQuestions.length - 1 && (
                          <button
                            onClick={() => moveQuestionOrder(eq.id, 'down')}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <ChevronRight className="w-4 h-4 rotate-90" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveQuestionFromExam(eq.id, eq.question_id)}
                          className="p-1 text-slate-400 hover:text-red-400 ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {selectedQuestions.length === 0 && (
                    <p className="text-center py-8 text-slate-500">Nenhuma questao adicionada</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exams List */}
      <div className="space-y-3">
        {exams.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400">Nenhum simulado criado</p>
          </div>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: exam.discipline?.color + '20', border: `2px solid ${exam.discipline?.color}` }}
                    >
                      <Clock className="w-5 h-5" style={{ color: exam.discipline?.color }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{exam.name}</h3>
                      <p className="text-sm text-slate-400">{exam.discipline?.name}</p>
                    </div>
                  </div>
                  {exam.description && (
                    <p className="text-sm text-slate-300 mb-3">{exam.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-4 h-4" />
                      {exam.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Users className="w-4 h-4" />
                      {exam.total_questions} questoes
                    </span>
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg">
                      Nota min: {exam.passing_score}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => toggleExamStatus(exam.id, 'is_active')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        exam.is_active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700/50 text-slate-400'
                      }`}
                    >
                      {exam.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {exam.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                    <button
                      onClick={() => toggleExamStatus(exam.id, 'is_public')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        exam.is_public
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-700/50 text-slate-400'
                      }`}
                    >
                      {exam.is_public ? 'Publico' : 'Privado'}
                    </button>
                    <button
                      onClick={() => toggleExamStatus(exam.id, 'counts_for_study_plan')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        exam.counts_for_study_plan
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-700/50 text-slate-400'
                      }`}
                      title="Conta para geração do Plano de Estudos"
                    >
                      <BookMarked className="w-3 h-3" />
                      {exam.counts_for_study_plan ? 'Plano: Sim' : 'Plano: Nao'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowQuestionsManager(exam.id);
                        fetchExamQuestions(exam.id);
                        fetchAvailableQuestions(exam.discipline_id);
                      }}
                      className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                      title="Gerenciar Questoes"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(exam)}
                      className="p-2 text-slate-400 hover:text-amber-400 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
