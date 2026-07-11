import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Discipline, Dimension, Theme, Topic, Question, Exam } from '../lib/supabase';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  ClipboardList,
  Users,
  LogOut,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  Save,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { QuestionsManager } from './QuestionsManager';
import { ExamsManager } from './ExamsManager';

type Tab = 'dashboard' | 'disciplines' | 'questions' | 'exams';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { profile, signOut } = useAuth();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalExams: 0,
    totalStudents: 0,
    activeExams: 0,
  });

  useEffect(() => {
    fetchDisciplines();
    fetchStats();
  }, []);

  const fetchDisciplines = async () => {
    const { data } = await supabase.from('disciplines').select('*').order('name');
    setDisciplines(data || []);
  };

  const fetchStats = async () => {
    const [questions, exams, students, activeExams] = await Promise.all([
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('exams').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('exams').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    setStats({
      totalQuestions: questions.count || 0,
      totalExams: exams.count || 0,
      totalStudents: students.count || 0,
      activeExams: activeExams.count || 0,
    });
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'disciplines', label: 'Disciplinas', icon: BookOpen },
    { id: 'questions', label: 'Questoes', icon: FileQuestion },
    { id: 'exams', label: 'Simulados', icon: ClipboardList },
  ];

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
              <p className="text-xs text-slate-400">Painel Admin</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
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
              <p className="text-xs text-slate-500">Administrador</p>
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
          {activeTab === 'dashboard' && <DashboardStats stats={stats} />}
          {activeTab === 'disciplines' && <DisciplinesManager disciplines={disciplines} onUpdate={fetchDisciplines} />}
          {activeTab === 'questions' && <QuestionsManager disciplines={disciplines} />}
          {activeTab === 'exams' && <ExamsManager disciplines={disciplines} />}
        </main>
      </div>
    </div>
  );
}

