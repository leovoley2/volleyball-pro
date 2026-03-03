// src/components/public/StandingsTable.tsx
import React from 'react';
import { TeamStanding } from '../../types/database';
import { Trophy, Medal, Award } from 'lucide-react';

interface StandingsTableProps {
  standings: TeamStanding[];
  groupName?: string;
  showGroupName?: boolean;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  groupName,
  showGroupName = true,
}) => {
  if (standings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay datos de posiciones disponibles
      </div>
    );
  }

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className="text-yellow-500" size={20} />;
    if (position === 2) return <Medal className="text-gray-400" size={20} />;
    if (position === 3) return <Award className="text-orange-600" size={20} />;
    return null;
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-yellow-50 border-l-4 border-yellow-500';
    if (position === 2) return 'bg-gray-50 border-l-4 border-gray-400';
    if (position === 3) return 'bg-orange-50 border-l-4 border-orange-500';
    return '';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {showGroupName && groupName && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
          <h3 className="text-xl font-bold">Grupo {groupName}</h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-3 py-3 text-left font-bold text-gray-700">Pos</th>
              <th className="px-3 py-3 text-left font-bold text-gray-700">Dupla</th>
              <th className="px-3 py-3 text-center font-bold text-gray-700">
                PJ
                <div className="text-xs font-normal text-gray-500">Jugados</div>
              </th>
              <th className="px-3 py-3 text-center font-bold text-gray-700">
                PG
                <div className="text-xs font-normal text-gray-500">Ganados</div>
              </th>
              <th className="px-3 py-3 text-center font-bold text-gray-700">
                PP
                <div className="text-xs font-normal text-gray-500">Perdidos</div>
              </th>
              <th className="px-3 py-3 text-center font-bold text-gray-700">
                SF
                <div className="text-xs font-normal text-gray-500">Sets +</div>
              </th>
              <th className="px-3 py-3 text-center font-bold text-gray-700">
                SC
                <div className="text-xs font-normal text-gray-500">Sets -</div>
              </th>
              <th className="px-3 py-3 text-center font-bold text-blue-700">
                R.Sets
                <div className="text-xs font-normal text-gray-500">Ratio</div>
              </th>
              <th className="px-3 py-3 text-center font-bold text-gray-700">
                PF
                <div className="text-xs font-normal text-gray-500">Pts +</div>
              </th>
              <th className="px-3 py-3 text-center font-bold text-gray-700">
                PC
                <div className="text-xs font-normal text-gray-500">Pts -</div>
              </th>
              <th className="px-3 py-3 text-center font-bold text-orange-700">
                R.Pts
                <div className="text-xs font-normal text-gray-500">Ratio</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {standings.map((standing) => (
              <tr
                key={standing.team_id}
                className={`hover:bg-gray-50 transition-colors ${getPositionColor(
                  standing.posicion
                )}`}
              >
                {/* Posición */}
                <td className="px-3 py-4">
                  <div className="flex items-center gap-2">
                    {getPositionIcon(standing.posicion)}
                    <span className="font-bold text-lg text-gray-800">
                      {standing.posicion}
                    </span>
                  </div>
                </td>

                {/* Dupla */}
                <td className="px-3 py-4">
                  <div className="font-semibold text-gray-900">
                    {standing.team.player1.nombre} {standing.team.player1.apellido}
                  </div>
                  <div className="text-sm text-gray-600">
                    {standing.team.player2.nombre} {standing.team.player2.apellido}
                  </div>
                </td>

                {/* Partidos Jugados */}
                <td className="px-3 py-4 text-center font-semibold text-gray-700">
                  {standing.partidos_jugados}
                </td>

                {/* Partidos Ganados */}
                <td className="px-3 py-4 text-center">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-bold">
                    {standing.partidos_ganados}
                  </span>
                </td>

                {/* Partidos Perdidos */}
                <td className="px-3 py-4 text-center">
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-bold">
                    {standing.partidos_perdidos}
                  </span>
                </td>

                {/* Sets Favor */}
                <td className="px-3 py-4 text-center font-semibold text-gray-700">
                  {standing.sets_favor}
                </td>

                {/* Sets Contra */}
                <td className="px-3 py-4 text-center font-semibold text-gray-700">
                  {standing.sets_contra}
                </td>

                {/* Ratio Sets */}
                <td className="px-3 py-4 text-center">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-bold">
                    {standing.ratio_sets.toFixed(3)}
                  </span>
                </td>

                {/* Puntos Favor */}
                <td className="px-3 py-4 text-center font-semibold text-gray-700">
                  {standing.puntos_favor}
                </td>

                {/* Puntos Contra */}
                <td className="px-3 py-4 text-center font-semibold text-gray-700">
                  {standing.puntos_contra}
                </td>

                {/* Ratio Puntos */}
                <td className="px-3 py-4 text-center">
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded font-bold">
                    {standing.ratio_puntos.toFixed(3)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leyenda de Criterios */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <h4 className="text-sm font-bold text-gray-700 mb-2">
          Criterios de Desempate (FIVB):
        </h4>
        <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
          <li>Partidos Ganados (PG)</li>
          <li>Ratio de Sets (Sets Favor / Sets Contra)</li>
          <li>Ratio de Puntos (Puntos Favor / Puntos Contra)</li>
          <li>Enfrentamiento directo</li>
        </ol>
      </div>
    </div>
  );
};
