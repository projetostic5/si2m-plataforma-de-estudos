import { useState } from 'react';
import { supabase, Discipline, Dimension, Theme } from '../lib/supabase';
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  Eye,
  DownloadCloud,
} from 'lucide-react';

interface ParsedQuestion {
  number: number;
  enunciado: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  gabarito: 'a' | 'b' | 'c' | 'd' | 'e';
  justificativa: string;
  especialidade: string;
  dimensao: string;
  tema: string;
  dificuldade: 'easy' | 'medium' | 'hard';
  error?: string;
}

export function QuestionsImporter({
  disciplines,
  onImportComplete,
}: {
  disciplines: Discipline[];
  onImportComplete: () => void;
}) {
  const [showImporter, setShowImporter] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'input' | 'preview' | 'complete'>('input');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [importStats, setImportStats] = useState({ success: 0, error: 0 });

  const parseQuestions = (text: string): ParsedQuestion[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const questions: ParsedQuestion[] = [];
    let current: Partial<ParsedQuestion> = {};
    let questionNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detecta número da questão
      if (/^\d+\.\s/.test(line)) {
        if (current.enunciado) {
          if (validateQuestion(current as ParsedQuestion)) {
            questions.push(current as ParsedQuestion);
          }
        }
        questionNumber++;
        current = {
          number: questionNumber,
          enunciado: line.replace(/^\d+\.\s/, ''),
        };
      }
      // Detecta alternativas
      else if (/^[A-E]\)\s/.test(line)) {
        const letter = line.charAt(0).toLowerCase() as 'a' | 'b' | 'c' | 'd' | 'e';
        const text = line.replace(/^[A-E]\)\s/, '');
        current[`option${letter.toUpperCase()}`] = text;
      }
      // Detecta gabarito
      else if (line.startsWith('Gabarito:')) {
        const gabarito = line.split(':')[1].trim().toLowerCase() as 'a' | 'b' | 'c' | 'd' | 'e';
        current.gabarito = gabarito;
      }
      // Detecta justificativa
      else if (line.startsWith('Justificativa:')) {
        current.justificativa = line.split(':').slice(1).join(':').trim();
      }
      // Detecta especialidade
      else if (line.startsWith('Especialidade:')) {
        current.especialidade = line.split(':')[1].trim();
      }
      // Detecta dimensão
      else if (line.startsWith('Dimensão:') || line.startsWith('Dimensao:')) {
        current.dimensao = line.split(':')[1].trim();
      }
      // Detecta tema
      else if (line.startsWith('Tema:')) {
        current.tema = line.split(':')[1].trim();
      }
      // Detecta dificuldade
      else if (line.startsWith('Dificuldade:')) {
        const diff = line.split(':')[1].trim().toLowerCase();
        if (diff === 'fácil' || diff === 'facil') current.dificuldade = 'easy';
        else if (diff === 'médio' || diff === 'medio') current.dificuldade = 'medium';
        else if (diff === 'difícil' || diff === 'dificil') current.dificuldade = 'hard';
      }
    }

    // Adiciona a última questão
    if (current.enunciado && validateQuestion(current as ParsedQuestion)) {
      questions.push(current as ParsedQuestion);
    }

    return questions;
  };

  const validateQuestion = (q: Partial<ParsedQuestion>): boolean => {
    const errors = [];
    if (!q.enunciado) errors.push('Falta enunciado');
    if (!q.optionA || !q.optionB || !q.optionC || !q.optionD) errors.push('Faltam alternativas');
    if (!q.gabarito) errors.push('Falta gabarito');
    if (!q.justificativa) errors.push('Falta justificativa');
    if (!q.especialidade) errors.push('Falta especialidade');
    if (!q.dimensao) errors.push('Falta dimensão');
    if (!q.tema) errors.push('Falta tema');

    if (errors.length > 0) {
      (q as ParsedQuestion).error = errors.join(', ');
      return false;
    }
    return true;
  };

  const handleParse = () => {
    if (!textInput.trim()) {
      alert('Cole o conteúdo das questões no campo de texto');
      return;
    }

    setLoading(true);
    const parsed = parseQuestions(textInput);
    setParsedQuestions(parsed);
    setLoading(false);

    if (parsed.length === 0) {
      alert('Nenhuma questão válida foi encontrada. Verifique o formato.');
    } else {
      setStep('preview');
    }
  };

  const handleImport = async () => {
    if (parsedQuestions.length === 0) return;

    setImporting(true);
    let successCount = 0;
    let errorCount = 0;
    const { data: { user } } = await supabase.auth.getUser();

    for (const pq of parsedQuestions) {
      try {
        // Encontra disciplina por especialidade
        let discipline = disciplines.find(
          d => d.name.toLowerCase() === pq.especialidade.toLowerCase()
        );

        if (!discipline) {
          // Cria disciplina se não existir
          const { data: newDiscipline } = await supabase
            .from('disciplines')
            .insert({ name: pq.especialidade })
            .select()
            .single();
          discipline = newDiscipline;
        }

        if (!discipline) throw new Error('Falha ao obter disciplina');

        // Encontra ou cria dimensão
        let { data: dimensionData } = await supabase
          .from('dimensions')
          .select('id')
          .eq('discipline_id', discipline.id)
          .eq('name', pq.dimensao)
          .maybeSingle();

        if (!dimensionData) {
          const { data: newDimension } = await supabase
            .from('dimensions')
            .insert({
              discipline_id: discipline.id,
              name: pq.dimensao,
            })
            .select()
            .single();
          dimensionData = newDimension;
        }

        if (!dimensionData) throw new Error('Falha ao obter dimensão');

        // Encontra ou cria tema
        let { data: themeData } = await supabase
          .from('themes')
          .select('id')
          .eq('dimension_id', dimensionData.id)
          .eq('name', pq.tema)
          .maybeSingle();

        if (!themeData) {
          const { data: newTheme } = await supabase
            .from('themes')
            .insert({
              dimension_id: dimensionData.id,
              name: pq.tema,
            })
            .select()
            .single();
          themeData = newTheme;
        }

        if (!themeData) throw new Error('Falha ao obter tema');

        // Insere questão
        const { error: questionError } = await supabase.from('questions').insert({
          discipline_id: discipline.id,
          dimension_id: dimensionData.id,
          theme_id: themeData.id,
          question_text: pq.enunciado,
          option_a: pq.optionA,
          option_b: pq.optionB,
          option_c: pq.optionC,
          option_d: pq.optionD,
          option_e: pq.optionE,
          correct_answer: pq.gabarito,
          explanation: pq.justificativa,
          difficulty: pq.dificuldade || 'medium',
          specialty: pq.especialidade,
          created_by: user?.id,
        });

        if (questionError) throw questionError;
        successCount++;
      } catch (error) {
        console.error('Erro ao importar questão:', error);
        errorCount++;
      }
    }

    setImportStats({ success: successCount, error: errorCount });
    setStep('complete');
    setImporting(false);

    setTimeout(() => {
      onImportComplete();
      resetImporter();
    }, 2000);
  };

  const resetImporter = () => {
    setShowImporter(false);
    setTextInput('');
    setParsedQuestions([]);
    setStep('input');
    setPreviewIndex(0);
  };

  const downloadTemplate = () => {
    const template = `1. Qual é o agente etiológico da dengue?
A) Bacterium dengue
B) Flavivírus
C) Coronavirus
D) Retrovírus
Gabarito: B
Justificativa: A dengue é causada pelo vírus Dengue, um Flavivírus transmitido pelo mosquito Aedes aegypti.
Especialidade: Infectologia
Dimensão: Doenças Infecciosas
Tema: Dengue
Dificuldade: Fácil

2. Qual antibiótico é primeira linha para infecção por Streptococcus pneumoniae?
A) Amoxicilina
B) Gentamicina
C) Fluoroquinolona
D) Metronidazol
Gabarito: A
Justificativa: A amoxicilina é o antibiótico beta-lactâmico de primeira linha para Streptococcus pneumoniae sensível.
Especialidade: Infectologia
Dimensão: Antimicrobianos
Tema: Antibióticos
Dificuldade: Médio`;

    const blob = new Blob([template], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_questoes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!showImporter) {
    return (
      <button
        onClick={() => setShowImporter(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
      >
        <Upload className="w-4 h-4" />
        Importar Questões
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Importar Questões</h3>
          <button onClick={resetImporter} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'input' && (
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-300 mb-3">
                Cole aqui o conteúdo com as questões no formato especificado. Cada questão deve incluir:
              </p>
              <ul className="text-sm text-blue-300 space-y-1 ml-4">
                <li>• Número e enunciado</li>
                <li>• Alternativas A-E</li>
                <li>• Gabarito</li>
                <li>• Justificativa</li>
                <li>• Especialidade, Dimensão, Tema e Dificuldade</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Cola as questões aqui:
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full h-64 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="1. Enunciado da questão?
A) Alternativa A
B) Alternativa B
..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleParse}
                disabled={loading}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Visualizar Questões
                  </>
                )}
              </button>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
              >
                <DownloadCloud className="w-4 h-4" />
                Template
              </button>
              <button
                onClick={resetImporter}
                className="px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">
                Visualizar Questões ({previewIndex + 1} de {parsedQuestions.length})
              </h4>
              <div className="flex items-center gap-2">
                {parsedQuestions.filter(q => !q.error).length > 0 && (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm">
                    {parsedQuestions.filter(q => !q.error).length} válidas
                  </span>
                )}
                {parsedQuestions.filter(q => q.error).length > 0 && (
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm">
                    {parsedQuestions.filter(q => q.error).length} com erro
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-xl p-6 min-h-96">
              {parsedQuestions[previewIndex].error ? (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-red-400">Erro ao processar questão</p>
                    <p className="text-sm text-slate-300 mt-1">{parsedQuestions[previewIndex].error}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <span className="px-2 py-1 bg-slate-600 rounded text-xs text-slate-300">
                      {parsedQuestions[previewIndex].especialidade}
                    </span>
                    <span className="px-2 py-1 bg-slate-600 rounded text-xs text-slate-300">
                      {parsedQuestions[previewIndex].dimensao}
                    </span>
                    <span className="px-2 py-1 bg-slate-600 rounded text-xs text-slate-300">
                      {parsedQuestions[previewIndex].tema}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      parsedQuestions[previewIndex].dificuldade === 'easy'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : parsedQuestions[previewIndex].dificuldade === 'medium'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                    }`}>
                      {parsedQuestions[previewIndex].dificuldade === 'easy' ? 'Fácil' : parsedQuestions[previewIndex].dificuldade === 'medium' ? 'Médio' : 'Difícil'}
                    </span>
                  </div>

                  <p className="text-white leading-relaxed">
                    {parsedQuestions[previewIndex].enunciado}
                  </p>

                  <div className="space-y-2">
                    {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => {
                      const key = `option${letter}` as keyof ParsedQuestion;
                      const option = parsedQuestions[previewIndex][key];
                      if (!option) return null;

                      const isCorrect = parsedQuestions[previewIndex].gabarito === letter.toLowerCase();
                      return (
                        <div
                          key={letter}
                          className={`p-3 rounded-lg text-sm ${
                            isCorrect
                              ? 'bg-emerald-500/20 border border-emerald-500/30'
                              : 'bg-slate-600/30'
                          }`}
                        >
                          <span className="font-medium">{letter})</span> {option}
                          {isCorrect && <CheckCircle className="inline w-4 h-4 text-emerald-400 ml-2" />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-slate-600">
                    <p className="text-sm text-slate-300">
                      <span className="font-medium text-white">Justificativa: </span>
                      {parsedQuestions[previewIndex].justificativa}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                disabled={previewIndex === 0}
                className="px-4 py-2 bg-slate-700 text-white rounded-xl disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-400">
                {previewIndex + 1} / {parsedQuestions.length}
              </span>
              <button
                onClick={() => setPreviewIndex(Math.min(parsedQuestions.length - 1, previewIndex + 1))}
                disabled={previewIndex === parsedQuestions.length - 1}
                className="px-4 py-2 bg-slate-700 text-white rounded-xl disabled:opacity-50"
              >
                Próxima
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={importing || parsedQuestions.filter(q => !q.error).length === 0}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importar {parsedQuestions.filter(q => !q.error).length} Questões
                  </>
                )}
              </button>
              <button
                onClick={() => setStep('input')}
                className="px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">Importação Concluída!</h4>
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <p className="text-2xl font-bold text-emerald-400">{importStats.success}</p>
                <p className="text-sm text-slate-400">Importadas</p>
              </div>
              <div className={`p-3 rounded-xl ${importStats.error > 0 ? 'bg-red-500/10' : 'bg-slate-700/50'}`}>
                <p className={`text-2xl font-bold ${importStats.error > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {importStats.error}
                </p>
                <p className="text-sm text-slate-400">Com Erro</p>
              </div>
            </div>
            <p className="text-slate-400">Redirecionando...</p>
          </div>
        )}
      </div>
    </div>
  );
}
