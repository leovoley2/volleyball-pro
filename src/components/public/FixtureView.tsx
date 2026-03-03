// src/components/public/FixtureView.tsx
import React from 'react';
import { MatchWithTeams, MatchStatus } from '../../types/database';
import { Clock, CheckCircle, Zap, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FixtureViewProps {
    matches: MatchWithTeams[];
    groups: { id: string; name: string; order_number: number }[];
}

const StatusBadge: React.FC<{ status: MatchStatus }> = ({ status }) => {
    if (status === 'finalizado') {
        return (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                <CheckCircle size={12} /> Finalizado
            </span>
        );
    }
    if (status === 'en_vivo') {
        return (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full animate-pulse">
                <Zap size={12} /> En Vivo
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            <Clock size={12} /> Pendiente
        </span>
    );
};

const MatchCard: React.FC<{ match: MatchWithTeams }> = ({ match }) => {
    const isFinished = match.status === 'finalizado';
    const aWon = match.winner_id === match.team_a_id;
    const bWon = match.winner_id === match.team_b_id;

    const hasScore =
        match.set1_score_a !== null &&
        match.set1_score_b !== null;

    return (
        <div
            className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow ${match.status === 'en_vivo' ? 'border-red-300 bg-red-50' : ''
                }`}
        >
            <div className="flex items-center justify-between mb-3">
                <StatusBadge status={match.status} />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    {match.cancha && (
                        <span className="flex items-center gap-1">
                            <MapPin size={11} /> {match.cancha}
                        </span>
                    )}
                    {match.fecha_hora && (
                        <span>
                            {format(new Date(match.fecha_hora), 'HH:mm', { locale: es })}
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                {/* Equipo A */}
                <div
                    className={`flex items-center justify-between p-2 rounded ${isFinished && aWon ? 'bg-green-50' : ''
                        }`}
                >
                    <span
                        className={`font-semibold text-sm ${isFinished && aWon ? 'text-green-800' : 'text-gray-800'
                            }`}
                    >
                        {isFinished && aWon && '🏆 '}
                        {match.team_a.player1.nombre} {match.team_a.player1.apellido}
                        <span className="text-gray-500"> / </span>
                        {match.team_a.player2.nombre} {match.team_a.player2.apellido}
                    </span>
                    {hasScore && (
                        <div className="flex gap-1 text-sm font-bold">
                            <span
                                className={`px-2 py-0.5 rounded ${match.set1_score_a! > match.set1_score_b! ? 'bg-green-200 text-green-800' : 'bg-gray-100'
                                    }`}
                            >
                                {match.set1_score_a}
                            </span>
                            <span
                                className={`px-2 py-0.5 rounded ${match.set2_score_a! > match.set2_score_b! ? 'bg-green-200 text-green-800' : 'bg-gray-100'
                                    }`}
                            >
                                {match.set2_score_a}
                            </span>
                            {match.set3_score_a !== null && (
                                <span
                                    className={`px-2 py-0.5 rounded ${match.set3_score_a! > match.set3_score_b! ? 'bg-green-200 text-green-800' : 'bg-gray-100'
                                        }`}
                                >
                                    {match.set3_score_a}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex-1 border-t border-dashed border-gray-200"></div>
                    <span className="text-xs text-gray-400 font-bold">VS</span>
                    <div className="flex-1 border-t border-dashed border-gray-200"></div>
                </div>

                {/* Equipo B */}
                <div
                    className={`flex items-center justify-between p-2 rounded ${isFinished && bWon ? 'bg-green-50' : ''
                        }`}
                >
                    <span
                        className={`font-semibold text-sm ${isFinished && bWon ? 'text-green-800' : 'text-gray-800'
                            }`}
                    >
                        {isFinished && bWon && '🏆 '}
                        {match.team_b.player1.nombre} {match.team_b.player1.apellido}
                        <span className="text-gray-500"> / </span>
                        {match.team_b.player2.nombre} {match.team_b.player2.apellido}
                    </span>
                    {hasScore && (
                        <div className="flex gap-1 text-sm font-bold">
                            <span
                                className={`px-2 py-0.5 rounded ${match.set1_score_b! > match.set1_score_a! ? 'bg-green-200 text-green-800' : 'bg-gray-100'
                                    }`}
                            >
                                {match.set1_score_b}
                            </span>
                            <span
                                className={`px-2 py-0.5 rounded ${match.set2_score_b! > match.set2_score_a! ? 'bg-green-200 text-green-800' : 'bg-gray-100'
                                    }`}
                            >
                                {match.set2_score_b}
                            </span>
                            {match.set3_score_b !== null && (
                                <span
                                    className={`px-2 py-0.5 rounded ${match.set3_score_b! > match.set3_score_a! ? 'bg-green-200 text-green-800' : 'bg-gray-100'
                                        }`}
                                >
                                    {match.set3_score_b}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const FixtureView: React.FC<FixtureViewProps> = ({ matches, groups }) => {
    if (matches.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                <p>No hay partidos generados aún</p>
            </div>
        );
    }

    // Agrupar por grupo
    const matchesByGroup = groups.reduce((acc, group) => {
        acc[group.id] = {
            name: group.name,
            matches: matches.filter((m) => m.group_id === group.id),
        };
        return acc;
    }, {} as Record<string, { name: string; matches: MatchWithTeams[] }>);

    // Partidos de playoff (sin grupo)
    const playoffMatches = matches.filter((m) => !m.group_id);

    return (
        <div className="space-y-6">
            {Object.entries(matchesByGroup).map(([groupId, { name, matches: groupMatches }]) => (
                <div key={groupId}>
                    <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                            {name}
                        </span>
                        Grupo {name}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {groupMatches.map((m) => (
                            <MatchCard key={m.id} match={m} />
                        ))}
                    </div>
                </div>
            ))}

            {playoffMatches.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-gray-700 mb-3">🏆 Playoffs</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {playoffMatches.map((m) => (
                            <MatchCard key={m.id} match={m} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
