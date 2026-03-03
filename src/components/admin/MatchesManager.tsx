// src/components/admin/MatchesManager.tsx
import React, { useState } from 'react';
import { useMatches, useUpdateMatchStatus } from '../../hooks/useMatches';
import { useGroups } from '../../hooks/useGroups';
import { MatchWithTeams } from '../../types/database';
import { MatchScoreInput } from './MatchScoreInput';
import { Clock, CheckCircle, Zap, Edit2, Play } from 'lucide-react';

interface MatchesManagerProps {
    tournamentId: string;
}

export const MatchesManager: React.FC<MatchesManagerProps> = ({ tournamentId }) => {
    const { data: matches, isLoading } = useMatches(tournamentId);
    const { data: groups } = useGroups(tournamentId);
    const updateStatus = useUpdateMatchStatus();
    const [editingMatch, setEditingMatch] = useState<MatchWithTeams | null>(null);
    const [filterGroup, setFilterGroup] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (editingMatch) {
        return (
            <div>
                <button
                    onClick={() => setEditingMatch(null)}
                    className="mb-4 text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                    ← Volver a la lista
                </button>
                <MatchScoreInput match={editingMatch} onClose={() => setEditingMatch(null)} />
            </div>
        );
    }

    const filtered = (matches || []).filter((m) => {
        const gOk = filterGroup === 'all' || m.group_id === filterGroup;
        const sOk = filterStatus === 'all' || m.status === filterStatus;
        return gOk && sOk;
    });

    const handleStart = async (match: MatchWithTeams) => {
        await updateStatus.mutateAsync({ matchId: match.id, status: 'en_vivo' });
    };

    const statusColor = (s: string) => {
        if (s === 'finalizado') return 'text-green-700 bg-green-100';
        if (s === 'en_vivo') return 'text-red-700 bg-red-100';
        return 'text-gray-600 bg-gray-100';
    };

    const statusIcon = (s: string) => {
        if (s === 'finalizado') return <CheckCircle size={13} />;
        if (s === 'en_vivo') return <Zap size={13} />;
        return <Clock size={13} />;
    };

    const statusLabel = (s: string) => {
        if (s === 'finalizado') return 'Finalizado';
        if (s === 'en_vivo') return 'En Vivo';
        return 'Pendiente';
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                    Partidos ({filtered.length})
                </h2>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
                <select
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                    <option value="all">Todos los grupos</option>
                    {(groups || []).map((g) => (
                        <option key={g.id} value={g.id}>Grupo {g.name}</option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                    <option value="all">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_vivo">En Vivo</option>
                    <option value="finalizado">Finalizado</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    No hay partidos que coincidan con los filtros.
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((match) => {
                        const aName = `${match.team_a.player1.apellido}/${match.team_a.player2.apellido}`;
                        const bName = `${match.team_b.player1.apellido}/${match.team_b.player2.apellido}`;
                        const groupName = (groups || []).find((g) => g.id === match.group_id)?.name;
                        const hasScore = match.set1_score_a !== null;

                        return (
                            <div
                                key={match.id}
                                className={`flex items-center justify-between gap-3 py-3 px-4 rounded-xl border ${match.status === 'en_vivo' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        {groupName && (
                                            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                                Grupo {groupName}
                                            </span>
                                        )}
                                        <span
                                            className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(match.status)}`}
                                        >
                                            {statusIcon(match.status)} {statusLabel(match.status)}
                                        </span>
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900">
                                        {aName}
                                        {hasScore && (
                                            <span className="mx-1 text-gray-400 font-bold">
                                                {match.set1_score_a}-{match.set1_score_b}
                                                {match.set2_score_a !== null && ` / ${match.set2_score_a}-${match.set2_score_b}`}
                                                {match.set3_score_a !== null && ` / ${match.set3_score_a}-${match.set3_score_b}`}
                                            </span>
                                        )}
                                        <span className="text-gray-400 mx-1">vs</span>
                                        {bName}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    {match.status === 'pendiente' && (
                                        <button
                                            onClick={() => handleStart(match)}
                                            className="flex items-center gap-1 px-2 py-1.5 text-xs text-green-700 bg-green-100 hover:bg-green-200 rounded-lg font-semibold transition-colors"
                                            title="Iniciar partido"
                                        >
                                            <Play size={13} /> Iniciar
                                        </button>
                                    )}
                                    {match.status !== 'finalizado' && (
                                        <button
                                            onClick={() => setEditingMatch(match)}
                                            className="flex items-center gap-1 px-2 py-1.5 text-xs text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg font-semibold transition-colors"
                                            title="Ingresar resultado"
                                        >
                                            <Edit2 size={13} /> Resultado
                                        </button>
                                    )}
                                    {match.status === 'finalizado' && (
                                        <button
                                            onClick={() => setEditingMatch(match)}
                                            className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                                            title="Editar resultado"
                                        >
                                            <Edit2 size={13} /> Editar
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
