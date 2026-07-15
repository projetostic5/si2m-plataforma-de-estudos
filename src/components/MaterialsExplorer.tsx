import { useState, useEffect } from 'react';
import { supabase, Discipline, Dimension, Theme, StudyMaterial } from '../lib/supabase';
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  Download,
  Loader,
  Home,
} from 'lucide-react';

type NavLevel = 'root' | 'discipline' | 'dimension' | 'theme';

export function MaterialsExplorer() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [level, setLevel] = useState<NavLevel>('root');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [discData, dimData, themeData, matData] = await Promise.all([
      supabase.from('disciplines').select('*').order('name'),
      supabase.from('dimensions').select('*').order('name'),
      supabase.from('themes').select('*').order('name'),
      supabase.from('study_materials').select('*').order('name'),
    ]);
    setDisciplines(discData.data || []);
    setDimensions(dimData.data || []);
    setThemes(themeData.data || []);
    setMaterials(matData.data || []);
    setLoading(false);
  };

  const handleDownload = async (material: StudyMaterial) => {
    setDownloading(material.id);
    try {
      const { data, error } = await supabase.storage
        .from('study-materials')
        .createSignedUrl(material.file_path, 60);
      if (error || !data?.signedUrl) throw error;
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = material.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(null);
    }
  };

  const goToRoot = () => {
    setLevel('root');
    setSelectedDiscipline(null);
    setSelectedDimension(null);
    setSelectedTheme(null);
  };

  const goToDiscipline = (disc: Discipline) => {
    setSelectedDiscipline(disc);
    setSelectedDimension(null);
    setSelectedTheme(null);
    setLevel('discipline');
  };

  const goToDimension = (dim: Dimension) => {
    setSelectedDimension(dim);
    setSelectedTheme(null);
    setLevel('dimension');
  };

  const goToTheme = (theme: Theme) => {
    setSelectedTheme(theme);
    setLevel('theme');
  };

  const formatSize = (bytes: number | null | undefined) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Show full hierarchy — all folders are visible even when empty
  const disciplinesWithMaterials = disciplines;

  const currentDimensions = selectedDiscipline
    ? dimensions.filter(dim => dim.discipline_id === selectedDiscipline.id)
    : [];

  const currentThemes = selectedDimension
    ? themes.filter(t => t.dimension_id === selectedDimension.id)
    : [];

  const dimensionGeneralMaterials = selectedDimension
    ? materials.filter(m => m.dimension_id === selectedDimension.id && !m.theme_id)
    : [];

  const themeMaterials = selectedTheme
    ? materials.filter(m => m.theme_id === selectedTheme.id)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Materiais de Apoio <span className="text-base font-normal text-slate-400">(Em Construção)</span></h2>
          <p className="text-sm text-slate-400">Navegue e baixe os materiais de estudo</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 mb-6 text-sm flex-wrap">
        <button
          onClick={goToRoot}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Início</span>
        </button>
        {selectedDiscipline && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <button
              onClick={() => {
                setLevel('discipline');
                setSelectedDimension(null);
                setSelectedTheme(null);
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                level === 'discipline'
                  ? 'text-white font-medium'
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5'
              }`}
            >
              {selectedDiscipline.name}
            </button>
          </>
        )}
        {selectedDimension && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <button
              onClick={() => {
                setLevel('dimension');
                setSelectedTheme(null);
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                level === 'dimension'
                  ? 'text-white font-medium'
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5'
              }`}
            >
              {selectedDimension.name}
            </button>
          </>
        )}
        {selectedTheme && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-2.5 py-1 text-white font-medium">{selectedTheme.name}</span>
          </>
        )}
      </nav>

      {/* Explorer panel */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        {/* Column header */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-700/50 bg-slate-900/40">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {level === 'root' && 'Disciplinas'}
            {level === 'discipline' && 'Tópicos'}
            {level === 'dimension' && 'Subtópicos e Arquivos'}
            {level === 'theme' && 'Arquivos'}
          </span>
        </div>

        {/* Root: disciplines */}
        {level === 'root' && (
          <>
            {disciplinesWithMaterials.length === 0 ? (
              <EmptyState icon={FolderOpen} message="Nenhuma disciplina cadastrada ainda." />
            ) : (
              <div className="divide-y divide-slate-700/30">
                {disciplinesWithMaterials.map(disc => {
                  const count = materials.filter(m => m.discipline_id === disc.id).length;
                  return (
                    <button
                      key={disc.id}
                      onClick={() => goToDiscipline(disc)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-700/30 transition-colors text-left group"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: disc.color + '20',
                          border: `1.5px solid ${disc.color}50`,
                        }}
                      >
                        <Folder className="w-4 h-4" style={{ color: disc.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium group-hover:text-emerald-300 transition-colors">
                          {disc.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {count > 0
                            ? `${count} arquivo${count !== 1 ? 's' : ''}`
                            : 'Pasta vazia'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Discipline level: dimensions */}
        {level === 'discipline' && (
          <>
            {currentDimensions.length === 0 ? (
              <EmptyState icon={Folder} message="Nenhum tópico cadastrado para esta disciplina." />
            ) : (
              <div className="divide-y divide-slate-700/30">
                {currentDimensions.map(dim => {
                  const count = materials.filter(m => m.dimension_id === dim.id).length;
                  return (
                    <button
                      key={dim.id}
                      onClick={() => goToDimension(dim)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-700/30 transition-colors text-left group"
                    >
                      <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Folder className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium group-hover:text-emerald-300 transition-colors">
                          {dim.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {count > 0
                            ? `${count} arquivo${count !== 1 ? 's' : ''}`
                            : 'Pasta vazia'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Dimension level: theme folders + general files */}
        {level === 'dimension' && (
          <>
            {currentThemes.length === 0 && dimensionGeneralMaterials.length === 0 ? (
              <EmptyState icon={FileText} message="Nenhum subtópico ou arquivo neste tópico." />
            ) : (
              <div className="divide-y divide-slate-700/30">
                {currentThemes.map(theme => {
                  const count = materials.filter(m => m.theme_id === theme.id).length;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => goToTheme(theme)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-700/30 transition-colors text-left group"
                    >
                      <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Folder className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium group-hover:text-emerald-300 transition-colors">
                          {theme.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {count > 0
                            ? `${count} arquivo${count !== 1 ? 's' : ''}`
                            : 'Pasta vazia'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </button>
                  );
                })}
                {dimensionGeneralMaterials.map(m => (
                  <MaterialRow
                    key={m.id}
                    material={m}
                    onDownload={handleDownload}
                    downloading={downloading}
                    formatSize={formatSize}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Theme level: files */}
        {level === 'theme' && (
          <>
            {themeMaterials.length === 0 ? (
              <EmptyState icon={FileText} message="Nenhum arquivo encontrado." />
            ) : (
              <div className="divide-y divide-slate-700/30">
                {themeMaterials.map(m => (
                  <MaterialRow
                    key={m.id}
                    material={m}
                    onDownload={handleDownload}
                    downloading={downloading}
                    formatSize={formatSize}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MaterialRow({
  material,
  onDownload,
  downloading,
  formatSize,
}: {
  material: StudyMaterial;
  onDownload: (m: StudyMaterial) => void;
  downloading: string | null;
  formatSize: (b: number | null | undefined) => string;
}) {
  const isDownloading = downloading === material.id;
  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-slate-700/20 transition-colors">
      <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{material.name}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {material.file_name}
          {material.file_size ? ` · ${formatSize(material.file_size)}` : ''}
        </p>
      </div>
      <button
        onClick={() => onDownload(material)}
        disabled={isDownloading}
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50 flex-shrink-0"
      >
        {isDownloading ? (
          <Loader className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        Baixar
      </button>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <Icon className="w-12 h-12 mb-3 opacity-20" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
