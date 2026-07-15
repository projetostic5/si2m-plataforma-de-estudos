import { useState } from 'react';
import { supabase, StudentProfile } from '../lib/supabase';
import {
  Calendar,
  Clock,
  Brain,
  BookOpen,
  Briefcase,
  Moon,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  GraduationCap,
  Edit,
} from 'lucide-react';

type KnowledgeLevel = 'basic' | 'intermediate' | 'advanced';

interface OnboardingData {
  next_exam_date: string;
  hours_per_day: number;
  knowledge_level: KnowledgeLevel;
  preferred_study_model: string;
  is_working: boolean;
  sleep_hours: number;
  has_limitations: boolean;
}

const DEFAULT_EXAM_DATE = '2026-07-31';

const STEP_META = [
  {
    Icon: Clock,
    title: 'Horas disponíveis por dia',
    question: 'Quantas horas por dia você tem disponíveis para dedicar aos estudos?',
    hint: 'Essa resposta é fundamental para a construção do seu plano de estudos personalizado.',
  },
  {
    Icon: Brain,
    title: 'Nível de conhecimento',
    question: 'Como você avalia seu nível atual de conhecimento nos temas gerais desta disciplina?',
    hint: 'Seja honesto — isso nos ajuda a calibrar o conteúdo e o ritmo certo para você.',
  },
  {
    Icon: BookOpen,
    title: 'Modelo de estudo',
    question: 'Qual é o seu modelo preferido de estudo? O que funciona bem para você? Qual é a maneira eficiente que você realmente aprende?',
    hint: 'Descreva brevemente sua forma preferida de estudar.',
  },
  {
    Icon: Briefcase,
    title: 'Situação profissional',
    question: 'Atualmente você está trabalhando, dando plantões ou estagiando?',
    hint: '',
  },
  {
    Icon: Moon,
    title: 'Qualidade de sono',
    question: 'Sobre a qualidade de sono — quantas horas você geralmente dorme por noite?',
    hint: '',
  },
  {
    Icon: AlertCircle,
    title: 'Fatores pessoais',
    question: 'Há fatores ou limitações pessoais que afetam sua capacidade de concentração ou dedicação no momento?',
    hint: '',
  },
] as const;

const TOTAL_STEPS = STEP_META.length;

// --- Summary (read-only profile view) ---

