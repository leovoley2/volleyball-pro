import React, { useState, useEffect } from 'react';
import { supabase, auth } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// Hooks
import { useTournaments, useTournament } from './hooks/useTournaments';
import { useMatches, useMatchesRealtime } from './hooks/useMatches';
import { useGroups } from './hooks/useGroups';
import { useTournamentStandings } from './hooks/useStandings';
import { usePlayers } from './hooks/usePlayers';

// Public components
import { TournamentSelector } from './components/public/TournamentSelector';
import { StandingsTable } from './components/public/StandingsTable';
import { FixtureView } from './components/public/FixtureView';

// Admin components
import { LoginForm } from './components/admin/LoginForm';
import { PlayersManager } from './components/admin/PlayersManager';
import { TournamentManager } from './components/admin/TournamentManager';
import { TeamsManager } from './components/admin/TeamsManager';
import { GroupsManager } from './components/admin/GroupsManager';
import { MatchesManager } from './components/admin/MatchesManager';

// Icons
import {
  Trophy, LayoutGrid, List, BarChart2, Users, LogOut,
  ChevronLeft, Settings, UserCheck, Layers, Swords
} from 'lucide-react';

// ============================================
// PUBLIC VIEW
// ============================================

type PublicTab = 'torneos' | 'fixture' | 'standings' | 'ranking';

