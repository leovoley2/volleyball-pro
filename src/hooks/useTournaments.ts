// src/hooks/useTournaments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Tournament, CreateTournamentInput, TournamentWithDetails } from '../types/database';
import { useEffect } from 'react';

// ==================== QUERIES ====================

export function useTournaments() {
  return useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('fecha_inicio', { ascending: false });

      if (error) throw error;
      return data as Tournament[];
    },
  });
}

export function useTournament(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return null;

      const { data, error } = await supabase
        .from('tournaments')
        .select(
          `
          *,
          teams (
            *,
            player1:players!teams_player1_id_fkey(*),
            player2:players!teams_player2_id_fkey(*)
          ),
          groups (*)
        `
        )
        .eq('id', tournamentId)
        .single();

      if (error) throw error;
      return data as TournamentWithDetails;
    },
    enabled: !!tournamentId,
  });
}

export function useActiveTournaments() {
  return useQuery({
    queryKey: ['tournaments', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .in('estado', ['inscripcion', 'grupos', 'playoffs'])
        .order('fecha_inicio', { ascending: false });

      if (error) throw error;
      return data as Tournament[];
    },
  });
}

// ==================== MUTATIONS ====================

export function useCreateTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTournamentInput) => {
      const { data, error } = await supabase
        .from('tournaments')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}

export function useUpdateTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Tournament>;
    }) => {
      const { data, error } = await supabase
        .from('tournaments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournament', variables.id] });
    },
  });
}

// ==================== REALTIME ====================

export function useTournamentRealtime(tournamentId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tournamentId) return;

    const channel = supabase
      .channel(`tournament:${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, queryClient]);
}