function ProfileSummary({
  profile,
  onEdit,
}: {
  profile: StudentProfile;
  onEdit: () => void;
}) {
  const knowledgeLabel: Record<string, string> = {
    basic: 'Básico',
    intermediate: 'Intermediário',
    advanced: 'Avançado',
  };

  const items = [
    {
      Icon: Calendar,
      label: 'Próxima prova',
      value: profile.next_exam_date
        ? new Date(profile.next_exam_date + 'T12:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : '—',
    },
    {
      Icon: Clock,
      label: 'Horas de estudo por dia',
      value: profile.hours_per_day ? `${profile.hours_per_day} horas` : '—',
    },
    {
      Icon: Brain,
      label: 'Nível de conhecimento',
      value: profile.knowledge_level ? knowledgeLabel[profile.knowledge_level] : '—',
    },
    {
      Icon: BookOpen,
      label: 'Modelo de estudo preferido',
      value: profile.preferred_study_model || '—',
    },
    {
      Icon: Briefcase,
      label: 'Trabalhando / plantões / estágio',
      value: profile.is_working == null ? '—' : profile.is_working ? 'Sim' : 'Não',
    },
    {
      Icon: Moon,
      label: 'Horas de sono por noite',
      value: profile.sleep_hours ? `${profile.sleep_hours} horas` : '—',
    },
    {
      Icon: AlertCircle,
      label: 'Fatores que afetam concentração',
      value: profile.has_limitations == null ? '—' : profile.has_limitations ? 'Sim' : 'Não',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Meu Perfil de Estudos</h2>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Editar Perfil
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(({ Icon, label, value }) => (
          <div
            key={label}
            className={`bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 ${
              label === 'Modelo de estudo preferido' ? 'md:col-span-2' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
            </div>
            <p className="text-white font-medium leading-relaxed">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main onboarding wizard ---

export function StudentOnboarding({
  existingProfile,
  onComplete,
}: {
  existingProfile: StudentProfile | null;
  onComplete: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(!existingProfile?.onboarding_completed);

  const [data, setData] = useState<OnboardingData>({
    next_exam_date: existingProfile?.next_exam_date || DEFAULT_EXAM_DATE,
    hours_per_day: existingProfile?.hours_per_day || 3,
    knowledge_level: (existingProfile?.knowledge_level as KnowledgeLevel) || 'intermediate',
    preferred_study_model: existingProfile?.preferred_study_model || '',
    is_working: existingProfile?.is_working ?? false,
    sleep_hours: existingProfile?.sleep_hours || 7,
    has_limitations: existingProfile?.has_limitations ?? false,
  });

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: return data.hours_per_day >= 2 && data.hours_per_day <= 6;
      case 2: return !!data.knowledge_level;
      case 3: return data.preferred_study_model.trim().length > 0;
      case 4: return data.is_working !== null && data.is_working !== undefined;
      case 5: return data.sleep_hours >= 4;
      case 6: return data.has_limitations !== null && data.has_limitations !== undefined;
      default: return true;
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        ...data,
        available_hours_per_week: data.hours_per_day * 5,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      if (existingProfile) {
        await supabase.from('student_profiles').update(payload).eq('id', existingProfile.id);
      } else {
        await supabase.from('student_profiles').insert({
          user_id: user.id,
          ...payload,
          study_style: 'balanced',
        });
      }

      onComplete();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // Show summary if onboarding is done and not actively editing
  if (!editing && existingProfile?.onboarding_completed) {
    return (
      <ProfileSummary
        profile={existingProfile}
        onEdit={() => {
          setCurrentStep(1);
          setData((d) => ({ ...d, next_exam_date: d.next_exam_date || DEFAULT_EXAM_DATE }));
          setEditing(true);
        }}
      />
    );
  }

  const { Icon: StepIcon, question, hint } = STEP_META[currentStep - 1];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">
          {existingProfile?.onboarding_completed
            ? 'Atualizar Perfil de Estudos'
            : 'Configure seu Perfil de Estudos'}
        </h2>
        <p className="text-slate-400 text-sm">
          Passo {currentStep} de {TOTAL_STEPS} — {STEP_META[currentStep - 1].title}
        </p>
      </div>

      {/* Step progress dots */}
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < currentStep ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 mb-6">
        {/* Question header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <StepIcon className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white leading-snug mb-2">{question}</h3>
            {hint && <p className="text-sm text-slate-400">{hint}</p>}
          </div>
        </div>

        {/* Step input */}
        <div className="pl-16">
          {/* Step 1 — Hours per day */}
          {currentStep === 1 && (
            <div className="grid grid-cols-5 gap-3">
              {[2, 3, 4, 5, 6].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setData({ ...data, hours_per_day: h })}
                  className={`py-5 rounded-xl border-2 font-bold text-xl transition-all ${
                    data.hours_per_day === h
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          )}

          {/* Step 2 — Knowledge level */}
          {currentStep === 2 && (
            <div className="space-y-3">
              {([
                { id: 'basic', label: 'Básico', desc: 'Ainda estou aprendendo os fundamentos da disciplina' },
                { id: 'intermediate', label: 'Intermediário', desc: 'Tenho uma base sólida, mas preciso aprofundar em alguns temas' },
                { id: 'advanced', label: 'Avançado', desc: 'Domino os principais conteúdos e busco consolidação' },
              ] as const).map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setData({ ...data, knowledge_level: level.id })}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all text-left ${
                    data.knowledge_level === level.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      data.knowledge_level === level.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                    }`}
                  >
                    {data.knowledge_level === level.id && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`font-semibold ${
                        data.knowledge_level === level.id ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {level.label}
                    </p>
                    <p className="text-sm text-slate-400 mt-0.5">{level.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 3 — Study model */}
          {currentStep === 3 && (
            <div>
              <textarea
                value={data.preferred_study_model}
                onChange={(e) => setData({ ...data, preferred_study_model: e.target.value })}
                maxLength={300}
                rows={4}
                placeholder="Ex: Prefiro estudar em blocos de 25 minutos com pausas curtas, usando flashcards e resolução de questões comentadas..."
                className="w-full px-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
              />
              <p className="text-xs text-slate-500 text-right mt-1.5">
                {data.preferred_study_model.length}/300
              </p>
            </div>
          )}

          {/* Step 4 — Working */}
          {currentStep === 4 && (
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  value: true,
                  label: 'Sim',
                  desc: 'Estou trabalhando, dando plantões ou estagiando',
                },
                {
                  value: false,
                  label: 'Não',
                  desc: 'Posso me dedicar exclusivamente aos estudos agora',
                },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setData({ ...data, is_working: opt.value })}
                  className={`px-5 py-6 rounded-xl border-2 transition-all text-left ${
                    data.is_working === opt.value
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                  }`}
                >
                  <p
                    className={`text-3xl font-bold mb-2 ${
                      data.is_working === opt.value ? 'text-emerald-400' : 'text-white'
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 5 — Sleep hours */}
          {currentStep === 5 && (
            <div className="grid grid-cols-4 gap-3">
              {[4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setData({ ...data, sleep_hours: h })}
                  className={`py-5 rounded-xl border-2 font-bold text-xl transition-all ${
                    data.sleep_hours === h
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          )}

          {/* Step 6 — Limitations */}
          {currentStep === 6 && (
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  value: true,
                  label: 'Sim',
                  desc: 'Existem fatores que podem limitar minha concentração ou disponibilidade',
                },
                {
                  value: false,
                  label: 'Não',
                  desc: 'Estou em boas condições para me dedicar aos estudos',
                },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setData({ ...data, has_limitations: opt.value })}
                  className={`px-5 py-6 rounded-xl border-2 transition-all text-left ${
                    data.has_limitations === opt.value
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                  }`}
                >
                  <p
                    className={`text-3xl font-bold mb-2 ${
                      data.has_limitations === opt.value ? 'text-emerald-400' : 'text-white'
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:text-white hover:border-slate-600 transition-all disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        {currentStep < TOTAL_STEPS ? (
          <button
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={!canProceed() || saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Concluir
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
