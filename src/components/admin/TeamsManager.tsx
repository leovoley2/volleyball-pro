// src/components/admin/TeamsManager.tsx
import React, { useState } from 'react';
import { useTeams, useCreateTeam, useDeleteTeam } from '../../hooks/useTeams';
import { usePlayers } from '../../hooks/usePlayers';
import { useTournament } from '../../hooks/useTournaments';
import { TeamWithPlayers } from '../../types/database';
import { UserPlus, Trash2, Users, Search } from 'lucide-react';

interface TeamsManagerProps {
    tournamentId: string;
}

export const TeamsManager: React.FC<TeamsManagerProps> = ({ tournamentId }) => {
    const { data: teams, isLoading: teamsLoading } = useTeams(tournamentId);
    const { data: players } = usePlayers();
    const { data: tournament } = useTournament(tournamentId);
    const createTeam = useCreateTeam();
    const deleteTeam = useDeleteTeam();

    const [player1Id, setPlayer1Id] = useState('');
    const [player2Id, setPlayer2Id] = useState('');
    const [formError, setFormError] = useState('');
    const [searchP1, setSearchP1] = useState('');
    const [searchP2, setSearchP2] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Filtrar jugadores que ya están en el torneo
    const playerIdsInTournament = new Set(
        (teams || []).flatMap((t) => [t.player1_id, t.player2_id])
    );

    const filteredPlayers = (categoria: string, genero: string, search: string) =>
        (players || []).filter(
            (p) =>
                p.categoria === categoria &&
                p.genero === genero &&
                !playerIdsInTournament.has(p.id) &&
                `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(search.toLowerCase())
        );

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (player1Id === player2Id) {
            setFormError('Los dos jugadores deben ser diferentes.');
            return;
        }
        try {
            await createTeam.mutateAsync({
                tournament_id: tournamentId,
                player1_id: player1Id,
                player2_id: player2Id,
            });
            setPlayer1Id('');
            setPlayer2Id('');
            setSearchP1('');
            setSearchP2('');
            setShowForm(false);
        } catch (err: any) {
            if (err.message?.includes('unique') || err.code === '23505') {
                setFormError('Esta dupla ya está inscripta en el torneo.');
            } else {
                setFormError(err.message || 'Error al crear la dupla.');
            }
        }
    };

    const handleDelete = async (team: TeamWithPlayers) => {
        if (!confirm(`¿Eliminar la dupla ${team.player1.apellido}/${team.player2.apellido}?`)) return;
        await deleteTeam.mutateAsync({ teamId: team.id, tournamentId });
    };

    if (teamsLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const cat = tournament?.categoria || 'U15';
    const gen = tournament?.genero || 'M';

    const p1Options = filteredPlayers(cat, gen, searchP1);
    const p2Options = filteredPlayers(cat, gen, searchP2).filter((p) => p.id !== player1Id);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                    Duplas Inscritas ({(teams || []).length})
                </h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all shadow-sm"
                >
                    <UserPlus size={18} /> Inscribir Dupla
                </button>
            </div>

            {showForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <h3 className="font-bold text-gray-800 mb-4">Inscribir Nueva Dupla</h3>
                    <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Jugador 1 *</label>
                            <div className="relative mb-1">
                                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar jugador..."
                                    value={searchP1}
                                    onChange={(e) => setSearchP1(e.target.value)}
                                    className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                            </div>
                            <select
                                required
                                size={4}
                                value={player1Id}
                                onChange={(e) => setPlayer1Id(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            >
                                <option value="">-- Selecciona --</option>
                                {p1Options.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.apellido}, {p.nombre} ({p.ranking_points_total} pts)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Jugador 2 *</label>
                            <div className="relative mb-1">
                                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar jugador..."
                                    value={searchP2}
                                    onChange={(e) => setSearchP2(e.target.value)}
                                    className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                            </div>
                            <select
                                required
                                size={4}
                                value={player2Id}
                                onChange={(e) => setPlayer2Id(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            >
                                <option value="">-- Selecciona --</option>
                                {p2Options.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.apellido}, {p.nombre} ({p.ranking_points_total} pts)
                                    </option>
                                ))}
                            </select>
                        </div>
                        {formError && (
                            <div className="sm:col-span-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm">
                                {formError}
                            </div>
                        )}
                        <div className="sm:col-span-2">
                            <button
                                type="submit"
                                disabled={createTeam.isPending || !player1Id || !player2Id}
                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-all disabled:opacity-60"
                            >
                                <Users size={16} /> Inscribir Dupla
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {(teams || []).length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    No hay duplas inscritas. Inscribe la primera.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">#</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Jugador 1</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Jugador 2</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">Seed Pts</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(teams || []).map((team, idx) => (
                                <tr key={team.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-center text-gray-500 font-semibold">{team.seed_number || idx + 1}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold">{team.player1.nombre} {team.player1.apellido}</div>
                                        <div className="text-xs text-gray-500">{team.player1.ranking_points_total} pts</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold">{team.player2.nombre} {team.player2.apellido}</div>
                                        <div className="text-xs text-gray-500">{team.player2.ranking_points_total} pts</div>
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-orange-600">{team.seed_points}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleDelete(team)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
