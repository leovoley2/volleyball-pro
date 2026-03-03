// src/utils/standings.ts
import { Match, TeamStanding, TeamWithPlayers } from '../types/database';

/**
 * Calcula las tablas de posiciones según reglas FIVB
 * 
 * Criterios de desempate:
 * 1. Partidos Ganados (PG)
 * 2. Ratio de Sets (Sets Ganados / Sets Perdidos)
 * 3. Ratio de Puntos (Puntos a Favor / Puntos en Contra)
 * 4. Enfrentamiento directo (head-to-head)
 */
export function calculateGroupStandings(
  matches: Match[],
  teamsInGroup: TeamWithPlayers[]
): TeamStanding[] {
  // Inicializar estadísticas para cada equipo
  const standings = new Map<string, TeamStanding>();

  teamsInGroup.forEach((team) => {
    standings.set(team.id, {
      team_id: team.id,
      team: team,
      partidos_jugados: 0,
      partidos_ganados: 0,
      partidos_perdidos: 0,
      sets_favor: 0,
      sets_contra: 0,
      puntos_favor: 0,
      puntos_contra: 0,
      ratio_sets: 0,
      ratio_puntos: 0,
      posicion: 0,
    });
  });

  // Procesar cada partido finalizado
  const finishedMatches = matches.filter((m) => m.status === 'finalizado');

  finishedMatches.forEach((match) => {
    const teamA = standings.get(match.team_a_id);
    const teamB = standings.get(match.team_b_id);

    if (!teamA || !teamB) return;

    // Contar sets ganados
    let setsA = 0;
    let setsB = 0;

    if (match.set1_score_a !== null && match.set1_score_b !== null) {
      setsA += match.set1_score_a > match.set1_score_b ? 1 : 0;
      setsB += match.set1_score_b > match.set1_score_a ? 1 : 0;
    }

    if (match.set2_score_a !== null && match.set2_score_b !== null) {
      setsA += match.set2_score_a > match.set2_score_b ? 1 : 0;
      setsB += match.set2_score_b > match.set2_score_a ? 1 : 0;
    }

    if (match.set3_score_a !== null && match.set3_score_b !== null) {
      setsA += match.set3_score_a > match.set3_score_b ? 1 : 0;
      setsB += match.set3_score_b > match.set3_score_a ? 1 : 0;
    }

    // Sumar puntos totales
    const puntosA =
      (match.set1_score_a || 0) +
      (match.set2_score_a || 0) +
      (match.set3_score_a || 0);

    const puntosB =
      (match.set1_score_b || 0) +
      (match.set2_score_b || 0) +
      (match.set3_score_b || 0);

    // Determinar ganador (quien gane 2 sets)
    const ganadorA = setsA > setsB;

    // Actualizar Team A
    teamA.partidos_jugados += 1;
    teamA.partidos_ganados += ganadorA ? 1 : 0;
    teamA.partidos_perdidos += ganadorA ? 0 : 1;
    teamA.sets_favor += setsA;
    teamA.sets_contra += setsB;
    teamA.puntos_favor += puntosA;
    teamA.puntos_contra += puntosB;

    // Actualizar Team B
    teamB.partidos_jugados += 1;
    teamB.partidos_ganados += ganadorA ? 0 : 1;
    teamB.partidos_perdidos += ganadorA ? 1 : 0;
    teamB.sets_favor += setsB;
    teamB.sets_contra += setsA;
    teamB.puntos_favor += puntosB;
    teamB.puntos_contra += puntosA;
  });

  // Calcular ratios
  standings.forEach((standing) => {
    standing.ratio_sets =
      standing.sets_contra === 0
        ? standing.sets_favor
        : parseFloat((standing.sets_favor / standing.sets_contra).toFixed(3));

    standing.ratio_puntos =
      standing.puntos_contra === 0
        ? standing.puntos_favor
        : parseFloat(
          (standing.puntos_favor / standing.puntos_contra).toFixed(3)
        );
  });

  // Convertir a array para ordenar
  const standingsArray = Array.from(standings.values());

  // Ordenar según criterios FIVB
  standingsArray.sort((a, b) => {
    // 1. Partidos Ganados
    if (a.partidos_ganados !== b.partidos_ganados) {
      return b.partidos_ganados - a.partidos_ganados;
    }

    // 2. Ratio de Sets
    if (a.ratio_sets !== b.ratio_sets) {
      return b.ratio_sets - a.ratio_sets;
    }

    // 3. Ratio de Puntos
    if (a.ratio_puntos !== b.ratio_puntos) {
      return b.ratio_puntos - a.ratio_puntos;
    }

    // 4. Enfrentamiento directo
    const headToHead = getHeadToHeadResult(a.team_id, b.team_id, finishedMatches);
    if (headToHead !== 0) {
      return headToHead;
    }

    // 5. Si todo es igual, mantener orden alfabético
    return a.team.player1.nombre.localeCompare(b.team.player1.nombre);
  });

  // Asignar posiciones
  standingsArray.forEach((standing, index) => {
    standing.posicion = index + 1;
  });

  return standingsArray;
}

