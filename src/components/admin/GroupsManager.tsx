// src/components/admin/GroupsManager.tsx
import React, { useState } from 'react';
import { useTeams } from '../../hooks/useTeams';
import { useGroups, useGroupTeams, useGenerateGroups } from '../../hooks/useGroups';
import { useTournament } from '../../hooks/useTournaments';
import { Layers, Shuffle } from 'lucide-react';

interface GroupsManagerProps {
    tournamentId: string;
}

export const GroupsManager: React.FC<GroupsManagerProps> = ({ tournamentId }) => {
    const { data: tournament } = useTournament(tournamentId);
    const { data: teams } = useTeams(tournamentId);
    const { data: groups } = useGroups(tournamentId);
    const generateGroups = useGenerateGroups();
    const [generating, setGenerating] = useState(false);
    const [_generated, setGenerated] = useState(false);

    const hasGroups = (groups || []).length > 0;

    const handleGenerate = async () => {
        if (!teams || teams.length === 0) {
            alert('Debes inscribir duplas primero.');
            return;
        }
        if (!tournament) return;
        if (
            !confirm(
                `¿Generar ${tournament.numero_grupos} grupos con método serpiente para ${teams.length} duplas? Esto también creará el fixture.`
            )
        )
            return;
        setGenerating(true);
        try {
            await generateGroups.mutateAsync({
                tournamentId,
                teams,
                numGroups: tournament.numero_grupos,
            });
            setGenerated(true);
        } catch (err: any) {
            alert(err.message || 'Error al generar grupos');
        }
        setGenerating(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Grupos y Fixture</h2>
                {!hasGroups && (
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all shadow-sm disabled:opacity-60"
                    >
                        <Shuffle size={18} /> {generating ? 'Generando...' : 'Generar Grupos'}
                    </button>
                )}
            </div>

            {!hasGroups && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
                    <Layers size={40} className="mx-auto text-yellow-500 mb-3" />
                    <p className="text-yellow-800 font-semibold mb-2">No hay grupos generados</p>
                    <p className="text-yellow-700 text-sm">
                        Hay {(teams || []).length} duplas inscritas. Al generar los grupos se asignarán usando el
                        método serpiente y se creará el fixture round-robin para cada grupo.
                    </p>
                </div>
            )}

            {hasGroups && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(groups || []).map((group) => (
                        <GroupCard key={group.id} groupId={group.id} groupName={group.name} />
                    ))}
                </div>
            )}
        </div>
    );
};

const GroupCard: React.FC<{ groupId: string; groupName: string }> = ({ groupId, groupName }) => {
    const { data: teams } = useGroupTeams(groupId);
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {groupName}
                </span>
                <h3 className="font-bold text-gray-800">Grupo {groupName}</h3>
            </div>
            <div className="space-y-2">
                {(teams || []).map((team, idx) => (
                    <div key={team.id} className="flex items-center gap-2 text-sm text-gray-700 py-1.5 border-b border-gray-100 last:border-0">
                        <span className="text-xs text-gray-400 font-bold w-4">{idx + 1}</span>
                        <div>
                            <div className="font-semibold">{team.player1.apellido} / {team.player2.apellido}</div>
                            <div className="text-xs text-gray-500">{team.seed_points} pts combinados</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
