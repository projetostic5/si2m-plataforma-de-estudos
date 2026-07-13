import { useState, useEffect, useRef } from 'react';
import { supabase, Profile } from '../lib/supabase';
import {
  Users,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Copy,
  ChevronDown,
  ChevronUp,
  Trash2,
  UserPlus,
  FileText,
  KeyRound,
  Mail,
} from 'lucide-react';

interface ImportResult {
  full_name: string;
  email: string;
  success: boolean;
  error: string | null;
  password: string | null;
}

interface ParsedUser {
  full_name: string;
  email: string;
}

type DeliveryMode = 'password' | 'invite';

export function UsersManager() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [csvText, setCsvText] = useState('');
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('invite');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name');
    setStudents(data || []);
    setLoadingStudents(false);
  };

  const parseCSV = (text: string): ParsedUser[] => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const users: ParsedUser[] = [];
    for (const line of lines) {
      if (line.toLowerCase().startsWith('nome') || line.toLowerCase().startsWith('name')) continue;
      const parts = line.split(',');
      if (parts.length < 2) continue;
      const full_name = parts.slice(0, parts.length - 1).join(',').trim();
      const email = parts[parts.length - 1].trim().toLowerCase();
      if (full_name && email.includes('@')) {
        users.push({ full_name, email });
      }
    }
    return users;
  };

  const handleTextChange = (text: string) => {
    setCsvText(text);
    setParseError(null);
    setResults(null);
    if (!text.trim()) {
      setParsedUsers([]);
      return;
    }
    const parsed = parseCSV(text);
    if (parsed.length === 0) {
      setParseError('Nenhum usuário válido encontrado. Use o formato: Nome Completo,email@exemplo.com');
    }
    setParsedUsers(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      handleTextChange(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (parsedUsers.length === 0) return;
    setImporting(true);
    setResults(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/batch-create-users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            users: parsedUsers,
            sendInvite: deliveryMode === 'invite',
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const { results: importResults }: { results: ImportResult[] } = await response.json();
      setResults(importResults);

      if (importResults.some((r) => r.success)) {
        fetchStudents();
        setCsvText('');
        setParsedUsers([]);
      }
    } catch (err: any) {
      setResults([{ full_name: '', email: '', success: false, error: err.message, password: null }]);
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`Remover o estudante "${name}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(id);
    await supabase.from('profiles').delete().eq('id', id);
    await fetchStudents();
    setDeletingId(null);
  };

  const copyPassword = (pw: string, idx: number) => {
    navigator.clipboard.writeText(pw);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadTemplate = () => {
    const content = 'Nome Completo,email\nJoao Silva,joao.silva@email.com\nMaria Santos,maria.santos@email.com';
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const successCount = results?.filter((r) => r.success).length ?? 0;
  const failCount = results?.filter((r) => !r.success).length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Gerenciar Estudantes</h2>
        <p className="text-slate-400 text-sm mt-1">
          {students.length} estudante{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Import Section */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Importar em Lote</h3>
              <p className="text-xs text-slate-400">Cole a lista ou envie um arquivo CSV</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
              Modelo CSV
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-xl transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Delivery mode toggle */}
        <div className="mb-5">
          <p className="text-sm font-medium text-slate-300 mb-3">Como enviar as credenciais?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setDeliveryMode('invite'); setResults(null); }}
              className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all text-left ${
                deliveryMode === 'invite'
                  ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'bg-slate-900/30 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                deliveryMode === 'invite' ? 'bg-emerald-500/20' : 'bg-slate-700/50'
              }`}>
                <Mail className={`w-4 h-4 ${deliveryMode === 'invite' ? 'text-emerald-400' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${deliveryMode === 'invite' ? 'text-emerald-300' : 'text-slate-300'}`}>
                  Convite por email
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Supabase envia um link para o estudante definir a propria senha
                </p>
              </div>
              {deliveryMode === 'invite' && (
                <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0 mt-0.5" />
              )}
            </button>

            <button
              onClick={() => { setDeliveryMode('password'); setResults(null); }}
              className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all text-left ${
                deliveryMode === 'password'
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-900/30 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                deliveryMode === 'password' ? 'bg-amber-500/20' : 'bg-slate-700/50'
              }`}>
                <KeyRound className={`w-4 h-4 ${deliveryMode === 'password' ? 'text-amber-400' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${deliveryMode === 'password' ? 'text-amber-300' : 'text-slate-300'}`}>
                  Senha temporaria
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Gera senhas automaticas exibidas aqui para voce repassar
                </p>
              </div>
              {deliveryMode === 'password' && (
                <CheckCircle className="w-4 h-4 text-amber-400 ml-auto flex-shrink-0 mt-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Instructions toggle */}
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 mb-4 transition-colors"
        >
          <FileText className="w-4 h-4" />
          {showInstructions ? 'Ocultar' : 'Ver'} instrucoes de formato
          {showInstructions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showInstructions && (
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 mb-4 text-sm">
            <p className="text-slate-300 font-medium mb-2">Formato — uma linha por estudante:</p>
            <code className="text-emerald-400 block mb-3">Nome Completo,email@exemplo.com</code>
            <pre className="text-slate-300 text-xs leading-relaxed">
{`Joao da Silva,joao.silva@email.com
Maria Aparecida Santos,maria@hospital.org
Carlos Eduardo Lima,carlos.lima@residencia.med.br`}
            </pre>
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={csvText}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full h-36 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
          placeholder={`Nome Completo,email@exemplo.com\nJoao da Silva,joao@email.com\nMaria Santos,maria@email.com`}
        />

        {parseError && (
          <div className="flex items-center gap-2 mt-2 text-amber-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {parseError}
          </div>
        )}

        {/* Preview */}
        {parsedUsers.length > 0 && !results && (
          <div className="mt-4">
            <p className="text-sm text-slate-400 mb-2">
              <span className="text-white font-medium">{parsedUsers.length}</span> usuario{parsedUsers.length !== 1 ? 's' : ''} encontrado{parsedUsers.length !== 1 ? 's' : ''}:
            </p>
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900/80 backdrop-blur">
                  <tr>
                    <th className="text-left px-4 py-2 text-slate-400 font-medium">#</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-medium">Nome</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-medium">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedUsers.map((u, i) => (
                    <tr key={i} className="border-t border-slate-800/50">
                      <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-2 text-white">{u.full_name}</td>
                      <td className="px-4 py-2 text-slate-300">{u.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleImport}
            disabled={parsedUsers.length === 0 || importing}
            className={`flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              deliveryMode === 'invite'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20 hover:shadow-emerald-500/40'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/20 hover:shadow-amber-500/40'
            }`}
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {deliveryMode === 'invite' ? 'Enviando convites...' : 'Criando usuarios...'}
              </>
            ) : (
              <>
                {deliveryMode === 'invite' ? <Mail className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
                {deliveryMode === 'invite' ? 'Enviar Convites' : 'Criar Usuarios'}
                {parsedUsers.length > 0 && ` (${parsedUsers.length})`}
              </>
            )}
          </button>
          {(csvText || results) && (
            <button
              onClick={() => { setCsvText(''); setParsedUsers([]); setResults(null); setParseError(null); }}
              className="px-4 py-2.5 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-xl transition-colors text-sm"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold text-white">Resultado</h3>
            <div className="flex items-center gap-3 ml-auto">
              {successCount > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  {successCount} {deliveryMode === 'invite' ? 'convite' : 'conta'}{successCount !== 1 ? 's' : ''} criado{successCount !== 1 ? 's' : ''}
                </span>
              )}
              {failCount > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-red-400">
                  <XCircle className="w-4 h-4" />
                  {failCount} falha{failCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {deliveryMode === 'invite' && successCount > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4 flex items-start gap-2">
              <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-300">
                Emails de convite enviados. Cada estudante recebera um link para definir sua propria senha.
              </p>
            </div>
          )}

          {deliveryMode === 'password' && successCount > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300">
                Guarde as senhas abaixo — sao exibidas apenas uma vez e devem ser repassadas aos estudantes.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  r.success
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                {r.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{r.full_name || '—'}</p>
                  <p className="text-xs text-slate-400 truncate">{r.email || '—'}</p>
                </div>
                {r.success && r.password && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                      {r.password}
                    </span>
                    <button
                      onClick={() => copyPassword(r.password!, i)}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors"
                      title="Copiar senha"
                    >
                      {copiedIndex === i ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
                {r.success && !r.password && deliveryMode === 'invite' && (
                  <span className="text-xs text-emerald-400 ml-auto flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Convite enviado
                  </span>
                )}
                {!r.success && r.error && (
                  <span className="text-xs text-red-400 ml-auto max-w-xs text-right">{r.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students List */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
          <Users className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-white">Estudantes Cadastrados</h3>
        </div>

        {loadingStudents ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Users className="w-10 h-10 mb-3 opacity-50" />
            <p>Nenhum estudante cadastrado ainda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/30">
                <tr>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">Nome</th>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">Cadastro</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-700/20 transition-colors group">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-semibold text-xs flex-shrink-0">
                          {s.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-400">
                      {new Date(s.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleDeleteStudent(s.id, s.full_name)}
                        disabled={deletingId === s.id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 transition-all"
                        title="Remover estudante"
                      >
                        {deletingId === s.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
