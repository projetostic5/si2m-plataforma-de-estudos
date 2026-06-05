import { useState, useEffect } from 'react';
import { supabase, ExamAttempt, ExamAnswer, StudyRecommendation, StudentProfile, Dimension, Theme } from '../lib/supabase';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  BarChart3,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Calendar,
} from 'lucide-react';

export function ExamResults({ attemptId, onBack }: { attemptId: string; onBack: () => void }) {
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [recommendations, setRecommendations] = useState<StudyRecommendation[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'questions' | 'recommendations'>('summary');

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    const [attemptData, answersData, recommendationsData, profileData] = await Promise.all([
      supabase
        .from('exam_attempts')
        .select(`
          *,
          exam:exams(
            *,
            discipline:disciplines(*)
          )
        `)
        .eq('id', attemptId)
        .single(),
      supabase
        .from('exam_answers')
        .select(`
          *,
          question:questions(
            *,
            dimension:dimensions(*),
            theme:themes(*)
          )
        `)
        .eq('attempt_id', attemptId),
      supabase
        .from('study_recommendations')
        .select(`
          *,
          dimension:dimensions(*),
          theme:themes(*)
        `)
        .eq('attempt_id', attemptId)
        .order('priority'),
      supabase.from('student_profiles').select('*').maybeSingle(),
    ]);

    // Generate recommendations if not exist
    if (answersData.data && answersData.data.length > 0 && (!recommendationsData.data || recommendationsData.data.length === 0)) {
      await generateRecommendations(attemptId, answersData.data);
      const { data: newRecs } = await supabase
        .from('study_recommendations')
        .select(`
          *,
          dimension:dimensions(*),
          theme:themes(*)
        `)
        .eq('attempt_id', attemptId)
        .order('priority');
      setRecommendations(newRecs || []);
    } else {
      setRecommendations(recommendationsData.data || []);
    }

    setAttempt(attemptData.data);
    setAnswers(answersData.data || []);
    setStudentProfile(profileData.data);
    setLoading(false);
  };

  const generateRecommendations = async (attId: string, ans: ExamAnswer[]) => {
    const incorrectAnswers = ans.filter(a => !a.is_correct);
    const dimensionStats = new Map<string, { incorrect: number; total: number; dimension?: Dimension; theme?: Theme }>();

    ans.forEach((a) => {
      if (!a.question) return;
      const dimId = a.question.dimension_id;
      const stat = dimensionStats.get(dimId) || { incorrect: 0, total: 0, dimension: a.question.dimension };
      stat.total++;
      if (!a.is_correct) {
        stat.incorrect++;
      }
      dimensionStats.set(dimId, stat);
    });

    const recs = Array.from(dimensionStats.entries())
      .filter(([_, stat]) => stat.incorrect > 0)
      .map(([dimId, stat]) => {
        const errorRate = stat.incorrect / stat.total;
        let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';
        if (errorRate >= 0.7) priority = 'critical';
        else if (errorRate >= 0.5) priority = 'high';
        else if (errorRate >= 0.3) priority = 'medium';

        return {
          attempt_id: attId,
          dimension_id: dimId,
          incorrect_count: stat.incorrect,
          total_questions: stat.total,
          priority,
          recommended_hours: calculateHours(priority, stat.incorrect, studentProfile),
          study_notes: generateStudyNotes(priority, stat.incorrect, stat.total, stat.dimension?.name),
        };
      });

    if (recs.length > 0) {
      await supabase.from('study_recommendations').insert(recs);
    }
  };

  const calculateHours = (priority: string, incorrect: number, profile?: StudentProfile | null): number => {
    const availableHours = profile?.available_hours_per_week || 20;
    let baseHours = 0;

    switch (priority) {
      case 'critical':
        baseHours = 4 + incorrect * 0.5;
        break;
      case 'high':
        baseHours = 3 + incorrect * 0.4;
        break;
      case 'medium':
        baseHours = 2 + incorrect * 0.3;
        break;
      default:
        baseHours = 1 + incorrect * 0.2;
    }

    const maxHours = availableHours * 0.6;
    return Math.min(baseHours, maxHours);
  };

  const generateStudyNotes = (priority: string, incorrect: number, total: number, dimensionName?: string): string => {
    const percent = ((incorrect / total) * 100).toFixed(0);

    switch (priority) {
      case 'critical':
        return `ATENCAO URGENTE: Voce errou ${percent}% das questoes de ${dimensionName || 'conteudos'}. Este e um ponto critico que precisa de revisao intensiva.`;
      case 'high':
        return `Importante: Revise ${dimensionName || 'estes conteudos'} com atencao. Voce acertou apenas ${(100 - parseFloat(percent)).toFixed(0)}% das questoes.`;
      case 'medium':
        return `Dica: Dedique tempo para fortalecer seu conhecimento em ${dimensionName || 'estes temas'}.`;
      default:
        return `Continue praticando ${dimensionName || 'estes topicos'} para manter o conhecimento.`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Calculando resultados...</div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Resultado nao encontrado</div>
      </div>
    );
  }

  const correctCount = answers.filter(a => a.is_correct).length;
  const incorrectCount = answers.filter(a => !a.is_correct).length;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{attempt.exam?.name}</h1>
            <p className="text-sm text-slate-400">{attempt.exam?.discipline?.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'summary', label: 'Resumo', icon: BarChart3 },
            { id: 'questions', label: 'Questoes', icon: BookOpen },
            { id: 'recommendations', label: 'Recomendacoes', icon: Lightbulb },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700/50 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div>
            {/* Score Card */}
            <div className={`rounded-3xl p-8 mb-8 ${
              attempt.passed
                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border-2 border-emerald-500/30'
                : 'bg-gradient-to-br from-red-500/20 to-rose-600/20 border-2 border-red-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    {attempt.passed ? (
                      <>
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                        <h2 className="text-3xl font-bold text-emerald-400">Aprovado!</h2>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-10 h-10 text-red-400" />
                        <h2 className="text-3xl font-bold text-red-400">Nao Aprovado</h2>
                      </>
                    )}
                  </div>
                  <p className="text-slate-300 mb-2">
                    {attempt.passed
                      ? 'Parabens! Voce atingiu a pontuacao necessaria.'
                      : 'Continue estudando e tente novamente.'}
                  </p>
                  <p className="text-sm text-slate-400">
                    Nota minima necessaria: {attempt.exam?.passing_score}%
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-7xl font-bold ${
                    attempt.passed ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {attempt.percentage.toFixed(1)}%
                  </p>
                  <p className="text-lg text-slate-300 mt-2">
                    {correctCount} de {answers.length} questoes correctas
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-3xl font-bold text-white">{correctCount}</p>
                <p className="text-sm text-slate-400">Acertos</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-4">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-3xl font-bold text-white">{incorrectCount}</p>
                <p className="text-sm text-slate-400">Erros</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-white">
                  {Math.floor((attempt.time_spent_seconds || 0) / 60)}
                </p>
                <p className="text-sm text-slate-400">Minutos</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-amber-400" />
                </div>
                <p className="text-3xl font-bold text-white">
                  {(attempt.time_spent_seconds || 0) / answers.length}
                </p>
                <p className="text-sm text-slate-400">Seg/Questao</p>
              </div>
            </div>

            {/* Quick Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-white">Areas que Precisam de Atencao</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendations.slice(0, 3).map((rec) => (
                    <div
                      key={rec.id}
                      className={`p-4 rounded-xl border ${
                        rec.priority === 'critical'
                          ? 'bg-red-500/10 border-red-500/30'
                          : rec.priority === 'high'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-slate-700/50 border-slate-600'
                      }`}
                    >
                      <p className="font-medium text-white mb-1">{rec.dimension?.name}</p>
                      <p className="text-sm text-slate-400">
                        {rec.incorrect_count} de {rec.total_questions} incorretas
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {rec.recommended_hours.toFixed(1)}h recomendadas
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {answers.map((answer, index) => (
              <div
                key={answer.id}
                className={`bg-slate-800/50 border rounded-2xl p-6 ${
                  answer.is_correct
                    ? 'border-emerald-500/30'
                    : 'border-red-500/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${
                    answer.is_correct
                      ? 'bg-emerald-500/20'
                      : 'bg-red-500/20'
                  }`}>
                    {answer.is_correct ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-slate-400">Questao {index + 1}</span>
                      <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                        {answer.question?.dimension?.name}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                        {answer.question?.theme?.name}
                      </span>
                    </div>
                    <p className="text-white mb-4">{answer.question?.question_text}</p>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {(['a', 'b', 'c', 'd', 'e'] as const).map((letter) => {
                        const option = answer.question?.[`option_${letter}` as keyof typeof answer.question];
                        if (!option) return null;
                        const isCorrect = answer.question?.correct_answer === letter;
                        const isSelected = answer.selected_answer === letter;

                        return (
                          <div
                            key={letter}
                            className={`p-3 rounded-lg text-sm ${
                              isCorrect
                                ? 'bg-emerald-500/20 border border-emerald-500/30'
                                : isSelected
                                  ? 'bg-red-500/20 border border-red-500/30'
                                  : 'bg-slate-700/30'
                            }`}
                          >
                            <span className="font-medium">{letter.toUpperCase()})</span> {option}
                            {isCorrect && <CheckCircle className="inline w-4 h-4 text-emerald-400 ml-2" />}
                            {isSelected && !isCorrect && <XCircle className="inline w-4 h-4 text-red-400 ml-2" />}
                          </div>
                        );
                      })}
                    </div>

                    {answer.question?.explanation && (
                      <div className="p-4 bg-slate-700/30 rounded-xl">
                        <p className="text-sm text-slate-300">
                          <span className="font-medium text-white">Explicacao: </span>
                          {answer.question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Plano de Estudos Personalizado</h3>
                  {studentProfile?.next_exam_date && (
                    <p className="text-sm text-slate-400">
                      Sua proxima avaliacao: {new Date(studentProfile.next_exam_date).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-slate-300">
                Com base no seu tempo disponivel de <span className="font-bold text-white">{studentProfile?.available_hours_per_week || 20} horas/semana</span>,
                recomendamos o seguinte plano de estudos para melhorar nos conteudos com maior dificuldade:
              </p>
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Excelente!</h3>
                <p className="text-slate-400">Voce nao precisa de recomendacoes especiais.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={rec.id}
                    className={`bg-slate-800/50 border rounded-2xl p-6 ${
                      rec.priority === 'critical'
                        ? 'border-red-500/30'
                        : rec.priority === 'high'
                          ? 'border-amber-500/30'
                          : rec.priority === 'medium'
                            ? 'border-blue-500/30'
                            : 'border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold ${
                          rec.priority === 'critical'
                            ? 'bg-red-500/20 text-red-400'
                            : rec.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-400'
                              : rec.priority === 'medium'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-slate-700 text-slate-400'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="text-lg font-semibold text-white">{rec.dimension?.name}</h4>
                          {rec.theme && (
                            <p className="text-sm text-slate-400">{rec.theme.name}</p>
                          )}
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-xl ${
                        rec.priority === 'critical'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : rec.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : rec.priority === 'medium'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-slate-700 text-slate-400'
                      }`}>
                        Prioridade {rec.priority === 'critical' ? 'Critica' : rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Media' : 'Baixa'}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="p-4 bg-slate-700/30 rounded-xl">
                        <p className="text-2xl font-bold text-white">{rec.incorrect_count}</p>
                        <p className="text-sm text-slate-400">Questoes Erradas</p>
                      </div>
                      <div className="p-4 bg-slate-700/30 rounded-xl">
                        <p className="text-2xl font-bold text-white">{rec.total_questions}</p>
                        <p className="text-sm text-slate-400">Total de Questoes</p>
                      </div>
                      <div className="p-4 bg-emerald-500/20 rounded-xl">
                        <p className="text-2xl font-bold text-emerald-400">{rec.recommended_hours.toFixed(1)}h</p>
                        <p className="text-sm text-slate-400">Horas Recomendadas</p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-700/30 rounded-xl">
                      <p className="text-sm text-slate-300 flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {rec.study_notes}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-lg font-semibold text-white">Resumo do Plano</h4>
                  </div>
                  <p className="text-slate-300">
                    Total de horas recomendadas: <span className="font-bold text-emerald-400">
                      {recommendations.reduce((sum, r) => sum + r.recommended_hours, 0).toFixed(1)}h
                    </span>
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Distribua essas horas ao longo das proximas semanas, priorizando os conteudos com prioridade critica e alta.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
