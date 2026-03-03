// src/types/database.ts
// Tipos generados automáticamente desde el schema de Supabase

export type Category = 'U13' | 'U15' | 'U17' | 'U19';
export type Gender = 'M' | 'F';
export type TournamentStatus = 'inscripcion' | 'grupos' | 'playoffs' | 'finalizado';
export type MatchStatus = 'pendiente' | 'en_vivo' | 'finalizado';
export type MatchPhase = 'grupos' | 'cuartos' | 'semifinal' | 'tercer_lugar' | 'final';

export interface Player {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  genero: Gender;
  categoria: Category;
  ranking_points_total: number;
  created_at: string;
  updated_at: string;
}

export interface Tournament {
  id: string;
  nombre: string;
  sede: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  categoria: Category;
  genero: Gender;
  estado: TournamentStatus;
  numero_grupos: number;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  tournament_id: string;
  player1_id: string;
  player2_id: string;
  seed_points: number;
  seed_number: number | null;
  posicion_final: number | null;
  puntos_ganados: number;
  created_at: string;
}

export interface Group {
  id: string;
  tournament_id: string;
  name: string;
  order_number: number;
  created_at: string;
}

export interface TeamGroup {
  id: string;
  team_id: string;
  group_id: string;
  created_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  group_id: string | null;
  team_a_id: string;
  team_b_id: string;
  fase: MatchPhase;
  set1_score_a: number | null;
  set1_score_b: number | null;
  set2_score_a: number | null;
  set2_score_b: number | null;
  set3_score_a: number | null;
  set3_score_b: number | null;
  winner_id: string | null;
  status: MatchStatus;
  cancha: string | null;
  fecha_hora: string | null;
  created_at: string;
  updated_at: string;
}

export interface Standing {
  id: string;
  group_id: string;
  team_id: string;
  partidos_jugados: number;
  partidos_ganados: number;
  partidos_perdidos: number;
  sets_favor: number;
  sets_contra: number;
  puntos_favor: number;
  puntos_contra: number;
  ratio_sets: number;
  ratio_puntos: number;
  posicion: number | null;
  updated_at: string;
}

export interface RankingHistory {
  id: string;
  player_id: string;
  tournament_id: string;
  posicion: number;
  puntos_ganados: number;
  created_at: string;
}

// ==================== TIPOS EXTENDIDOS CON JOINS ====================

export interface TeamWithPlayers extends Team {
  player1: Player;
  player2: Player;
}

export interface MatchWithTeams extends Match {
  team_a: TeamWithPlayers;
  team_b: TeamWithPlayers;
  group?: Group;
}

export interface StandingWithTeam extends Standing {
  team: TeamWithPlayers;
}

export interface TournamentWithDetails extends Tournament {
  teams?: TeamWithPlayers[];
  groups?: Group[];
  matches?: MatchWithTeams[];
}

// ==================== TIPOS PARA FORMULARIOS ====================

export interface CreatePlayerInput {
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  genero: Gender;
}

export interface CreateTournamentInput {
  nombre: string;
  sede?: string;
  fecha_inicio: string;
  categoria: Category;
  genero: Gender;
  numero_grupos: number;
}

export interface CreateTeamInput {
  tournament_id: string;
  player1_id: string;
  player2_id: string;
}

export interface UpdateMatchScoreInput {
  match_id: string;
  set1_score_a: number;
  set1_score_b: number;
  set2_score_a: number;
  set2_score_b: number;
  set3_score_a?: number;
  set3_score_b?: number;
}

// ==================== TIPOS PARA CÁLCULOS ====================

export interface TeamStanding {
  team_id: string;
  team: TeamWithPlayers;
  partidos_jugados: number;
  partidos_ganados: number;
  partidos_perdidos: number;
  sets_favor: number;
  sets_contra: number;
  puntos_favor: number;
  puntos_contra: number;
  ratio_sets: number;
  ratio_puntos: number;
  posicion: number;
}

export interface GroupStandings {
  group_id: string;
  group_name: string;
  standings: TeamStanding[];
}

// ==================== CONSTANTES ====================

export const CATEGORIES: Category[] = ['U13', 'U15', 'U17', 'U19'];

export const GENDERS: Record<Gender, string> = {
  M: 'Masculino',
  F: 'Femenino',
};

export const TOURNAMENT_STATUS: Record<TournamentStatus, string> = {
  inscripcion: 'Inscripción',
  grupos: 'Fase de Grupos',
  playoffs: 'Playoffs',
  finalizado: 'Finalizado',
};

export const MATCH_STATUS: Record<MatchStatus, string> = {
  pendiente: 'Pendiente',
  en_vivo: 'En Vivo',
  finalizado: 'Finalizado',
};

export const POINTS_BY_POSITION: Record<number, number> = {
  1: 200,
  2: 160,
  3: 130,
  4: 110,
  5: 70,
  6: 70,
  7: 70,
  8: 70,
  9: 30,
  10: 30,
  11: 30,
  12: 30,
  13: 30,
  14: 30,
  15: 30,
  16: 30,
};
