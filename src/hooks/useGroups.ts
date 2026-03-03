// src/hooks/useGroups.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Group, TeamWithPlayers } from '../types/database';
import { generateRoundRobinFixture } from '../utils/standings';

export function useGroups(tournamentId: string | undefined) {
    return useQuery({
        queryKey: ['groups', tournamentId],
        queryFn: async () => {
            if (!tournamentId) return [];
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .eq('tournament_id', tournamentId)
                .order('order_number', { ascending: true });
            if (error) throw error;
            return data as Group[];
        },
        enabled: !!tournamentId,
    });
}

export function useGroupTeams(groupId: string | undefined) {
    return useQuery({
        queryKey: ['group-teams', groupId],
        queryFn: async () => {
            if (!groupId) return [];
            const { data, error } = await supabase
                .from('team_groups')
                .select(`
          team:teams(
            *,
            player1:players!teams_player1_id_fkey(*),
            player2:players!teams_player2_id_fkey(*)
          )
        `)
                .eq('group_id', groupId);
            if (error) throw error;
            return data.map((tg: any) => tg.team) as TeamWithPlayers[];
        },
        enabled: !!groupId,
    });
}

/**
 * Genera grupos usando el método serpiente y crea el fixture round-robin
 */
export function useGenerateGroups() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            tournamentId,
            teams,
            numGroups,
        }: {
            tournamentId: string;
            teams: TeamWithPlayers[];
            numGroups: number;
        }) => {
            // 1. Ordenar equipos por seed_points DESC
            const sortedTeams = [...teams].sort((a, b) => b.seed_points - a.seed_points);

            // Asignar seed numbers
            const teamsWithSeeds = sortedTeams.map((team, index) => ({
                ...team,
                seed_number: index + 1,
            }));

            // 2. Crear grupos (A, B, C, ...)
            const groupNames = 'ABCDEFGHIJ'.split('').slice(0, numGroups);
            const createdGroups: Group[] = [];

            for (let i = 0; i < numGroups; i++) {
                const { data: group, error } = await supabase
                    .from('groups')
                    .insert([{
                        tournament_id: tournamentId,
                        name: groupNames[i],
                        order_number: i + 1,
                    }])
                    .select()
                    .single();
                if (error) throw error;
                createdGroups.push(group);
            }

            // 3. Distribución serpiente
            const groupAssignments: { team: TeamWithPlayers; groupIndex: number }[] = [];
            let direction = 1;
            let currentGroup = 0;

            for (const team of teamsWithSeeds) {
                groupAssignments.push({ team, groupIndex: currentGroup });
                currentGroup += direction;
                if (currentGroup >= numGroups) {
                    direction = -1;
                    currentGroup = numGroups - 1;
                } else if (currentGroup < 0) {
                    direction = 1;
                    currentGroup = 0;
                }
            }

            // 4. Insertar team_groups y actualizar seed_number
            for (const { team, groupIndex } of groupAssignments) {
                await supabase.from('team_groups').insert([{
                    team_id: team.id,
                    group_id: createdGroups[groupIndex].id,
                }]);

                await supabase.from('teams').update({ seed_number: team.seed_number }).eq('id', team.id);
            }

            // 5. Generar fixture round-robin por grupo
            for (const group of createdGroups) {
                const groupTeams = groupAssignments
                    .filter((a) => a.groupIndex === createdGroups.indexOf(group))
                    .map((a) => a.team);

                const fixtures = generateRoundRobinFixture(groupTeams.map((t) => t.id));

                for (const [teamAId, teamBId] of fixtures) {
                    await supabase.from('matches').insert([{
                        tournament_id: tournamentId,
                        group_id: group.id,
                        team_a_id: teamAId,
                        team_b_id: teamBId,
                        fase: 'grupos',
                        status: 'pendiente',
                    }]);
                }
            }

            // 6. Actualizar estado del torneo a 'grupos'
            await supabase.from('tournaments').update({ estado: 'grupos' }).eq('id', tournamentId);

            return createdGroups;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['groups', variables.tournamentId] });
            queryClient.invalidateQueries({ queryKey: ['matches', variables.tournamentId] });
            queryClient.invalidateQueries({ queryKey: ['tournament', variables.tournamentId] });
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
        },
    });
}
