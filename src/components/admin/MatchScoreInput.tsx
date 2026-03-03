// src/components/admin/MatchScoreInput.tsx
import React, { useState } from 'react';
import { MatchWithTeams } from '../../types/database';
import { useUpdateMatchScore } from '../../hooks/useMatches';
import { validateSetScore } from '../../utils/standings';
import { Save, X, CheckCircle, AlertCircle } from 'lucide-react';

interface MatchScoreInputProps {
  match: MatchWithTeams;
  onClose?: () => void;
}

export const MatchScoreInput: React.FC<MatchScoreInputProps> = ({ match, onClose }) => {
  const updateScore = useUpdateMatchScore();

  const [scores, setScores] = useState({
    set1_a: match.set1_score_a ?? '',
    set1_b: match.set1_score_b ?? '',
    set2_a: match.set2_score_a ?? '',
    set2_b: match.set2_score_b ?? '',
    set3_a: match.set3_score_a ?? '',
    set3_b: match.set3_score_b ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleScoreChange = (set: string, team: string, value: string) => {
    const numValue = value === '' ? '' : parseInt(value);
    setScores((prev) => ({
      ...prev,
      [`${set}_${team}`]: numValue,
    }));

    // Limpiar error cuando el usuario empieza a escribir
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`${set}_${team}`];
      return newErrors;
    });
  };

  const validateScores = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar Set 1 (obligatorio)
    if (scores.set1_a === '' || scores.set1_b === '') {
      newErrors.set1 = 'El set 1 es obligatorio';
    } else if (!validateSetScore(Number(scores.set1_a), Number(scores.set1_b))) {
      newErrors.set1 = 'Score inválido (mín. 21, diferencia 2)';
    }

    // Validar Set 2 (obligatorio)
    if (scores.set2_a === '' || scores.set2_b === '') {
      newErrors.set2 = 'El set 2 es obligatorio';
    } else if (!validateSetScore(Number(scores.set2_a), Number(scores.set2_b))) {
      newErrors.set2 = 'Score inválido (mín. 21, diferencia 2)';
    }

    // Validar Set 3 (opcional, pero si se ingresa debe ser válido)
    if (scores.set3_a !== '' || scores.set3_b !== '') {
      if (scores.set3_a === '' || scores.set3_b === '') {
        newErrors.set3 = 'Completa ambos puntajes del set 3';
      } else if (!validateSetScore(Number(scores.set3_a), Number(scores.set3_b))) {
        newErrors.set3 = 'Score inválido (mín. 15, diferencia 2)';
      }
    }

    // Validar lógica de sets ganados
    if (Object.keys(newErrors).length === 0) {
      let setsTeamA = 0;
      let setsTeamB = 0;

      if (Number(scores.set1_a) > Number(scores.set1_b)) setsTeamA++;
      else setsTeamB++;

      if (Number(scores.set2_a) > Number(scores.set2_b)) setsTeamA++;
      else setsTeamB++;

      // Si ya hay un ganador después de 2 sets, no debe haber set 3
      if ((setsTeamA === 2 || setsTeamB === 2) && scores.set3_a !== '') {
        newErrors.set3 = 'No debe haber set 3 si ya hay ganador';
      }

      // Si está 1-1, debe haber set 3
      if (setsTeamA === 1 && setsTeamB === 1 && scores.set3_a === '') {
        newErrors.set3 = 'El set 3 es necesario (1-1)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateScores()) {
      return;
    }

    try {
      await updateScore.mutateAsync({
        match_id: match.id,
        set1_score_a: Number(scores.set1_a),
        set1_score_b: Number(scores.set1_b),
        set2_score_a: Number(scores.set2_a),
        set2_score_b: Number(scores.set2_b),
        set3_score_a: scores.set3_a !== '' ? Number(scores.set3_a) : undefined,
        set3_score_b: scores.set3_b !== '' ? Number(scores.set3_b) : undefined,
      });

      if (onClose) onClose();
    } catch (error) {
      console.error('Error updating score:', error);
      alert('Error al guardar el resultado');
    }
  };

  const teamAName = `${match.team_a.player1.nombre} ${match.team_a.player1.apellido} / ${match.team_a.player2.nombre} ${match.team_a.player2.apellido}`;
  const teamBName = `${match.team_b.player1.nombre} ${match.team_b.player1.apellido} / ${match.team_b.player2.nombre} ${match.team_b.player2.apellido}`;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">Ingresar Resultado</h3>
          <p className="text-sm text-gray-600">
            {match.group ? `Grupo ${match.group.name}` : 'Playoff'}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header con nombres de equipos */}
        <div className="grid grid-cols-3 gap-4 items-center bg-gray-50 p-4 rounded-lg">
          <div className="text-center">
            <div className="font-bold text-gray-800 text-sm">{teamAName}</div>
          </div>
          <div className="text-center">
            <span className="text-xs text-gray-500 font-semibold">VS</span>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-800 text-sm">{teamBName}</div>
          </div>
        </div>

        {/* Set 1 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Set 1 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-4 items-center">
            <input
              type="number"
              min="0"
              max="99"
              value={scores.set1_a}
              onChange={(e) => handleScoreChange('set1', 'a', e.target.value)}
              className={`px-4 py-3 border-2 rounded-lg text-center text-2xl font-bold focus:ring-2 focus:ring-blue-500 ${
                errors.set1 ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
            />
            <div className="text-center text-gray-400 font-bold">-</div>
            <input
              type="number"
              min="0"
              max="99"
              value={scores.set1_b}
              onChange={(e) => handleScoreChange('set1', 'b', e.target.value)}
              className={`px-4 py-3 border-2 rounded-lg text-center text-2xl font-bold focus:ring-2 focus:ring-blue-500 ${
                errors.set1 ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
            />
          </div>
          {errors.set1 && (
            <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              <span>{errors.set1}</span>
            </div>
          )}
        </div>

        {/* Set 2 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Set 2 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-4 items-center">
            <input
              type="number"
              min="0"
              max="99"
              value={scores.set2_a}
              onChange={(e) => handleScoreChange('set2', 'a', e.target.value)}
              className={`px-4 py-3 border-2 rounded-lg text-center text-2xl font-bold focus:ring-2 focus:ring-blue-500 ${
                errors.set2 ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
            />
            <div className="text-center text-gray-400 font-bold">-</div>
            <input
              type="number"
              min="0"
              max="99"
              value={scores.set2_b}
              onChange={(e) => handleScoreChange('set2', 'b', e.target.value)}
              className={`px-4 py-3 border-2 rounded-lg text-center text-2xl font-bold focus:ring-2 focus:ring-blue-500 ${
                errors.set2 ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
            />
          </div>
          {errors.set2 && (
            <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              <span>{errors.set2}</span>
            </div>
          )}
        </div>

        {/* Set 3 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Set 3 (Desempate)
            <span className="text-gray-500 text-xs ml-2 font-normal">Opcional</span>
          </label>
          <div className="grid grid-cols-3 gap-4 items-center">
            <input
              type="number"
              min="0"
              max="99"
              value={scores.set3_a}
              onChange={(e) => handleScoreChange('set3', 'a', e.target.value)}
              className={`px-4 py-3 border-2 rounded-lg text-center text-2xl font-bold focus:ring-2 focus:ring-blue-500 ${
                errors.set3 ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
            />
            <div className="text-center text-gray-400 font-bold">-</div>
            <input
              type="number"
              min="0"
              max="99"
              value={scores.set3_b}
              onChange={(e) => handleScoreChange('set3', 'b', e.target.value)}
              className={`px-4 py-3 border-2 rounded-lg text-center text-2xl font-bold focus:ring-2 focus:ring-blue-500 ${
                errors.set3 ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
            />
          </div>
          {errors.set3 && (
            <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              <span>{errors.set3}</span>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={updateScore.isPending}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {updateScore.isPending ? (
              <>Guardando...</>
            ) : (
              <>
                <CheckCircle size={20} />
                Guardar Resultado
              </>
            )}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition-all"
            >
              Cancelar
            </button>
          )}
        </div>

        {/* Ayuda */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-bold text-blue-800 mb-2">💡 Reglas:</h4>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>Sets 1 y 2 son obligatorios (mínimo 21 pts, diferencia 2)</li>
            <li>Set 3 solo si queda 1-1 (mínimo 15 pts, diferencia 2)</li>
            <li>La tabla se actualizará automáticamente</li>
          </ul>
        </div>
      </form>
    </div>
  );
};
