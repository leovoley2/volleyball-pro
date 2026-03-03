// src/hooks/useTeams.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { TeamWithPlayers, CreateTeamInput } from '../types/database';

export function useTeams(tournamentId: string | undefined) {
    return useQuery({
        queryKey: ['teams', tournamentId],
        queryFn: async () => {
            if (!tournamentId) return [];
            const { data, error } = await supabase
                .from('teams')
                .select(`
          *,
          player1:players!teams_player1_id_fkey(*),
          player2:players!teams_player2_id_fkey(*)
        `)
                .eq('tournament_id', tournamentId)
                .order('seed_points', { ascending: false });
            if (error) throw error;
            return data as TeamWithPlayers[];
        },
        enabled: !!tournamentId,
    });
}

export function useCreateTeam() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateTeamInput) => {
            // Obtener puntos de los jugadores para calcular seed
            const { data: p1 } = await supabase
                .from('players')
                .select('ranking_points_total')
                .eq('id', input.player1_id)
                .single();
            const { data: p2 } = await supabase
                .from('players')
                .select('ranking_points_total')
                .eq('id', input.player2_id)
                .single();

            const seedPoints = (p1?.ranking_points_total || 0) + (p2?.ranking_points_total || 0);

            const { data, error } = await supabase
                .from('teams')
                .insert([{ ...input, seed_points: seedPoints }])
                .select(`
          *,
          player1:players!teams_player1_id_fkey(*),
          player2:players!teams_player2_id_fkey(*)
        `)
                .single();
            if (error) throw error;
            return data as TeamWithPlayers;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['teams', variables.tournament_id] });
            queryClient.invalidateQueries({ queryKey: ['tournament', variables.tournament_id] });
        },
    });
}

export function useDeleteTeam() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ teamId, tournamentId }: { teamId: string; tournamentId: string }) => {
            const { error } = await supabase.from('teams').delete().eq('id', teamId);
            if (error) throw error;
            return tournamentId;
        },
        onSuccess: (tournamentId) => {
            queryClient.invalidateQueries({ queryKey: ['teams', tournamentId] });
        },
    });
}
