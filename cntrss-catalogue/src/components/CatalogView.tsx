import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DocumentItem, DisciplineType, DocumentType, StudyDesign } from '../types';
import { DISCIPLINES, STUDY_DESIGNS, HEALTH_ZONES } from '../data/mockDocuments';
import {
  Search,
  Filter,
  Eye,
  Bookmark,
  User,
  Building2,
  MapPin,
  Database,
  RotateCcw,
  LayoutGrid,
  List
} from 'lucide-react';
import { checkBackend, fetchJson, CatalogApiResponse } from '../lib/backendApi';

interface CatalogViewProps {
  documents: DocumentItem[];
  selectedDiscipline?: string | null;
  onSelectDocument: (doc: DocumentItem) => void;
  bookmarks: string[];
  onToggleBookmark: (docId: string) => void;
  initialQuery?: string;
  onRequestDocument: () => void;
}

type CatalogState =
  | { mode: 'local'; items: DocumentItem[]; total: number; pages: number; page: number }
  | { mode: 'remote'; response: CatalogApiResponse }
  | { mode: 'error'; message: string };

export const CatalogView: React.FC<CatalogViewProps> = ({
  documents,
  selectedDiscipline = null,
  onSelectDocument,
  bookmarks,
  onToggleBookmark,
  initialQuery = '',
  onRequestDocument
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [disciplineFilter, setDisciplineFilter] = useState<string>(selectedDiscipline || 'all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [studyDesignFilter, setStudyDesignFilter] = useState<string>('all');
  const [healthZoneFilter, setHealthZoneFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [onlyOpenData, setOnlyOpenData] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'recent' | 'views' | 'downloads' | 'citations'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [catalogState, setCatalogState] = useState<CatalogState>({
    mode: 'local',
    items: documents,
    total: documents.length,
    pages: 1,
    page: 1
  });

  const loadCatalog = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(catalogState.mode === 'remote' ? catalogState.response.page : 1));
      params.set('limit', '24');
      if (disciplineFilter !== 'all') params.set('discipline', disciplineFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (studyDesignFilter !== 'all') params.set('studyDesign', studyDesignFilter);
      if (healthZoneFilter !== 'all') params.set('healthZone', healthZoneFilter);
      if (yearFilter !== 'all') params.set('year', yearFilter);
      if (onlyOpenData) params.set('status', 'Validé & Publié');
      if (searchQuery.trim()) params.set('query', searchQuery.trim());

      const response = await fetchJson<CatalogApiResponse>(`/api/catalog?${params.toString()}`);
      setCatalogState({ mode: 'remote', response });
    } catch (err) {
      setCatalogState({ mode: 'error', message: err instanceof Error ? err.message : 'Impossible de charger le catalogue' });
    }
  }, [
    disciplineFilter,
    typeFilter,
    studyDesignFilter,
    healthZoneFilter,
    yearFilter,
    onlyOpenData,
    searchQuery,
    catalogState
  ]);

  useEffect(() => {
    checkBackend().then((available) => {
      setBackendAvailable(available);
      if (available) {
        loadCatalog();
      } else {
        setCatalogState({ mode: 'local', items: documents, total: documents.length, pages: 1, page: 1 });
      }
    });
  }, []);

  useEffect(() => {
    if (backendAvailable === true) {
      loadCatalog();
    }
  }, [
    backendAvailable,
    disciplineFilter,
    typeFilter,
    studyDesignFilter,
    healthZoneFilter,
    yearFilter,
    onlyOpenData,
    searchQuery,
    loadCatalog
  ]);

  useEffect(() => {
    if (backendAvailable !== true) {
      setSearchQuery(initialQuery);
      setDisciplineFilter(selectedDiscipline || 'all');
    }
  }, [backendAvailable, initialQuery, selectedDiscipline]);

  const remoteResponse = catalogState.mode === 'remote' ? catalogState.response : null;

  // Compteurs réels par filière : serveur en mode distant, catalogue affiché sinon.
  const disciplineCounts = useMemo<Record<string, number>>(() => {
    if (catalogState.mode === 'remote') {
      return catalogState.response.disciplineCounts || {};
    }
    return documents.reduce<Record<string, number>>((acc, doc) => {
      acc[doc.discipline] = (acc[doc.discipline] || 0) + 1;
      return acc;
    }, {});
  }, [catalogState, documents]);

  const displayDocs = useMemo(() => {
    const source =
      catalogState.mode === 'remote'
        ? catalogState.response.items
        : catalogState.mode === 'error'
          ? documents
          : catalogState.items;
    return [...source].sort((a, b) => {
      if (sortBy === 'recent') {
        return b.year - a.year || (b.dateAdded || '').localeCompare(a.dateAdded || '');
      }
      if (sortBy === 'views') {
        return (b.views || 0) - (a.views || 0);
      }
      if (sortBy === 'downloads') {
        return (b.downloads || 0) - (a.downloads || 0);
      }
      if (sortBy === 'citations') {
        return (b.citationsCount || 0) - (a.citationsCount || 0);
      }
      return 0;
    });
  }, [catalogState, sortBy, documents]);

  const displayTotal =
    catalogState.mode === 'remote'
      ? remoteResponse?.total ?? documents.length
      : documents.length;

  const activeFacetCount =
    disciplineFilter !== 'all' ||
    typeFilter !== 'all' ||
    studyDesignFilter !== 'all' ||
    healthZoneFilter !== 'all' ||
    yearFilter !== 'all' ||
    onlyOpenData ||
    searchQuery.trim() !== '';

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setDisciplineFilter('all');
    setTypeFilter('all');
    setStudyDesignFilter('all');
    setHealthZoneFilter('all');
    setYearFilter('all');
    setOnlyOpenData(false);
    setSortBy('recent');
  }, []);

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Main search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              placeholder="Rechercher par titre, pathologie, auteur, DOI ou descripteur MeSH (ex: paludisme, Parakou, 10.cntrss)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Sort & layout modes */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="recent">Plus récents d'abord</option>
              <option value="citations">Plus cités au Bénin</option>
              <option value="views">Les plus consultés</option>
              <option value="downloads">Les plus téléchargés</option>
            </select>

            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Affichage grille"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Affichage liste"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Multifaceted filters row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1 text-slate-500 mr-2 font-bold">
            <Filter className="w-3.5 h-3.5" /> Filtres experts :
          </div>

          {/* Filière */}
          <select
            value={disciplineFilter}
            onChange={(e) => {
              setDisciplineFilter(e.target.value);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">Toutes les filières</option>
            {DISCIPLINES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title} ({disciplineCounts[d.id] ?? 0})
              </option>
            ))}
          </select>

          {/* Devis Méthodologique */}
          <select
            value={studyDesignFilter}
            onChange={(e) => {
              setStudyDesignFilter(e.target.value);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">Tous les devis d'étude</option>
            {STUDY_DESIGNS.map((design) => (
              <option key={design} value={design}>
                {design}
              </option>
            ))}
          </select>

          {/* Zone / Centre de santé */}
          <select
            value={healthZoneFilter}
            onChange={(e) => {
              setHealthZoneFilter(e.target.value);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">Toutes les zones sanitaires</option>
            {HEALTH_ZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>

          {/* Type */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">Tous les types de travaux</option>
            <option value="Mémoire de licence">Mémoire de licence</option>
            <option value="Rapport de stage">Rapport de stage</option>
            <option value="Thèse">Thèse de doctorat</option>
            <option value="Mémoire de master">Mémoire de master</option>
            <option value="Article scientifique">Article scientifique</option>
          </select>

          {/* Open Data Toggle */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer text-slate-700 dark:text-slate-300 select-none hover:bg-slate-100">
            <input
              type="checkbox"
              checked={onlyOpenData}
              onChange={(e) => {
                setOnlyOpenData(e.target.checked);
              }}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <Database className="w-3 h-3 text-teal-600" /> Données ouvertes (Open Data)
            </span>
          </label>

          {activeFacetCount && (
            <button
              onClick={() => {
                handleResetFilters();
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 ml-auto transition-colors font-semibold"
            >
              <RotateCcw className="w-3 h-3" /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Header Results Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div>
          {catalogState.mode === 'error' ? (
            <span className="font-semibold text-red-600 dark:text-red-400">
              Catalogue temporairement inaccessible
            </span>
          ) : (
            <>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                {displayDocs.length}
              </span>{' '}
              travaux scientifiques répertoriés
              {disciplineFilter !== 'all' && (
                <span> · Filière : <strong className="text-teal-600 dark:text-teal-400">{disciplineFilter}</strong></span>
              )}
              {studyDesignFilter !== 'all' && (
                <span> · Devis : <strong className="text-indigo-600 dark:text-indigo-400">{studyDesignFilter}</strong></span>
              )}
            </>
          )}
        </div>
        <button
          onClick={onRequestDocument}
          className="text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
        >
          Vous cherchez un mémoire précis ? Faites une demande
        </button>
      </div>

      {catalogState.mode === 'error' ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-800 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-500">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Le catalogue distant ne répond pas
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {catalogState.message}. L’affichage revient sur les documents locaux disponibles.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              Effacer les filtres
            </button>
            <button
              onClick={onRequestDocument}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white shadow-sm"
            >
              Demander ce document au service documentaire
            </button>
          </div>
        </div>
      ) : displayDocs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Aucun document ne correspond à vos filtres
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Essayez de désactiver le filtre de devis méthodologique ou d'élargir la zone sanitaire.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              Effacer les filtres
            </button>
            <button
              onClick={onRequestDocument}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white shadow-sm"
            >
              Demander ce document au service documentaire
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayDocs.map((doc) => {
            const isBookmarked = bookmarks.includes(doc.id);
            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Top metadata badges */}
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800/80">
                        {doc.type}
                      </span>
                      {doc.studyDesign && (
                        <span className="font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                          {doc.studyDesign}
                        </span>
                      )}
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-500">{doc.year}</span>
                    </div>

                    <button
                      onClick={() => onToggleBookmark(doc.id)}
                      className="text-slate-400 hover:text-amber-500 transition-colors p-1"
                      title={isBookmarked ? 'Retirer des favoris' : 'Enregistrer'}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => onSelectDocument(doc)}
                    className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 cursor-pointer transition-colors leading-snug line-clamp-2"
                  >
                    {doc.title}
                  </h3>

                  {/* Author & Affiliation */}
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {doc.author}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{doc.institution}</span>
                    </div>
                    {doc.healthZone && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.healthZone}</span>
                      </div>
                    )}
                  </div>

                  {/* DOI and Open Data tag */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-400 font-mono">
                    <span>DOI: {doc.doi}</span>
                    {doc.hasOpenData && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                        <Database className="w-2.5 h-2.5" /> Données ouvertes
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {doc.citationsCount !== undefined && `${doc.citationsCount} citations · `}{doc.pages}p
                  </span>
                  <button
                    onClick={() => onSelectDocument(doc)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-600 text-teal-700 dark:text-teal-300 hover:text-white dark:hover:text-white font-bold transition-colors border border-teal-200 dark:border-teal-800/80 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> Consulter
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {displayDocs.map((doc) => {
            const isBookmarked = bookmarks.includes(doc.id);
            return (
              <div
                key={doc.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] flex-wrap">
                    <span className="font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded">
                      {doc.type}
                    </span>
                    {doc.studyDesign && (
                      <span className="font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                        {doc.studyDesign}
                      </span>
                    )}
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 dark:text-slate-400">{doc.discipline}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-slate-500">{doc.year}</span>
                  </div>

                  <h3
                    onClick={() => onSelectDocument(doc)}
                    className="text-sm font-bold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition-colors"
                  >
                    {doc.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-500">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {doc.author}
                    </span>
                    <span>{doc.institution}</span>
                    <span className="font-mono text-[11px] text-teal-600">DOI: {doc.doi}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onToggleBookmark(doc.id)}
                    className="p-2 text-slate-400 hover:text-amber-500 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={isBookmarked ? 'Retirer' : 'Enregistrer'}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>

                  <button
                    onClick={() => onSelectDocument(doc)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Consulter
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

