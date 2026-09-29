// components/TabSource.tsx
import { useState, useMemo } from 'react';
import { useLeads } from '../../../hooks/useSourceTree';
import { FileUploader } from '../../../components/crm/FileUploader';
import { sourceFileService } from '../../../services/sourceFileService';
import FileSearch from '../../../components/crm/FileSearch';
import type { TreeCountryDto, TreeLeadTypeDto, TreeFileDto, TreeSupplierDto } from '../../../types/sourceFiles';
import { CampaignInjectionModal } from '../../../components/crm/CampaignInjectionModal';
import { 
  ChevronRight, 
  ChevronDown, 
  Upload, 
  FileText, X,
  HardDrive, 
  Users, 
  RefreshCw,
  Edit2, Trash2,
  PlayCircle, Download, Search
} from 'lucide-react';
import { PERMISSIONS } from '../../../types/permissions';
import PermissionGuard from '../../../components/crm/PermissionGuard';
import { supplierService } from '../../../services/supplierService';

const FILES_PER_PAGE = 10;

// ==================== FILE ROW COMPONENT ====================
function FileRow({ file, onRename, onInject, onDelete, onDownload }: { 
  file: TreeFileDto; 
  onRename: (id: number, newName: string) => Promise<void>; 
  onInject: (id: number, fileName?: string) => void;
  onDelete: (id: number) => void;
  onDownload: (id: number, fileName: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(file.name);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);    
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRename = async () => {
    if (editName.trim() && editName !== file.name) {
      setIsRenaming(true);
      try {
        await onRename(file.id, editName.trim());
      } finally {
        setIsRenaming(false);
      }
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Supprimer "${file.name}" ?`)) {
      setIsDeleting(true);
      try {
        await onDelete(file.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const ext = file.format || 'csv';
      await onDownload(file.id, `${file.name}.${ext}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
    original: { color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Original' },
    injecté: { color: 'text-primary', bgColor: 'bg-primary/10', label: 'Injecté' },
    traité: { color: 'text-success', bgColor: 'bg-success/10', label: 'Traité' },
    recyclé: { color: 'text-primary', bgColor: 'bg-primary/10', label: 'Recyclé' },
  };

  const status = statusConfig[file.statut] || { color: 'text-muted-foreground', bgColor: 'bg-muted', label: file.statut };
  
  return (
    <div className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
      <div className="grid grid-cols-12 gap-3 px-4 py-3">
 
        {/* File name + date */}
        <div className="col-span-12 md:col-span-5">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    className="glass-input flex-1 rounded px-2 py-1 text-sm focus:border-primary focus:outline-none"
                    autoFocus
                    disabled={isRenaming}
                  />
                  <PermissionGuard permission={PERMISSIONS.Files.Rename}>
                    <button
                      onClick={handleRename}
                      disabled={isRenaming}
                      className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isRenaming ? '...' : 'OK'}
                    </button>
                  </PermissionGuard>
                  <button
                    onClick={() => { setIsEditing(false); setEditName(file.name); }}
                    className="rounded border px-2 py-1 text-xs hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(file.uploadedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
 
        {/* Contact count */}
        <div className="col-span-3 md:col-span-2">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{file.contactCount.toLocaleString()}</span>
          </div>
        </div>
 
        {/* File size */}
        <div className="col-span-3 md:col-span-2">
          <div className="flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{file.fileSizeLabel}</span>
          </div>
        </div>
 
        {/* Status badge */}
        <div className="col-span-3 md:col-span-1">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.bgColor} ${status.color}`}>
            {status.label}
          </span>
        </div>
 
        {/* Actions */}
        <div className="col-span-12 md:col-span-2">
          <div className="flex flex-wrap gap-1.5">
            {/* Rename */}
            <button
              onClick={() => setIsEditing(true)}
              title="Renommer"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-border hover:bg-muted"
            >
              <Edit2 className="h-3 w-3" />
              <span className="hidden sm:inline">Renommer</span>
            </button>
 
            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              title="Supprimer"
              className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-card px-2.5 py-1.5 text-xs font-medium text-destructive transition-all hover:border-destructive/30 hover:bg-destructive/10 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              <span className="hidden sm:inline">{isDeleting ? '...' : 'Supprimer'}</span>
            </button>
 
            {/* Inject */}
            <button
              onClick={() => onInject(file.id, file.name)}
              title="Injecter"
              className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-success to-success px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:from-success hover:to-success"
            >
              <PlayCircle className="h-3 w-3" />
              <span className="hidden sm:inline">Injecter</span>
            </button>
 
            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              title="Télécharger"
              className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-primary to-primary px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:from-primary hover:to-primary disabled:opacity-50"
            >
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">{isDownloading ? '...' : 'Télécharger'}</span>
            </button>
          </div>
        </div>
 
      </div>
    </div>
  );
}

// ==================== SUPPLIER BLOCK COMPONENT ====================
function SupplierBlock({ supplier, onRename, onInject, onDelete, onRenameSupplier, onDeleteSupplier, onDownload }: {
  supplier: TreeSupplierDto;
  onRename: (id: number, newName: string) => Promise<void>;
  onInject: (id: number, fileName?: string) => void;
  onDelete: (id: number) => void;
  onRenameSupplier: (id: number, newName: string) => Promise<void>;
  onDeleteSupplier: (id: number) => void;
  onDownload: (id: number, fileName: string) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(supplier.name);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  const filteredFiles = useMemo(
    () => supplier.sourceFiles.filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase())
    ),
    [supplier.sourceFiles, search]
  );
  
  const visibleFiles = filteredFiles.slice(0, page * FILES_PER_PAGE);
  const hasMore = filteredFiles.length > visibleFiles.length;
  const remaining = filteredFiles.length - visibleFiles.length;
  const totalContacts = supplier.sourceFiles.reduce((sum, file) => sum + file.contactCount, 0);

  const handleRenameSubmit = async () => {
    if (editName.trim() && editName !== supplier.name) {
      await onRenameSupplier(supplier.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleDeleteSupplierClick = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${supplier.name}" et tous ses fichiers ?`)) {
      await onDeleteSupplier(supplier.id);
    }
  };
  
  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Supplier header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => setIsOpen(o => !o)}
          className="flex-shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
          aria-label={isOpen ? 'Réduire' : 'Développer'}
        >
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
 
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                className="glass-input rounded px-2 py-1 text-sm focus:border-primary focus:outline-none"
                autoFocus
              />
              <button onClick={handleRenameSubmit} className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">OK</button>
              <button onClick={() => { setIsEditing(false); setEditName(supplier.name); }} className="rounded border px-2 py-1 text-xs hover:bg-muted">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <span className="font-medium text-foreground">{supplier.name}</span>
          )}
 
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              {supplier.sourceFiles.length} fichier{supplier.sourceFiles.length > 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              <Users className="h-3 w-3" />
              {totalContacts.toLocaleString()}
            </span>
          </div>
        </div>
 
        <div className="flex items-center gap-1">
          <button onClick={() => setIsEditing(true)} title="Renommer le fournisseur" className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-primary">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleDeleteSupplierClick} title="Supprimer le fournisseur" className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
 
      {isOpen && (
        <div className="border-t border-border">
          {supplier.sourceFiles.length > 5 && (
            <div className="border-b border-border px-4 py-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher un fichier..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="glass-input w-full rounded-md py-1.5 pl-8 pr-3 text-sm focus:border-primary focus:outline-none"
                />
                {search && (
                  <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
 
          <div className="hidden border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-12 md:gap-3">
            <div className="col-span-5">Fichier</div>
            <div className="col-span-2">Contacts</div>
            <div className="col-span-2">Taille</div>
            <div className="col-span-1">Statut</div>
            <div className="col-span-2">Actions</div>
          </div>
 
          {filteredFiles.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {search ? `Aucun fichier correspondant à "${search}"` : 'Aucun fichier'}
            </div>
          ) : (
            <>
              {visibleFiles.map(file => (
                <FileRow
                  key={file.id}
                  file={file}
                  onRename={onRename}
                  onInject={onInject}
                  onDelete={onDelete}
                  onDownload={onDownload}
                />
              ))}
 
              {hasMore && (
                <div className="border-t border-border px-4 py-3 text-center">
                  <button onClick={() => setPage(p => p + 1)} className="text-xs font-medium text-primary hover:text-primary">
                    Afficher {Math.min(remaining, FILES_PER_PAGE)} de plus
                    <span className="ml-1 text-muted-foreground">({remaining} restants)</span>
                  </button>
                </div>
              )}
 
              <div className="border-t border-border px-4 py-2 text-right">
                <span className="text-xs text-muted-foreground">
                  {search
                    ? `${filteredFiles.length} résultat${filteredFiles.length > 1 ? 's' : ''} sur ${supplier.sourceFiles.length}`
                    : `${visibleFiles.length} / ${supplier.sourceFiles.length} fichiers`}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== LEAD TYPE BLOCK COMPONENT ====================
function LeadTypeBlock({ leadType, onRename, onInject, onDelete, onRenameSupplier, onDeleteSupplier, onDownload }: {
  leadType: TreeLeadTypeDto;
  onRename: (id: number, newName: string) => Promise<void>;
  onInject: (id: number, fileName?: string) => void;
  onDelete: (id: number) => void;
  onRenameSupplier: (id: number, newName: string) => Promise<void>;
  onDeleteSupplier: (id: number) => void;
  onDownload: (id: number, fileName: string) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(true);
  if (leadType.suppliers.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/10 px-4 py-3 transition-all hover:from-primary/10 hover:to-primary/10"
      >
        <span className="text-primary">
          {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </span>
        <span className="font-semibold text-primary">{leadType.code}</span>
        <span className="rounded-full bg-white/50 px-2 py-0.5 text-xs text-primary backdrop-blur-sm">
          {leadType.suppliers.length} fournisseur(s)
        </span>
      </button>

      {isOpen && (
        <div className="ml-4 mt-2 space-y-2">
          {leadType.suppliers.map(supplier => (
            <SupplierBlock
              key={supplier.id}
              supplier={supplier}
              onRename={onRename}
              onInject={onInject}
              onDelete={onDelete}
              onRenameSupplier={onRenameSupplier}
              onDeleteSupplier={onDeleteSupplier}
              onDownload={onDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== COUNTRY BLOCK COMPONENT ====================
function CountryBlock({ country, onRename, onInject, onDelete, onRenameSupplier, onDeleteSupplier, onDownload, defaultOpen=false }: {
  country: TreeCountryDto;
  defaultOpen?: boolean;
  onRename: (id: number, newName: string) => Promise<void>;
  onInject: (id: number, fileName?: string) => void;
  onDelete: (id: number) => void;
  onRenameSupplier: (id: number, newName: string) => Promise<void>;
  onDeleteSupplier: (id: number) => void;
  onDownload: (id: number, fileName: string) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  if (country.leadTypes.length === 0) return null;
  
  const totalFiles = country.leadTypes.reduce((sum, lt) => 
    sum + lt.suppliers.reduce((s, sup) => s + sup.sourceFiles.length, 0), 0);
  
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex w-full items-center justify-between bg-gradient-to-r from-muted to-white px-6 py-4 transition-all hover:bg-muted"
      >
        <div className="flex items-center gap-3">
          <div className="text-left">
            <h3 className="text-lg font-semibold text-foreground">{country.code}</h3>
            <p className="text-xs text-muted-foreground">{country.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:inline-flex">
            <FileText className="h-3 w-3" />
            {totalFiles} fichiers
          </span>
          <div className="rounded-full bg-muted p-1">
            {isOpen ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
          </div>
        </div>
      </button>
 
      {isOpen && (
        <div className="border-t border-border bg-muted/30 p-6">
          {country.leadTypes.map(leadType => (
            <LeadTypeBlock
              key={leadType.id}
              leadType={leadType}
              onRename={onRename}
              onInject={onInject}
              onDelete={onDelete}
              onRenameSupplier={onRenameSupplier}
              onDeleteSupplier={onDeleteSupplier}
              onDownload={onDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== MAIN TAB SOURCE COMPONENT ====================
export function TabSource() {
  const { tree, loading, error, refresh } = useLeads();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  
  // ✅ State for injection modal
  const [showInjectionModal, setShowInjectionModal] = useState(false);
  const [selectedFileForInject, setSelectedFileForInject] = useState<{id: number, name: string} | null>(null);

  const sourceStats = useMemo(() => {
    return tree.reduce(
      (acc, country) => {
        acc.countries += 1;
        country.leadTypes.forEach((leadType) => {
          leadType.suppliers.forEach((supplier) => {
            acc.suppliers += 1;
            supplier.sourceFiles.forEach((file) => {
              acc.files += 1;
              acc.contacts += file.contactCount;
            });
          });
        });
        return acc;
      },
      { countries: 0, suppliers: 0, files: 0, contacts: 0 },
    );
  }, [tree]);

  const handleRename = async (id: number, newName: string) => {
    try {
      await sourceFileService.renameFile(id, newName);
      await refresh();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors du renommage';
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await sourceFileService.deleteFile(id);
      await refresh();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de la suppression';
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleInject = (id: number, fileName?: string) => {
    console.log('Injecter fichier', id, fileName);
    setSelectedFileForInject({ id, name: fileName || `File ${id}` });
    setShowInjectionModal(true);
  };

  const handleRenameSupplier = async (id: number, newName: string) => {
    try {
      await supplierService.updateSupplier(id, newName);
      await refresh();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors du renommage du fournisseur';
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleDownload = async (id: number, fileName: string) => {
    try {
      await sourceFileService.downloadFileAs(id, fileName);
    } catch (error: any) {
      console.error('Download failed:', error);
      const msg = error?.response?.data?.message || 'Erreur lors du téléchargement du fichier';
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
      if (error.response?.status === 404) {
        alert('Fichier non trouvé sur le serveur');
      } else if (error.response?.status === 403) {
        alert('Vous n\'avez pas la permission de télécharger ce fichier');
      } else {
        alert('Erreur lors du téléchargement du fichier');
      }
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    try {
      await supplierService.deleteSupplier(id);
      await refresh();
    } catch (err: any) {
      const msg = err?.response?.status === 403
        ? "Vous n'avez pas la permission de supprimer ce fournisseur"
        : err?.response?.data?.message || 'Erreur lors de la suppression du fournisseur';
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Chargement des sources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 rounded-xl border border-destructive/30 bg-destructive/10 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15">
            <svg className="h-5 w-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-destructive">Erreur</h3>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-muted">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="glass-card mb-8 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Sources de leads</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Gérez vos fichiers sources organisés par pays, type de lead et fournisseur
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  <FileText className="h-3.5 w-3.5" />
                  {sourceStats.files.toLocaleString('fr-FR')} fichiers
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
                  <Users className="h-3.5 w-3.5" />
                  {sourceStats.contacts.toLocaleString('fr-FR')} contacts
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
                  {sourceStats.countries.toLocaleString('fr-FR')} pays
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
                  {sourceStats.suppliers.toLocaleString('fr-FR')} fournisseurs
                </span>
              </div>
            </div>
            <div className='flex gap-3'>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`inline-flex items-center justify-center rounded-xl p-2.5 transition-all ${
                  showSearch
                    ? 'bg-gradient-to-r from-muted to-muted text-white shadow-lg hover:from-muted hover:to-muted' 
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                }`}
                title={showSearch ? "Fermer la recherche" : "Rechercher un fichier"}
              >
                <Search className="h-5 w-5" />
              </button>
              {!showSearch && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:from-primary hover:to-primary hover:shadow-xl"
                >
                  <Upload className="h-4 w-4" />
                  Ajouter une source
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="mb-8">
            <FileUploader
              onClose={() => {
                setShowUploadModal(false);
                refresh();
              }}
              onUploadSuccess={() => {
                setShowUploadModal(false);
                refresh();
              }}
            />
          </div>
        )}
        
        {/* Action Error Message */}
        {actionError && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {actionError}
          </div>
        )}
        
        {/* Conditional Rendering: Search View OR Tree View */}
        {showSearch ? (
          <FileSearch />
        ) : (
          <>
            {tree.length === 0 ? (
              <div className="glass-card border-2 border-dashed p-12 text-center transition-all hover:border-border">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-9 w-9 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-foreground">Aucun fichier source</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Commencez par ajouter votre premier fichier source
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Upload className="h-4 w-4" />
                  Ajouter un fichier
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tree.map((country, index) => (
                  <CountryBlock
                    key={country.id}
                    country={country}
                    onRename={handleRename}
                    onInject={handleInject}
                    defaultOpen={index === 0}
                    onDelete={handleDelete}
                    onRenameSupplier={handleRenameSupplier}
                    onDeleteSupplier={handleDeleteSupplier}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ✅ INJECTION MODAL - Placed here, outside the conditional rendering */}
        {showInjectionModal && selectedFileForInject && (
          <CampaignInjectionModal
            fileId={selectedFileForInject.id}
            fileName={selectedFileForInject.name}
            onClose={() => {
              setShowInjectionModal(false);
              setSelectedFileForInject(null);
            }}
            onSuccess={() => {
              refresh(); // Refresh the tree to show updated file status
              setShowInjectionModal(false);
              setSelectedFileForInject(null);
            }}
          />
        )}

      </div>
    </div>
  );
}
