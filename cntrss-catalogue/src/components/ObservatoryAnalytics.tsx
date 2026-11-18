import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Building2,
  FileText,
  Download,
  Users,
  Award,
  Globe2
} from 'lucide-react';
import { checkBackend, fetchJson, ObservatoryApiResponse } from '../lib/backendApi';

export const ObservatoryAnalytics: React.FC = () => {
  type State =
    | { status: 'loading' }
    | { status: 'available'; data: ObservatoryApiResponse }
    | { status: 'error'; message: string };

  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    checkBackend()
      .then((available) => {
        if (!available) {
          setState({ status: 'error', message: 'Le service d’observatoire est indisponible.' });
          return;
        }
        return fetchJson<ObservatoryApiResponse>('/api/observatory');
      })
      .then(
        (data) => {
          if (data) setState({ status: 'available', data });
        },
        (err) => {
          setState({ status: 'error', message: err instanceof Error ? err.message : 'Impossible de charger l observatoire' });
        }
      );
  }, []);

  const dataOrDef = (() => {
    if (state.status === 'available') return state.data;
    return null;
  })();

  const totalDocuments = dataOrDef?.totalDocuments ?? 0;
  const validatedDocuments = dataOrDef?.validatedDocuments ?? 0;
  const totalDownloads = dataOrDef?.totalDownloads ?? 0;
  const totalCitations = dataOrDef?.totalCitations ?? 0;
  const openRequests = dataOrDef?.openRequests ?? 0;
  const recentSubmissions = dataOrDef?.recentSubmissions ?? [];
  // Aucune valeur de repli chiffrée : les indicateurs viennent uniquement de la
  // base, ils remontent naturellement dès les premiers dépôts validés.
  const topInstitutions = dataOrDef?.topInstitutions ?? [];
  const topDisciplines = dataOrDef?.topDisciplines ?? [];

  const totalIndexed = topDisciplines.reduce((acc: number, d: any) => acc + (d.count || 0), 0);

  // Répartition réelle par filière, calculée par /api/observatory.
  const PATHOLOGY_COLORS = [
    'bg-teal-500',
    'bg-sky-500',
    'bg-blue-600',
    'bg-emerald-500',
    'bg-indigo-500',
    'bg-amber-500'
  ];
  const disciplineEntries = Object.entries(dataOrDef?.byDiscipline || {}).filter(([, count]) => Number(count) > 0);
  const disciplineTotal = disciplineEntries.reduce((acc, [, count]) => acc + Number(count), 0);
  const pathologyData = disciplineEntries
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 6)
    .map(([name, count], idx) => ({
      name,
      count: Number(count),
      percent: disciplineTotal > 0 ? Math.round((Number(count) / disciplineTotal) * 100) : 0,
      color: PATHOLOGY_COLORS[idx % PATHOLOGY_COLORS.length]
    }));

  const institutionData = topInstitutions.map((inst: any, idx: number) => {
    const percent = totalIndexed > 0 ? Math.round(((inst.count || 0) / totalIndexed) * 100) : 0;
    return { name: inst.name, percent, count: inst.count };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Globe2 className="w-4 h-4" /> Observatoire National
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Cartographie de la Recherche Médicale au Bénin
          </h2>
          <p className="text-xs text-slate-500">
            Indicateurs bibliométriques et tendances thématiques de la production scientifique
          </p>
        </div>

        <button
          onClick={() => alert("Rapport bibliométrique annuel du CNTRSS exporté.")}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 self-start sm:self-center transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Exporter le rapport
        </button>
      </div>

      {state.status === 'error' ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-800 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-500">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              L’observatoire national est temporairement indisponible
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {state.message} Les indicateurs sont recalculés automatiquement dès que le service répond.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white shadow-sm"
          >
            Actualiser
          </button>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Production Totale</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {totalDocuments.toLocaleString('fr-FR')}
              </div>
              <span className="text-[11px] text-teal-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Indexation nationale
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Validés & Publiés</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {validatedDocuments.toLocaleString('fr-FR')}
              </div>
              <span className="text-[11px] text-slate-500">Disponibles au catalogue</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">En file de validation</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {dataOrDef?.pendingValidations ?? 0}
              </div>
              <span className="text-[11px] text-slate-500">En attente de comité</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Téléchargements Effectifs</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {totalDownloads.toLocaleString('fr-FR')}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">Impact scientifique avéré</span>
            </div>
          </div>

          {/* Main Graphs Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Pathologies distribution */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Répartition par filière scientifique
                  </h3>
                  <p className="text-xs text-slate-500">Documents réellement indexés par filière</p>
                </div>
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-4 pt-1">
                {pathologyData.length === 0 && (
                  <p className="text-xs text-slate-400">
                    Aucun document indexé pour le moment : la répartition apparaîtra avec les premiers dépôts validés.
                  </p>
                )}
                {pathologyData.map((item: any, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {item.name}
                      </span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {item.count} docs ({item.percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Institutional contribution */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Part des établissements partenaires
                  </h3>
                  <p className="text-xs text-slate-500">Volume de dépôts archivés par université</p>
                </div>
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-4 pt-1">
                {institutionData.length === 0 && (
                  <p className="text-xs text-slate-400">
                    Aucun dépôt archivé pour le moment : les établissements partenaires apparaîtront ici avec leurs
                    premiers catalogues.
                  </p>
                )}
                {institutionData.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <span className="truncate max-w-[200px]">{item.name}</span>
                      <span className="font-mono text-teal-600 dark:text-teal-400">{item.percent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-600"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
