import { useState, useEffect } from 'react';
import { supabase, Discipline, Dimension, Theme, Question } from '../lib/supabase';
import {
  Plus,
  Save,
  X,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { QuestionsImporter } from './QuestionsImporter';

export function QuestionsManager({ disciplines }: { disciplines: Discipline[] }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('');
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  const [formData, setFormData] = useState({
    discipline_id: '',
    dimension_id: '',
    theme_id: '',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    option_e: '',
    correct_answer: 'a' as 'a' | 'b' | 'c' | 'd' | 'e',
    explanation: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });

  useEffect(() => {
    fetchQuestions();
  }, [filterDiscipline, searchTerm]);

  useEffect(() => {
    if (formData.discipline_id) {
      fetchDimensions(formData.discipline_id);
    }
  }, [formData.discipline_id]);

  useEffect(() => {
    if (formData.dimension_id) {
      fetchThemes(formData.dimension_id);
    }
  }, [formData.dimension_id]);

  const fetchQuestions = async () => {
    setLoading(true);
    let query = supabase
      .from('questions')
      .select(`
        *,
        discipline:disciplines(*),
        dimension:dimensions(*),
        theme:themes(*)
      `)
      .order('created_at', { ascending: false });

    if (filterDiscipline) {
      query = query.eq('discipline_id', filterDiscipline);
    }

    if (searchTerm) {
      query = query.ilike('question_text', `%${searchTerm}%`);
    }

    const { data } = await query;
    setQuestions(data || []);
    setLoading(false);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();

    if (editingQuestion) {
      await supabase
        .from('questions')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingQuestion.id);
    } else {
      await supabase.from('questions').insert({
        ...formData,
        created_by: user?.id,
      });
    }

    resetForm();
    fetchQuestions();
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      discipline_id: question.discipline_id,
      dimension_id: question.dimension_id,
      theme_id: question.theme_id || '',
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      option_e: question.option_e || '',
      correct_answer: question.correct_answer,
      explanation: question.explanation || '',
      difficulty: question.difficulty,
    });
    fetchDimensions(question.discipline_id);
    fetchThemes(question.dimension_id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta questao?')) return;
    await supabase.from('questions').delete().eq('id', id);
    fetchQuestions();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingQuestion(null);
    setFormData({
      discipline_id: '',
      dimension_id: '',
      theme_id: '',
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      option_e: '',
      correct_answer: 'a',
      explanation: '',
      difficulty: 'medium',
    });
    setDimensions([]);
    setThemes([]);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Questoes</h2>
        <div className="flex items-center gap-3">
          <QuestionsImporter disciplines={disciplines} onImportComplete={fetchQuestions} />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
          >
            <Plus className="w-4 h-4" />
            Nova Questao
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Buscar questoes..."
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todas Disciplinas</option>
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingQuestion ? 'Editar Questao' : 'Nova Questao'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Disciplina *</label>
                  <select
                    value={formData.discipline_id}
                    onChange={(e) => setFormData({ ...formData, discipline_id: e.target.value, dimension_id: '', theme_id: '' })}
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white"
                    required
                  >
                    <option value="">Selecione...</option>
                    {disciplines.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Dimensao *</label>
                  <select
                    value={formData.dimension_id}
                    onChange={(e) => setFormData({ ...formData, dimension_id: e.target.value, theme_id: '' })}
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white"
                    required
                    disabled={!formData.discipline_id}
                  >
                    <option value="">Selecione...</option>
                    {dimensions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tema *</label>
                  <select
                    value={formData.theme_id}
                    onChange={(e) => setFormData({ ...formData, theme_id: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white"
                    required
                    disabled={!formData.dimension_id}
                  >
                    <option value="">Selecione...</option>
                    {themes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Enunciado *</label>
                <textarea
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white resize-none"
                  rows={4}
                  required
                  placeholder="Digite o enunciado da questao..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(['a', 'b', 'c', 'd', 'e'] as const).map((letter) => (
                  letter !== 'e' || formData.option_e !== '' || editingQuestion?.option_e ? (
                    <div key={letter} className="relative">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Alternativa {letter.toUpperCase()} *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData[`option_${letter}` as keyof typeof formData] || ''}
                          onChange={(e) => setFormData({ ...formData, [`option_${letter}`]: e.target.value })}
                          className="flex-1 px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white"
                          required={letter !== 'e'}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, correct_answer: letter })}
                          className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
                            formData.correct_answer === letter
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : null
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Dificuldade</label>
                  <div className="flex gap-2">
                    {(['easy', 'medium', 'hard'] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setFormData({ ...formData, difficulty: diff })}
                        className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all border ${
                          formData.difficulty === diff
                            ? getDifficultyColor(diff)
                            : 'bg-slate-700/50 text-slate-400 border-slate-700'
                        }`}
                      >
                        {diff === 'easy' ? 'Facil' : diff === 'medium' ? 'Media' : 'Dificil'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Explicacao</label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white resize-none"
                  rows={3}
                  placeholder="Explicacao da resposta correta..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingQuestion ? 'Atualizar' : 'Salvar'}
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

      {/* Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Visualizar Questao</h3>
              <button onClick={() => setPreviewQuestion(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-slate-700 rounded-lg text-xs text-slate-300">
                  {previewQuestion.discipline?.name}
                </span>
                <span className="px-2 py-1 bg-slate-700 rounded-lg text-xs text-slate-300">
                  {previewQuestion.dimension?.name}
                </span>
                <span className={`px-2 py-1 rounded-lg text-xs border ${getDifficultyColor(previewQuestion.difficulty)}`}>
                  {previewQuestion.difficulty === 'easy' ? 'Facil' : previewQuestion.difficulty === 'medium' ? 'Media' : 'Dificil'}
                </span>
              </div>

              <p className="text-white leading-relaxed">{previewQuestion.question_text}</p>

              <div className="space-y-2">
                {(['a', 'b', 'c', 'd', 'e'] as const).map((letter) => {
                  const option = previewQuestion[`option_${letter}` as keyof Question];
                  if (!option) return null;
                  return (
                    <div
                      key={letter}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        previewQuestion.correct_answer === letter
                          ? 'bg-emerald-500/10 border border-emerald-500/30'
                          : 'bg-slate-700/30'
                      }`}
                    >
                      <span className="w-6 h-6 flex items-center justify-center bg-slate-600 rounded-lg text-xs text-white font-medium">
                        {letter.toUpperCase()}
                      </span>
                      <span className="text-white text-sm">{option}</span>
                      {previewQuestion.correct_answer === letter && (
                        <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />
                      )}
                    </div>
                  );
                })}
              </div>

              {previewQuestion.explanation && (
                <div className="mt-4 p-4 bg-slate-700/30 rounded-xl">
                  <p className="text-sm text-slate-300 mb-1 font-medium">Explicacao:</p>
                  <p className="text-sm text-white">{previewQuestion.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400">Nenhuma questao encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <div key={question.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-slate-700 rounded-lg text-xs text-slate-300">
                      {question.discipline?.name}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs border ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty === 'easy' ? 'Facil' : question.difficulty === 'medium' ? 'Media' : 'Dificil'}
                    </span>
                  </div>
                  <p className="text-white text-sm line-clamp-2">{question.question_text}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewQuestion(question)}
                    className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(question)}
                    className="p-2 text-slate-400 hover:text-amber-400 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
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
