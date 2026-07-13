import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Exam, ExamQuestion, ExamAnswer } from '../lib/supabase';
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Flag,
  Send,
} from 'lucide-react';

export function ExamTaking({
  examId,
  onComplete,
  onCancel,
}: {
  examId: string;
  onComplete: (attemptId: string, completedAt: string) => void;
  onCancel: () => void;
}) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    initializeExam();
  }, [examId]);

  useEffect(() => {
    if (timeLeft <= 0 || !attemptId) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, attemptId]);

  const initializeExam = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch exam details
    const { data: examData } = await supabase
      .from('exams')
      .select(`
        *,
        discipline:disciplines(*)
      `)
      .eq('id', examId)
      .single();

    if (!examData) return;

    // Fetch questions
    const { data: questionsData } = await supabase
      .from('exam_questions')
      .select(`
        *,
        question:questions(*)
      `)
      .eq('exam_id', examId)
      .order('question_order');

    if (!questionsData) return;

    setExam(examData);
    setTimeLeft(examData.duration_minutes * 60);

    // Check for existing incomplete attempt
    const { data: existingAttempt } = await supabase
      .from('exam_attempts')
      .select('id, started_at, question_order')
      .eq('exam_id', examId)
      .eq('user_id', user.id)
      .is('completed_at', null)
      .maybeSingle();

    if (existingAttempt) {
      // Restore saved question order if available
      const storedOrder = existingAttempt.question_order as string[] | null;
      if (storedOrder?.length) {
        const orderMap = Object.fromEntries(storedOrder.map((id, idx) => [id, idx]));
        questionsData.sort((a, b) => (orderMap[a.question_id] ?? 999) - (orderMap[b.question_id] ?? 999));
      }
      setQuestions(questionsData);
      setAttemptId(existingAttempt.id);
      const elapsedSeconds = Math.floor((new Date().getTime() - new Date(existingAttempt.started_at).getTime()) / 1000);
      const remainingTime = Math.max(0, examData.duration_minutes * 60 - elapsedSeconds);
      setTimeLeft(remainingTime);
    } else {
      // Shuffle questions for a fresh attempt
      const shuffled = [...questionsData].sort(() => Math.random() - 0.5);
      const shuffledOrder = shuffled.map(q => q.question_id);

      const { data: newAttempt } = await supabase
        .from('exam_attempts')
        .insert({
          exam_id: examId,
          user_id: user.id,
          question_order: shuffledOrder,
        })
        .select()
        .single();

      setQuestions(shuffled);
      setAttemptId(newAttempt?.id || null);
    }
    setLoading(false);
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentIndex].question_id]: answer,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!attemptId || !exam) return;

    // Save all answers
    const answersToSave = Object.entries(answers).map(([questionId, selectedAnswer]) => {
      const question = questions.find(q => q.question_id === questionId)?.question;
      return {
        attempt_id: attemptId,
        question_id: questionId,
        selected_answer: selectedAnswer as 'a' | 'b' | 'c' | 'd' | 'e',
        is_correct: question?.correct_answer === selectedAnswer,
      };
    });

    await supabase.from('exam_answers').insert(answersToSave);

    // Calculate score
    const correctAnswers = answersToSave.filter(a => a.is_correct).length;
    const totalQuestions = questions.length;
    const percentage = (correctAnswers / totalQuestions) * 100;
    const passed = percentage >= exam.passing_score;
    const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

    // Update attempt
    await supabase
      .from('exam_attempts')
      .update({
        completed_at: new Date().toISOString(),
        total_score: correctAnswers,
        percentage,
        passed,
        time_spent_seconds: timeSpent,
      })
      .eq('id', attemptId);

    const completedAt = new Date().toISOString();
    onComplete(attemptId, completedAt);
  }, [attemptId, answers, exam, questions, startTime, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex]?.question;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;

  if (loading || !exam || !currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando simulado...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">{exam.name}</h1>
            <p className="text-sm text-slate-400">{exam.discipline?.name}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className={`px-6 py-3 rounded-xl flex items-center gap-3 ${
              timeLeft < 300
                ? 'bg-red-500/20 border border-red-500/30 animate-pulse'
                : 'bg-slate-700/50'
            }`}>
              <Clock className={`w-5 h-5 ${timeLeft < 300 ? 'text-red-400' : 'text-slate-400'}`} />
              <span className={`text-xl font-bold font-mono ${timeLeft < 300 ? 'text-red-400' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Finalizar
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-400" />
              <h3 className="text-xl font-bold text-white">Finalizar Simulado?</h3>
            </div>
            <p className="text-slate-300 mb-2">
              Voce respondeu {Object.keys(answers).length} de {questions.length} questoes.
            </p>
            {Object.keys(answers).length < questions.length && (
              <p className="text-amber-400 text-sm mb-4">
                Ainda existem questoes sem resposta.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
              >
                Continuar Prova
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-8">
          {/* Question Area */}
          <div className="col-span-8">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-10 h-10 flex items-center justify-center bg-emerald-500 rounded-xl text-white font-bold">
                  {currentIndex + 1}
                </span>
                <span className="text-slate-400 text-sm">
                  Questao {currentIndex + 1} de {questions.length}
                </span>
              </div>

              <p className="text-xl text-white leading-relaxed mb-8">
                {currentQuestion.question_text}
              </p>

              <div className="space-y-3">
                {(['a', 'b', 'c', 'd', 'e'] as const).map((letter) => {
                  const option = currentQuestion[`option_${letter}` as keyof typeof currentQuestion];
                  if (!option) return null;
                  const isSelected = currentAnswer === letter;

                  return (
                    <button
                      key={letter}
                      onClick={() => handleAnswerSelect(letter)}
                      className={`w-full flex items-start gap-4 p-5 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500'
                          : 'bg-slate-700/30 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-medium ${
                        isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-300'
                      }`}>
                        {letter.toUpperCase()}
                      </span>
                      <span className={`flex-1 text-left ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {option}
                      </span>
                      {isSelected && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="col-span-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 sticky top-28">
              <h3 className="text-sm font-medium text-slate-300 mb-4">Navegacao</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => {
                  const isAnswered = !!answers[q.question_id];
                  const isCurrent = index === currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`aspect-square flex items-center justify-center rounded-lg font-medium transition-all ${
                        isCurrent
                          ? 'bg-emerald-500 text-white'
                          : isAnswered
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded" />
                    <span className="text-slate-400">Respondida</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-700 rounded" />
                    <span className="text-slate-400">Nao respondida</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-slate-700/50 rounded-xl">
                  <p className="text-sm text-slate-300">
                    Respondidas: <span className="font-bold text-emerald-400">{Object.keys(answers).length}</span>/{questions.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