function PublicView() {
  const { data: tournaments, isLoading } = useTournaments();
  const allTournaments = tournaments || [];

  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [tab, setTab] = useState<PublicTab>('torneos');

  const selectedTournament = allTournaments.find((t) => t.id === selectedTournamentId) || null;

  const { data: matches } = useMatches(selectedTournamentId || undefined);
  const { data: groups } = useGroups(selectedTournamentId || undefined);
  const { data: standings } = useTournamentStandings(selectedTournamentId || undefined);
  const { data: players } = usePlayers();

  // Realtime updates
  useMatchesRealtime(selectedTournamentId || undefined);

  const publicTabs: { id: PublicTab; label: string; icon: React.ReactNode }[] = [
    { id: 'torneos', label: 'Torneos', icon: <Trophy size={16} /> },
    { id: 'fixture', label: 'Fixture', icon: <List size={16} /> },
    { id: 'standings', label: 'Tabla', icon: <LayoutGrid size={16} /> },
    { id: 'ranking', label: 'Ranking', icon: <BarChart2 size={16} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {publicTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Torneos */}
      {tab === 'torneos' && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Torneos Activos</h2>
            <p className="text-sm text-gray-500">Selecciona un torneo para ver detalles</p>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <TournamentSelector
              tournaments={allTournaments}
              selectedId={selectedTournamentId}
              onSelect={(id) => {
                setSelectedTournamentId(id);
                setTab('fixture');
              }}
            />
          )}
        </div>
      )}

      {/* Fixture */}
      {tab === 'fixture' && (
        <div>
          {!selectedTournamentId ? (
            <div className="text-center py-12">
              <Trophy size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500">Selecciona un torneo en la pestaña "Torneos"</p>
              <button
                onClick={() => setTab('torneos')}
                className="mt-3 text-blue-600 hover:underline text-sm"
              >
                Ver torneos →
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setTab('torneos')} className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                  <ChevronLeft size={14} /> Torneos
                </button>
                <span className="text-gray-300">/</span>
                <span className="text-sm font-semibold text-gray-700">{selectedTournament?.nombre}</span>
              </div>
              <FixtureView
                matches={matches || []}
                groups={(groups || []).map((g) => ({
                  id: g.id,
                  name: g.name,
                  order_number: g.order_number,
                }))}
              />
            </div>
          )}
        </div>
      )}

      {/* Standings */}
      {tab === 'standings' && (
        <div>
          {!selectedTournamentId ? (
            <div className="text-center py-12">
              <LayoutGrid size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500">Selecciona un torneo primero</p>
              <button onClick={() => setTab('torneos')} className="mt-3 text-blue-600 hover:underline text-sm">
                Ver torneos →
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setTab('torneos')} className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                  <ChevronLeft size={14} /> Torneos
                </button>
                <span className="text-gray-300">/</span>
                <span className="text-sm font-semibold text-gray-700">{selectedTournament?.nombre}</span>
              </div>
              {(standings || []).length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No hay tablas de posiciones aún. Los resultados se mostrarán aquí automáticamente.
                </div>
              ) : (
                (standings || []).map((gs) => (
                  <StandingsTable
                    key={gs.group_id}
                    standings={gs.standings}
                    groupName={gs.group_name}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Ranking */}
      {tab === 'ranking' && (
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Ranking de Jugadores</h2>
          <RankingView players={players || []} />
        </div>
      )}
    </div>
  );
}

// Simple ranking table
function RankingView({ players }: { players: any[] }) {
  const [filterGen, setFilterGen] = useState<'all' | 'M' | 'F'>('all');
  const [filterCat, setFilterCat] = useState<string>('all');

  const filtered = players
    .filter((p) => {
      const mg = filterGen === 'all' || p.genero === filterGen;
      const mc = filterCat === 'all' || p.categoria === filterCat;
      return mg && mc && p.ranking_points_total > 0;
    })
    .sort((a, b) => b.ranking_points_total - a.ranking_points_total);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <select
          value={filterGen}
          onChange={(e) => setFilterGen(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">Todos</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </select>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">Todas las cat.</option>
          {['U13', 'U15', 'U17', 'U19'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-400">Sin datos de ranking</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 w-12">Pos</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Jugador</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Cat</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p, idx) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${idx < 3 ? 'font-semibold' : ''}`}>
                  <td className="px-4 py-3 text-center">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    {p.nombre} {p.apellido}
                    <div className="text-xs text-gray-400">{p.genero === 'M' ? 'Masculino' : 'Femenino'}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                      {p.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-orange-600">{p.ranking_points_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================
// ADMIN VIEW
// ============================================

type AdminTab = 'torneos' | 'jugadores' | 'duplas' | 'grupos' | 'partidos';

function AdminView({ onLogout: _onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('torneos');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const { data: selectedTournament } = useTournament(selectedTournamentId || undefined);

  const adminTabs: { id: AdminTab; label: string; icon: React.ReactNode; requiresTournament?: boolean }[] = [
    { id: 'torneos', label: 'Torneos', icon: <Trophy size={16} /> },
    { id: 'jugadores', label: 'Jugadores', icon: <UserCheck size={16} /> },
    { id: 'duplas', label: 'Duplas', icon: <Users size={16} />, requiresTournament: true },
    { id: 'grupos', label: 'Grupos', icon: <Layers size={16} />, requiresTournament: true },
    { id: 'partidos', label: 'Partidos', icon: <Swords size={16} />, requiresTournament: true },
  ];

  const handleSelectTournament = (id: string) => {
    setSelectedTournamentId(id);
    setActiveTab('duplas');
  };

  return (
    <div className="space-y-4">
      {/* Torneo activo banner */}
      {selectedTournamentId && selectedTournament && (
        <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Settings size={14} className="text-orange-500" />
            <span className="text-orange-700 font-semibold">Gestionando:</span>
            <span className="text-orange-800 font-bold">{selectedTournament.nombre}</span>
          </div>
          <button
            onClick={() => { setSelectedTournamentId(null); setActiveTab('torneos'); }}
            className="text-xs text-orange-600 hover:underline flex items-center gap-1"
          >
            <ChevronLeft size={13} /> Cambiar
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {adminTabs.map((t) => {
          const disabled = t.requiresTournament && !selectedTournamentId;
          return (
            <button
              key={t.id}
              onClick={() => !disabled && setActiveTab(t.id)}
              disabled={disabled}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === t.id
                ? 'bg-white text-orange-600 shadow-sm'
                : disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800'
                }`}
              title={disabled ? 'Selecciona un torneo primero' : ''}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'torneos' && (
          <TournamentManager onSelectTournament={handleSelectTournament} />
        )}
        {activeTab === 'jugadores' && <PlayersManager />}
        {activeTab === 'duplas' && selectedTournamentId && (
          <TeamsManager tournamentId={selectedTournamentId} />
        )}
        {activeTab === 'grupos' && selectedTournamentId && (
          <GroupsManager tournamentId={selectedTournamentId} />
        )}
        {activeTab === 'partidos' && selectedTournamentId && (
          <MatchesManager tournamentId={selectedTournamentId} />
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================

type MainView = 'public' | 'admin';

function App() {
  const [mainView, setMainView] = useState<MainView>('public');
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    setMainView('public');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-orange-500 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏐</span>
              <div>
                <h1 className="text-xl font-extrabold leading-tight tracking-tight">Liga Nacional de Menores</h1>
                <p className="text-blue-100 text-xs">Voleibol de Playa</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMainView('public')}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${mainView === 'public'
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-white hover:bg-white/10'
                  }`}
              >
                🌐 Público
              </button>

              {session ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMainView('admin')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${mainView === 'admin'
                      ? 'bg-white text-orange-600 shadow'
                      : 'text-white hover:bg-white/10'
                      }`}
                  >
                    ⚙️ Admin
                  </button>
                  <button
                    onClick={handleLogout}
                    title="Cerrar sesión"
                    className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setMainView('admin')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${mainView === 'admin'
                    ? 'bg-white text-orange-600 shadow'
                    : 'text-white hover:bg-white/10'
                    }`}
                >
                  🔐 Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {authLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : mainView === 'public' ? (
          <PublicView />
        ) : session ? (
          <AdminView onLogout={handleLogout} />
        ) : (
          <LoginForm onSuccess={() => setMainView('admin')} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12 py-5">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            🏐 <strong>Liga Nacional de Menores de Voleibol de Playa</strong>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Sistema PRO v2.0 · Powered by Supabase · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
