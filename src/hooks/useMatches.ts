// src/hooks/useMatches.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Match, MatchWithTeams, UpdateMatchScoreInput } from '../types/database';
import { useEffect } from 'react';
import { determineMatchWinner } from '../utils/standings';

// ==================== QUERIES ====================

export function useMatches(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ['matches', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];

      const { data, error } = await supabase
        .from('matches')
        .select(
          `
          *,
          team_a:teams!matches_team_a_id_fkey(
            *,
            player1:players!teams_player1_id_fkey(*),
            player2:players!teams_player2_id_fkey(*)
          ),
          team_b:teams!matches_team_b_id_fkey(
            *,
            player1:players!teams_player1_id_fkey(*),
            player2:players!teams_player2_id_fkey(*)
          ),
          group:groups(*)
        `
        )
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as MatchWithTeams[];
    },
    enabled: !!tournamentId,
  });
}

export function useGroupMatches(groupId: string | undefined) {
  return useQuery({
    queryKey: ['matches', 'group', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data, error } = await supabase
        .from('matches')
        .select(
          `
          *,
          team_a:teams!matches_team_a_id_fkey(
            *,
            player1:players!teams_player1_id_fkey(*),
            player2:players!teams_player2_id_fkey(*)
          ),
          team_b:teams!matches_team_b_id_fkey(
            *,
            player1:players!teams_player1_id_fkey(*),
            player2:players!teams_player2_id_fkey(*)
          )
        `
        )
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as MatchWithTeams[];
    },
    enabled: !!groupId,
  });
}

export function useLiveMatches(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ['matches', 'live', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];

      const { data, error } = await supabase
        .from('matches')
        .select(
          `
          *,
          team_a:teams!matches_team_a_id_fkey(
            *,
            player1:players!teams_player1_id_fkey(*),
            player2:players!teams_player2_id_fkey(*)
          ),
          team_b:teams!matches_team_b_id_fkey(
            *,
            player1:players!teams_player1_id_fkey(*),
            player2:players!teams_player2_id_fkey(*)
          )
        `
        )
        .eq('tournament_id', tournamentId)
        .eq('status', 'en_vivo')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as MatchWithTeams[];
    },
    enabled: !!tournamentId,
    refetchInterval: 5000, // Refetch cada 5 segundos para matches en vivo
  });
}

// ==================== MUTATIONS ====================

export function useUpdateMatchScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateMatchScoreInput) => {
      const { match_id, ...scores } = input;

      // Crear objeto de match temporal para determinar ganador
      const tempMatch: Match = {
        id: match_id,
        set1_score_a: scores.set1_score_a,
        set1_score_b: scores.set1_score_b,
        set2_score_a: scores.set2_score_a,
        set2_score_b: scores.set2_score_b,
        set3_score_a: scores.set3_score_a ?? null,
        set3_score_b: scores.set3_score_b ?? null,
      } as Match;

      const winnerId = determineMatchWinner(tempMatch);

      const updateData = {
        ...scores,
        winner_id: winnerId,
        status: winnerId ? 'finalizado' : 'en_vivo',
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', match_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
    },
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (match: Partial<Match>) => {
      const { data, error } = await supabase
        .from('matches')
        .insert([match])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useUpdateMatchStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      status,
    }: {
      matchId: string;
      status: 'pendiente' | 'en_vivo' | 'finalizado';
    }) => {
      const { data, error } = await supabase
        .from('matches')
        .update({ status })
        .eq('id', matchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

// ==================== REALTIME ====================

export function useMatchesRealtime(tournamentId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tournamentId) return;

    const channel = supabase
      .channel(`matches:tournament:${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          console.log('Match updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['matches', tournamentId] });
          queryClient.invalidateQueries({ queryKey: ['matches', 'live', tournamentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, queryClient]);
}
