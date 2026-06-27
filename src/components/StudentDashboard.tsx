import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Exam, StudentProfile, ExamAttempt } from '../lib/supabase';
import {
  GraduationCap,
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  LogOut,
  User,
  Edit,
  Save,
  X,
  Play,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  Award,
} from 'lucide-react';
import { ExamTaking } from './ExamTaking';
import { ExamResults } from './ExamResults';

type Tab = 'dashboard' | 'exams' | 'profile' | 'history';

export function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  useEffect(() => {
    const path = location.pathname;
    if (path === '/estudante/simulados') setActiveTab('exams');
    else if (path === '/estudante/resultados') setActiveTab('history');
    else if (path === '/estudante/configuracoes') setActiveTab('profile');
    else setActiveTab('dashboard');
  }, [location.pathname]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<ExamAttempt[]>([]);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [resultAttemptId, setResultAttemptId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileData, examsData, attemptsData] = await Promise.all([
      supabase.from('student_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('exams')
        .select(`
          *,
          discipline:disciplines(*)
        `)
        .eq('is_active', true)
        .eq('is_public', true),
      supabase
        .from('exam_attempts')
        .select(`
          *,
          exam:exams(
            *,
            discipline:disciplines(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    setStudentProfile(profileData.data);
    setExams(examsData.data || []);
    setRecentAttempts(attemptsData.data || []);
  };

  const handleStartExam = (examId: string) => {
    setActiveExamId(examId);
  };

  const handleExamComplete = () => {
    setActiveExamId(null);
    fetchData();
    setActiveTab('history');
  };

  const handleViewResult = (attemptId: string) => {
    setResultAttemptId(attemptId);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'exams', label: 'Simulados', icon: BookOpen },
    { id: 'history', label: 'Historico', icon: TrendingUp },
    { id: 'profile', label: 'Meu Perfil', icon: User },
  ];

  const handleNav = (tabId: string) => {
    setActiveTab(tabId as Tab);
    const pathMap: Record<string, string> = {
      dashboard: '/estudante',
      exams: '/estudante/simulados',
      history: '/estudante/resultados',
      profile: '/estudante/configuracoes',
    };
    navigate(pathMap[tabId] || '/estudante');
  };

  if (activeExamId) {
    return <ExamTaking examId={activeExamId} onComplete={handleExamComplete} onCancel={() => setActiveExamId(null)} />;
  }

  if (resultAttemptId) {
    return <ExamResults attemptId={resultAttemptId} onBack={() => setResultAttemptId(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-slate-800/50 border-r border-slate-700/50 p-4">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">MedSim</h1>
              <p className="text-xs text-slate-400">Area do Estudante</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === item.id
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="p-3 bg-slate-900/50 rounded-xl mb-3">
              <p className="text-sm text-slate-300 font-medium">{profile?.full_name}</p>
              <p className="text-xs text-slate-500">Estudante</p>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sair</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === 'dashboard' && (
            <StudentDashboardView
              studentProfile={studentProfile}
              attempts={recentAttempts}
              exams={exams}
              onStartExam={handleStartExam}
              onViewResult={handleViewResult}
            />
          )}
          {activeTab === 'exams' && (
            <ExamsList exams={exams} onStartExam={handleStartExam} />
          )}
          {activeTab === 'history' && (
            <HistoryView attempts={recentAttempts} onViewResult={handleViewResult} />
          )}
          {activeTab === 'profile' && (
            <ProfileEditor profile={studentProfile} onUpdate={fetchData} />
          )}
        </main>
      </div>
    </div>
  );
}

function StudentDashboardView({
  studentProfile,
  attempts,
  exams,
  onStartExam,
  onViewResult,
}: {
  studentProfile: StudentProfile | null;
  attempts: ExamAttempt[];
  exams: Exam[];
  onStartExam: (id: string) => void;
  onViewResult: (id: string) => void;
}) {
  const avgScore = attempts.length > 0
    ? (attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length).toFixed(1)
    : '0';

  const passedCount = attempts.filter(a => a.passed).length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-4 shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-white">{exams.length}</p>
          <p className="text-sm text-slate-400">Simulados Disponiveis</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-white">{avgScore}%</p>
          <p className="text-sm text-slate-400">Media nas Provas</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg">
            <Award className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-white">{passedCount}</p>
          <p className="text-sm text-slate-400">Simulados Aprovados</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mb-4 shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-white">{attempts.length}</p>
          <p className="text-sm text-slate-400">Simulados Realizados</p>
        </div>
      </div>

      {/* Profile Reminder */}
      {!studentProfile && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Complete seu Perfil</h3>
              <p className="text-sm text-slate-300 mb-3">
                Configure seu perfil de estudos para receber recomendacoes personalizadas baseadas no seu tempo disponivel.
              </p>
              <button
                onClick={() => {}}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                Configurar Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Attempts */}
      {attempts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Ultimos Resultados</h3>
          <div className="space-y-3">
            {attempts.slice(0, 3).map((attempt) => (
              <div key={attempt.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{attempt.exam?.name}</p>
                    <p className="text-sm text-slate-400">{attempt.exam?.discipline?.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${attempt.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                        {attempt.percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-400">
                        {attempt.total_score}/{attempt.exam?.total_questions} questoes
                      </p>
                    </div>
                    {attempt.passed ? (
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400" />
                    )}
                    <button
                      onClick={() => onViewResult(attempt.id)}
                      className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 transition-colors"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Exams */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Simulados Disponiveis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.slice(0, 4).map((exam) => (
            <div key={exam.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: exam.discipline?.color + '20', border: `2px solid ${exam.discipline?.color}` }}
                  >
                    <BookOpen className="w-6 h-6" style={{ color: exam.discipline?.color }} />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{exam.name}</h4>
                    <p className="text-sm text-slate-400">{exam.discipline?.name}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {exam.duration_minutes} min
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {exam.total_questions} questoes
                </span>
              </div>
              <button
                onClick={() => onStartExam(exam.id)}
                className="w-full py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Iniciar Simulado
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExamsList({ exams, onStartExam }: { exams: Exam[]; onStartExam: (id: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Simulados Disponiveis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map((exam) => (
          <div key={exam.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: exam.discipline?.color + '20', border: `2px solid ${exam.discipline?.color}` }}
              >
                <BookOpen className="w-6 h-6" style={{ color: exam.discipline?.color }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{exam.name}</h3>
                <p className="text-sm text-slate-400">{exam.discipline?.name}</p>
              </div>
            </div>
            {exam.description && (
              <p className="text-sm text-slate-300 mb-4">{exam.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {exam.duration_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {exam.total_questions} questoes
              </span>
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg">
                Nota min: {exam.passing_score}%
              </span>
            </div>
            <button
              onClick={() => onStartExam(exam.id)}
              className="w-full py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Iniciar Simulado
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryView({ attempts, onViewResult }: { attempts: ExamAttempt[]; onViewResult: (id: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Historico de Simulados</h2>
      {attempts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400">Nenhum simulado realizado ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{attempt.exam?.name}</h3>
                  <p className="text-sm text-slate-400">{attempt.exam?.discipline?.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Realizado em {new Date(attempt.started_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${attempt.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                      {attempt.percentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-400">
                      {attempt.total_score}/{attempt.exam?.total_questions} questoes corretas
                    </p>
                    <p className="text-xs text-slate-500">
                      {Math.floor((attempt.time_spent_seconds || 0) / 60)} min
                    </p>
                  </div>
                  {attempt.passed ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Aprovado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-xl">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-medium">Reprovado</span>
                    </div>
                  )}
                  <button
                    onClick={() => onViewResult(attempt.id)}
                    className="px-4 py-2 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileEditor({ profile, onUpdate }: { profile: StudentProfile | null; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    available_hours_per_week: profile?.available_hours_per_week || 20,
    preferred_study_times: profile?.preferred_study_times || [],
    next_exam_date: profile?.next_exam_date || '',
    study_style: profile?.study_style || 'balanced',
    learning_preferences: profile?.learning_preferences || [],
    additional_notes: profile?.additional_notes || '',
  });

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (profile) {
      await supabase
        .from('student_profiles')
        .update(formData)
        .eq('id', profile.id);
    } else {
      await supabase
        .from('student_profiles')
        .insert({
          user_id: user.id,
          ...formData,
        });
    }

    setEditing(false);
    onUpdate();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Meu Perfil de Estudos</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Editar Perfil
          </button>
        )}
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Horas Disponiveis por Semana
            </label>
            {editing ? (
              <input
                type="number"
                value={formData.available_hours_per_week}
                onChange={(e) => setFormData({ ...formData, available_hours_per_week: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white"
                min={1}
                max={100}
              />
            ) : (
              <p className="text-2xl font-bold text-white">
                {profile?.available_hours_per_week || 20} horas
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Proxima Avaliacao Importante
            </label>
            {editing ? (
              <input
                type="date"
                value={formData.next_exam_date}
                onChange={(e) => setFormData({ ...formData, next_exam_date: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white"
              />
            ) : (
              <p className="text-lg text-white">
                {profile?.next_exam_date
                  ? new Date(profile.next_exam_date).toLocaleDateString('pt-BR')
                  : 'Nao definida'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Estilo de Estudo
            </label>
            {editing ? (
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'intensive', label: 'Intensivo', desc: '5+ horas/dia' },
                  { id: 'balanced', label: 'Equilibrado', desc: '2-4 horas/dia' },
                  { id: 'relaxed', label: 'Moderado', desc: '1-2 horas/dia' },
                ] as const).map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, study_style: style.id })}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.study_style === style.id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-700 bg-slate-900/50'
                    }`}
                  >
                    <p className={`text-sm font-medium ${formData.study_style === style.id ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {style.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{style.desc}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-lg text-white capitalize">
                {profile?.study_style === 'intensive' ? 'Intensivo' : profile?.study_style === 'balanced' ? 'Equilibrado' : 'Moderado'}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Observacoes Adicionais
            </label>
            {editing ? (
              <textarea
                value={formData.additional_notes}
                onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white resize-none"
                rows={3}
                placeholder="Adicione informacoes sobre seus objetivos de estudo..."
              />
            ) : (
              <p className="text-slate-300">
                {profile?.additional_notes || 'Nenhuma observacao adicionada'}
              </p>
            )}
          </div>
        </div>

        {editing && (
          <div className="flex gap-3 mt-6 pt-6 border-t border-slate-700">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
