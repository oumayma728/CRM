import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, RefreshCw, Search, Users } from 'lucide-react';
import { sourceFileService } from '../../../services/sourceFileService';
import type { TreeFileDto } from '../../../types/sourceFiles';

interface RecycledFile extends TreeFileDto {
  countryName: string;
  countryCode: string;
  leadTypeName: string;
  supplierName: string;
}

function isRecycleStatus(status: string) {
  const normalized = status.toLowerCase();
  return normalized === 'recycle' || normalized === 'recycled' || normalized.includes('recycl');
}

export function RecycleTab() {
  const [files, setFiles] = useState<RecycledFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const tree = await sourceFileService.getTree();
      const recycledFiles = tree.flatMap((country) =>
        country.leadTypes.flatMap((leadType) =>
          leadType.suppliers.flatMap((supplier) =>
            supplier.sourceFiles
              .filter((file) => isRecycleStatus(file.statut))
              .map((file) => ({
                ...file,
                countryName: country.name,
                countryCode: country.code,
                leadTypeName: leadType.name || leadType.code,
                supplierName: supplier.name,
              })),
          ),
        ),
      );

      setFiles(recycledFiles);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Impossible de charger les listes recyclees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFiles();
  }, []);

  const filteredFiles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return files;

    return files.filter((file) =>
      [file.name, file.supplierName, file.countryName, file.leadTypeName]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [files, search]);

  const handleDownload = async (file: RecycledFile) => {
    setDownloadingId(file.id);
    try {
      await sourceFileService.downloadFileAs(file.id, `${file.name}.${file.format || 'csv'}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du telechargement');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Chargement des listes recyclees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="glass-card mb-6 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Recyclage</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Listes generees depuis les contacts qualifies des campagnes.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
                <FileText className="h-3.5 w-3.5" />
                {filteredFiles.length} listes
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Users className="h-3.5 w-3.5" />
                {filteredFiles.reduce((sum, file) => sum + file.contactCount, 0).toLocaleString('fr-FR')} contacts
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une liste recyclee..."
                className="glass-input w-full rounded-lg py-2.5 pl-10 pr-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => void loadFiles()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

        {filteredFiles.length === 0 ? (
          <div className="glass-card border-2 border-dashed p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/70" />
            <h3 className="mt-4 text-lg font-medium text-foreground">Aucune liste recyclee</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Recyclez une liste depuis l'onglet Injections pour la retrouver ici.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredFiles.map((file) => (
              <article key={file.id} className="glass-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-foreground">{file.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{file.supplierName}</p>
                  </div>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success ring-1 ring-success/40">
                    Recycle
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Contacts</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{file.contactCount.toLocaleString('fr-FR')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pays</p>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">{file.countryCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">{file.leadTypeName}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    {new Date(file.uploadedAt).toLocaleDateString('fr-FR')}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDownload(file)}
                    disabled={downloadingId === file.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {downloadingId === file.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Exporter
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
