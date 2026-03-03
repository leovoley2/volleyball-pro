// src/hooks/useStandings.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { StandingWithTeam, GroupStandings } from '../types/database';
import { calculateGroupStandings } from '../utils/standings';
import { useMatches } from './useMatches';
import { useEffect } from 'react';

// ==================== QUERIES ====================

/**
 * Obtiene los standings desde la base de datos (pre-calculados)
 */
export function useStandingsDB(groupId: string | undefined) {
  return useQuery({
    queryKey: ['standings', 'db', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data, error } = await supabase
        .from('standings')
        .select(
          `
          *,
          team:teams(
            *,
            player1:players!teams_player1_id_fkey(*),
            player2:players!teams_player2_id_fkey(*)
          )
        `
        )
        .eq('group_id', groupId)
        .order('posicion', { ascending: true });

      if (error) throw error;
      return data as StandingWithTeam[];
    },
    enabled: !!groupId,
  });
}

/**
 * Calcula standings en tiempo real basado en los matches
 * Este es el hook principal para la vista pública
 */
export function useGroupStandings(groupId: string | undefined, tournamentId: string | undefined) {
  const { data: allMatches } = useMatches(tournamentId);

  return useQuery({
    queryKey: ['standings', 'calculated', groupId],
    queryFn: async () => {
      if (!groupId || !allMatches) return [];

      // Obtener equipos del grupo
      const { data: teamGroups, error: teamGroupsError } = await supabase
        .from('team_groups')
        .select(
          `
          team:teams(
            *,
            player1:players!teams_player1_id_fkey(*),
            player2:players!teams_player2_id_fkey(*)
          )
        `
        )
        .eq('group_id', groupId);

      if (teamGroupsError) throw teamGroupsError;

      const teamsInGroup = teamGroups.map((tg: any) => tg.team);

      // Filtrar matches del grupo
      const groupMatches = allMatches.filter((m) => m.group_id === groupId);

      // Calcular standings usando la función de utils
      const standings = calculateGroupStandings(groupMatches, teamsInGroup);

      return standings;
    },
    enabled: !!groupId && !!tournamentId && !!allMatches,
  });
}

/**
 * Obtiene todos los grupos de un torneo con sus standings calculados
 */
export function useTournamentStandings(tournamentId: string | undefined) {
  const { data: allMatches } = useMatches(tournamentId);

  return useQuery({
    queryKey: ['standings', 'tournament', tournamentId],
    queryFn: async () => {
      if (!tournamentId || !allMatches) return [];

      // Obtener todos los grupos del torneo
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('order_number', { ascending: true });

      if (groupsError) throw groupsError;

      // Para cada grupo, calcular sus standings
      const groupStandings: GroupStandings[] = await Promise.all(
        groups.map(async (group) => {
          // Obtener equipos del grupo
          const { data: teamGroups } = await supabase
            .from('team_groups')
            .select(
              `
              team:teams(
                *,
                player1:players!teams_player1_id_fkey(*),
                player2:players!teams_player2_id_fkey(*)
              )
            `
            )
            .eq('group_id', group.id);

          const teamsInGroup = teamGroups?.map((tg: any) => tg.team) || [];

          // Filtrar matches del grupo
          const groupMatches = allMatches.filter((m) => m.group_id === group.id);

          // Calcular standings
          const standings = calculateGroupStandings(groupMatches, teamsInGroup);

          return {
            group_id: group.id,
            group_name: group.name,
            standings,
          };
        })
      );

      return groupStandings;
    },
    enabled: !!tournamentId && !!allMatches,
  });
}

// ==================== REALTIME ====================

export function useStandingsRealtime(groupId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

    // Suscribirse a cambios en los partidos que afectan este grupo
    const channel = supabase
      .channel(`standings:group:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          // Invalidar queries cuando hay cambios en matches
          queryClient.invalidateQueries({ queryKey: ['standings', 'calculated', groupId] });
          queryClient.invalidateQueries({ queryKey: ['standings', 'db', groupId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'standings',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          // Invalidar queries cuando hay cambios directos en standings
          queryClient.invalidateQueries({ queryKey: ['standings', 'db', groupId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);
}