function DashboardStats({ stats }: { stats: typeof Stats.prototype }) {
  const statCards = [
    { label: 'Total de Questoes', value: stats.totalQuestions, icon: FileQuestion, color: 'from-blue-500 to-cyan-600' },
    { label: 'Simulados Criados', value: stats.totalExams, icon: ClipboardList, color: 'from-emerald-500 to-teal-600' },
    { label: 'Estudantes Ativos', value: stats.totalStudents, icon: Users, color: 'from-amber-500 to-orange-600' },
    { label: 'Simulados Ativos', value: stats.activeExams, icon: CheckCircle, color: 'from-rose-500 to-pink-600' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DisciplinesManager({ disciplines, onUpdate }: { disciplines: Discipline[]; onUpdate: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [showDimensions, setShowDimensions] = useState<string | null>(null);
  const [newDimensionName, setNewDimensionName] = useState('');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [showThemes, setShowThemes] = useState<string | null>(null);
  const [newThemeName, setNewThemeName] = useState('');

  useEffect(() => {
    if (showDimensions) {
      fetchDimensions(showDimensions);
    }
  }, [showDimensions]);

  useEffect(() => {
    if (showThemes) {
      fetchThemes(showThemes);
    }
  }, [showThemes]);

  const fetchDimensions = async (disciplineId: string) => {
    const { data } = await supabase
      .from('dimensions')
      .select('*')
      .eq('discipline_id', disciplineId)
      .order('name');
    setDimensions(data || []);
  };

  const fetchThemes = async (dimensionId: string) => {
    const { data } = await supabase
      .from('themes')
      .select('*')
      .eq('dimension_id', dimensionId)
      .order('name');
    setThemes(data || []);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    if (editingDiscipline) {
      await supabase
        .from('disciplines')
        .update({ name, description, color })
        .eq('id', editingDiscipline.id);
    } else {
      await supabase.from('disciplines').insert({
        name,
        description,
        color,
      });
    }

    resetForm();
    onUpdate();
  };

  const handleEdit = (discipline: Discipline) => {
    setEditingDiscipline(discipline);
    setName(discipline.name);
    setDescription(discipline.description || '');
    setColor(discipline.color);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta disciplina?')) return;
    const { error } = await supabase.from('disciplines').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir disciplina:', error);
      alert('Erro ao excluir disciplina: ' + error.message);
      return;
    }
    onUpdate();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingDiscipline(null);
    setName('');
    setDescription('');
    setColor('#3b82f6');
  };

  const handleAddDimension = async (disciplineId: string) => {
    if (!newDimensionName.trim()) return;
    await supabase.from('dimensions').insert({
      discipline_id: disciplineId,
      name: newDimensionName,
    });
    setNewDimensionName('');
    fetchDimensions(disciplineId);
  };

  const handleAddTheme = async (dimensionId: string) => {
    if (!newThemeName.trim()) return;
    await supabase.from('themes').insert({
      dimension_id: dimensionId,
      name: newThemeName,
    });
    setNewThemeName('');
    fetchThemes(dimensionId);
  };

  const handleDeleteDimension = async (dimensionId: string, disciplineId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este tópico? Todos os subtópicos e questões vinculados também serão excluídos.')) return;
    const { error } = await supabase.from('dimensions').delete().eq('id', dimensionId);
    if (error) {
      alert('Erro ao excluir tópico: ' + error.message);
      return;
    }
    setShowThemes(null);
    fetchDimensions(disciplineId);
  };

  const handleDeleteTheme = async (themeId: string, dimensionId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este subtópico? Todas as questões vinculadas também serão excluídas.')) return;
    const { error } = await supabase.from('themes').delete().eq('id', themeId);
    if (error) {
      alert('Erro ao excluir subtópico: ' + error.message);
      return;
    }
    fetchThemes(dimensionId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Disciplinas e Estrutura</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
        >
          <Plus className="w-4 h-4" />
          Nova Disciplina
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingDiscipline ? 'Editar Disciplina' : 'Nova Disciplina'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ex: Infectologia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Cor</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-12 bg-slate-900/50 border border-slate-700 rounded-xl cursor-pointer"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Descricao</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                rows={3}
                placeholder="Descricao da disciplina..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {disciplines.map((discipline) => (
          <div key={discipline.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: discipline.color + '20', border: `2px solid ${discipline.color}` }}
                  >
                    <BookOpen className="w-6 h-6" style={{ color: discipline.color }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{discipline.name}</h3>
                    {discipline.description && (
                      <p className="text-sm text-slate-400 mt-1">{discipline.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(discipline)}
                    className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(discipline.id)}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDimensions(showDimensions === discipline.id ? null : discipline.id)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className={`w-4 h-4 transition-transform ${showDimensions === discipline.id ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {showDimensions === discipline.id && (
              <div className="border-t border-slate-700/50 bg-slate-900/30 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={newDimensionName}
                    onChange={(e) => setNewDimensionName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm"
                    placeholder="Novo tópico..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDimension(discipline.id)}
                  />
                  <button
                    onClick={() => handleAddDimension(discipline.id)}
                    className="p-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="space-y-2">
                  {dimensions.filter(d => d.discipline_id === discipline.id).map((dim) => (
                    <div key={dim.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white font-medium">{dim.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteDimension(dim.id, discipline.id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            title="Excluir tópico"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowThemes(showThemes === dim.id ? null : dim.id)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform ${showThemes === dim.id ? 'rotate-90' : ''}`} />
                          </button>
                        </div>
                      </div>
                      {showThemes === dim.id && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="text"
                              value={newThemeName}
                              onChange={(e) => setNewThemeName(e.target.value)}
                              className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-xs"
                              placeholder="Novo subtópico..."
                              onKeyDown={(e) => e.key === 'Enter' && handleAddTheme(dim.id)}
                            />
                            <button
                              onClick={() => handleAddTheme(dim.id)}
                              className="p-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
                            >
                              <Plus className="w-3 h-3 text-white" />
                            </button>
                          </div>
                          <div className="space-y-1">
                            {themes.filter(t => t.dimension_id === dim.id).map((theme) => (
                              <div key={theme.id} className="flex items-center justify-between px-3 py-2 bg-slate-900/50 rounded-lg text-xs text-slate-300">
                                <span>{theme.name}</span>
                                <button
                                  onClick={() => handleDeleteTheme(theme.id, dim.id)}
                                  className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                  title="Excluir subtópico"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