/**
 * Determina el resultado del enfrentamiento directo entre dos equipos
 * Retorna: 1 si teamA ganó, -1 si teamB ganó, 0 si empate o no hay enfrentamiento
 */
function getHeadToHeadResult(
  teamAId: string,
  teamBId: string,
  matches: Match[]
): number {
  const directMatch = matches.find(
    (m) =>
      (m.team_a_id === teamAId && m.team_b_id === teamBId) ||
      (m.team_a_id === teamBId && m.team_b_id === teamAId)
  );

  if (!directMatch || !directMatch.winner_id) return 0;

  if (directMatch.winner_id === teamAId) return -1; // teamA debe estar arriba
  if (directMatch.winner_id === teamBId) return 1; // teamB debe estar arriba

  return 0;
}

/**
 * Determina el ganador de un partido basado en los sets
 */
export function determineMatchWinner(match: Match): string | null {
  if (
    match.set1_score_a === null ||
    match.set1_score_b === null ||
    match.set2_score_a === null ||
    match.set2_score_b === null
  ) {
    return null;
  }

  let setsA = 0;
  let setsB = 0;

  // Set 1
  setsA += match.set1_score_a > match.set1_score_b ? 1 : 0;
  setsB += match.set1_score_b > match.set1_score_a ? 1 : 0;

  // Set 2
  setsA += match.set2_score_a > match.set2_score_b ? 1 : 0;
  setsB += match.set2_score_b > match.set2_score_a ? 1 : 0;

  // Set 3 (si existe)
  if (match.set3_score_a !== null && match.set3_score_b !== null) {
    setsA += match.set3_score_a > match.set3_score_b ? 1 : 0;
    setsB += match.set3_score_b > match.set3_score_a ? 1 : 0;
  }

  // Quien gane 2 sets, gana el partido
  if (setsA >= 2) return match.team_a_id;
  if (setsB >= 2) return match.team_b_id;

  return null;
}

/**
 * Valida si un score de set es válido
 * Reglas: mínimo 21 puntos, diferencia mínima de 2
 */
export function validateSetScore(scoreA: number, scoreB: number): boolean {
  // Ambos puntajes deben ser no negativos
  if (scoreA < 0 || scoreB < 0) return false;

  // El ganador debe tener al menos 21 puntos
  const maxScore = Math.max(scoreA, scoreB);
  if (maxScore < 21) return false;

  // Debe haber diferencia de al menos 2 puntos
  const difference = Math.abs(scoreA - scoreB);
  if (difference < 2) return false;

  // Si hay más de 21 puntos, debe ser por ventaja de 2
  if (maxScore > 21) {
    return difference === 2;
  }

  return true;
}

/**
 * Genera fixture round-robin para un grupo
 */
export function generateRoundRobinFixture(teamIds: string[]): [string, string][] {
  const matches: [string, string][] = [];
  const n = teamIds.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matches.push([teamIds[i], teamIds[j]]);
    }
  }

  return matches;
}
