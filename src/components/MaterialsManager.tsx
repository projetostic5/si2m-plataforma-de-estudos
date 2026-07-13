import { useState, useEffect, useRef } from 'react';
import { supabase, Discipline, Dimension, Theme, StudyMaterial } from '../lib/supabase';
import {
  FolderOpen,
  Upload,
  Trash2,
  FileText,
  Loader,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export function MaterialsManager({ disciplines }: { disciplines: Discipline[] }) {
  const [disciplineId, setDisciplineId] = useState('');
  const [dimensionId, setDimensionId] = useState('');
  const [themeId, setThemeId] = useState('');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (disciplineId) {
      supabase
        .from('dimensions')
        .select('*')
        .eq('discipline_id', disciplineId)
        .order('name')
        .then(({ data }) => setDimensions(data || []));
      setDimensionId('');
      setThemeId('');
      setThemes([]);
    } else {
      setDimensions([]);
      setDimensionId('');
      setThemeId('');
      setThemes([]);
    }
  }, [disciplineId]);

  useEffect(() => {
    if (dimensionId) {
      supabase
        .from('themes')
        .select('*')
        .eq('dimension_id', dimensionId)
        .order('name')
        .then(({ data }) => setThemes(data || []));
      setThemeId('');
    } else {
      setThemes([]);
      setThemeId('');
    }
  }, [dimensionId]);

  const fetchMaterials = async () => {
    const { data } = await supabase
      .from('study_materials')
      .select('*, dimension:dimensions(name), theme:themes(name)')
      .order('created_at', { ascending: false });
    setMaterials(data || []);
  };

  const handleUpload = async () => {
    if (!disciplineId || !dimensionId || !name.trim() || !file) {
      setError('Preencha todos os campos obrigatórios e selecione um arquivo.');
      return;
    }
    setError('');
    setSuccess('');
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `${disciplineId}/${dimensionId}/${themeId || 'general'}/${uniqueName}`;

      const { error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('study_materials').insert({
        discipline_id: disciplineId,
        dimension_id: dimensionId,
        theme_id: themeId || null,
        name: name.trim(),
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      });
      if (insertError) throw insertError;

      setName('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setSuccess('Material publicado com sucesso!');
      setTimeout(() => setSuccess(''), 4000);
      fetchMaterials();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao fazer upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (material: StudyMaterial) => {
    if (!window.confirm(`Excluir "${material.name}"?`)) return;
    await supabase.storage.from('study-materials').remove([material.file_path]);
    await supabase.from('study_materials').delete().eq('id', material.id);
    fetchMaterials();
  };

  const formatSize = (bytes: number | null | undefined) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Group by discipline/dimension for the list view
  type GroupedMaterials = Record<string, { disciplineName: string; dimensionName: string; items: StudyMaterial[] }>;
  const grouped = materials.reduce<GroupedMaterials>((acc, m) => {
    const disc = disciplines.find(d => d.id === m.discipline_id);
    const key = `${m.discipline_id}__${m.dimension_id}`;
    if (!acc[key]) {
      acc[key] = {
        disciplineName: disc?.name || 'Disciplina',
        dimensionName: (m.dimension as { name: string } | undefined)?.name || 'Tópico',
        items: [],
      };
    }
    acc[key].items.push(m);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Materiais de Apoio</h2>
      </div>

      {/* Upload form */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-5">Publicar Novo Material</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Disciplina *
            </label>
            <select
              value={disciplineId}
              onChange={e => setDisciplineId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              <option value="">Selecione...</option>
              {disciplines.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Tópico *
            </label>
            <select
              value={dimensionId}
              onChange={e => setDimensionId(e.target.value)}
              disabled={!disciplineId}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">Selecione...</option>
              {dimensions.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Subtópico
            </label>
            <select
              value={themeId}
              onChange={e => setThemeId(e.target.value)}
              disabled={!dimensionId}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">Geral do tópico</option>
              {themes.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Nome do material *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Resumo de Sepse"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Arquivo *
            </label>
            <input
              ref={fileRef}
              type="file"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-500/20 file:text-emerald-400 file:text-sm file:font-medium hover:file:bg-emerald-500/30 cursor-pointer"
            />
            {file && (
              <p className="text-xs text-slate-500 mt-1.5">
                {file.name} · {formatSize(file.size)}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20"
        >
          {uploading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? 'Publicando...' : 'Publicar Material'}
        </button>
      </div>

      {/* Materials list */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Materiais Publicados
          {materials.length > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-400">({materials.length})</span>
          )}
        </h3>

        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-slate-800/30 border border-slate-700/40 rounded-2xl">
            <FolderOpen className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">Nenhum material publicado ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([key, group]) => (
              <div
                key={key}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden"
              >
                <div className="flex items-center gap-2 px-5 py-3 bg-slate-900/40 border-b border-slate-700/40">
                  <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">
                    {group.disciplineName}
                  </span>
                  <span className="text-slate-600">/</span>
                  <span className="text-sm text-slate-300">{group.dimensionName}</span>
                </div>
                <div className="divide-y divide-slate-700/30">
                  {group.items.map(m => (
                    <div key={m.id} className="flex items-center gap-4 px-5 py-3">
                      <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{m.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {m.file_name}
                          {m.file_size ? ` · ${formatSize(m.file_size)}` : ''}
                          {(m.theme as { name: string } | null)?.name
                            ? ` · ${(m.theme as { name: string }).name}`
                            : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(m)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                        title="Excluir material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
