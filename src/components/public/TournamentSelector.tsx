// src/components/public/TournamentSelector.tsx
import React from 'react';
import { Tournament, CATEGORIES, GENDERS, TOURNAMENT_STATUS } from '../../types/database';
import { Trophy, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TournamentSelectorProps {
    tournaments: Tournament[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export const TournamentSelector: React.FC<TournamentSelectorProps> = ({
    tournaments,
    selectedId,
    onSelect,
}) => {
    if (tournaments.length === 0) {
        return (
            <div className="text-center py-12">
                <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No hay torneos activos actualmente</p>
            </div>
        );
    }

    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((t) => (
                <button
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    className={`text-left p-5 rounded-xl border-2 transition-all hover:shadow-md ${selectedId === t.id
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                >
                    <div className="flex items-start justify-between mb-3">
                        <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${t.estado === 'en_vivo' || t.estado === 'grupos'
                                    ? 'bg-green-100 text-green-700'
                                    : t.estado === 'playoffs'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                        >
                            {TOURNAMENT_STATUS[t.estado]}
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {t.categoria} {GENDERS[t.genero]}
                        </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 leading-tight">{t.nombre}</h3>
                    <div className="space-y-1 text-xs text-gray-500">
                        {t.sede && (
                            <div className="flex items-center gap-1">
                                <MapPin size={12} />
                                <span>{t.sede}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>
                                {format(new Date(t.fecha_inicio + 'T00:00:00'), 'dd MMM yyyy', { locale: es })}
                            </span>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};
