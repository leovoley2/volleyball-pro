// src/components/admin/TournamentManager.tsx
import React, { useState } from 'react';
import {
    useTournaments,
    useCreateTournament,
    useUpdateTournament,
    useDeleteTournament,
} from '../../hooks/useTournaments';
import {
    Tournament,
    CreateTournamentInput,
    CATEGORIES,
    GENDERS,
    TOURNAMENT_STATUS,
} from '../../types/database';
import { PlusCircle, Calendar, MapPin, X, Save, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const EMPTY_FORM: CreateTournamentInput = {
    nombre: '',
    sede: '',
    fecha_inicio: '',
    categoria: 'U15',
    genero: 'M',
    numero_grupos: 2,
};

interface TournamentManagerProps {
    onSelectTournament: (id: string) => void;
}

export const TournamentManager: React.FC<TournamentManagerProps> = ({ onSelectTournament }) => {
    const { data: tournaments, isLoading } = useTournaments();
    const createTournament = useCreateTournament();
    const updateTournament = useUpdateTournament();
    const deleteTournament = useDeleteTournament();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CreateTournamentInput>(EMPTY_FORM);
    const [formError, setFormError] = useState('');

    // ── Abrir formulario para CREAR ──
    const handleOpenCreate = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setFormError('');
        setShowForm(true);
    };

    // ── Abrir formulario para EDITAR ──
    const handleOpenEdit = (t: Tournament) => {
        setForm({
            nombre: t.nombre,
            sede: t.sede ?? '',
            fecha_inicio: t.fecha_inicio,
            categoria: t.categoria,
            genero: t.genero,
            numero_grupos: t.numero_grupos,
        });
        setEditingId(t.id);
        setFormError('');
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormError('');
    };

    // ── Guardar (crear o editar) ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        try {
            if (editingId) {
                await updateTournament.mutateAsync({ id: editingId, updates: form });
            } else {
                await createTournament.mutateAsync(form);
            }
            handleCloseForm();
        } catch (err: any) {
            setFormError(err.message || 'Error al guardar el torneo.');
        }
    };

    // ── Cambiar estado ──
    const handleChangeStatus = async (tournament: Tournament, newStatus: Tournament['estado']) => {
        await updateTournament.mutateAsync({
            id: tournament.id,
            updates: { estado: newStatus },
        });
    };

    // ── Eliminar ──
    const handleDelete = async (t: Tournament) => {
        if (
            !confirm(
                `¿Eliminar el torneo "${t.nombre}"?\n\nEsta acción también eliminará los grupos, partidos y equipos asociados. No se puede deshacer.`
            )
        )
            return;
        try {
            await deleteTournament.mutateAsync(t.id);
        } catch (err: any) {
            alert(err.message || 'Error al eliminar el torneo.');
        }
    };

    const isPending = createTournament.isPending || updateTournament.isPending;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                    Torneos ({(tournaments || []).length})
                </h2>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all shadow-sm"
                >
                    <PlusCircle size={18} /> Nuevo Torneo
                </button>
            </div>

            {/* Formulario crear / editar */}
            {showForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">
                            {editingId ? 'Editar Torneo' : 'Crear Torneo'}
                        </h3>
                        <button onClick={handleCloseForm}>
                            <X size={20} className="text-gray-400 hover:text-gray-600" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Nombre del Torneo *
                            </label>
                            <input
                                required
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                placeholder="Ej: Etapa 1 - Lima 2026"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                        </div>
                        {/* Sede */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Sede
                            </label>
                            <input
                                value={form.sede || ''}
                                onChange={(e) => setForm({ ...form, sede: e.target.value })}
                                placeholder="Playa Costa Verde"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                        </div>
                        {/* Fecha */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Fecha de Inicio *
                            </label>
                            <input
                                required
                                type="date"
                                value={form.fecha_inicio}
                                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                        </div>
                        {/* Categoría */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Categoría *
                            </label>
                            <select
                                value={form.categoria}
                                onChange={(e) => setForm({ ...form, categoria: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* Género */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Género *
                            </label>
                            <select
                                value={form.genero}
                                onChange={(e) => setForm({ ...form, genero: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            >
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                            </select>
                        </div>
                        {/* Grupos */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Número de Grupos *
                            </label>
                            <input
                                required
                                type="number"
                                min="1"
                                max="10"
                                value={form.numero_grupos}
                                onChange={(e) =>
                                    setForm({ ...form, numero_grupos: Number(e.target.value) })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                        </div>
                        {/* Error */}
                        {formError && (
                            <div className="sm:col-span-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm">
                                {formError}
                            </div>
                        )}
                        {/* Botones */}
                        <div className="sm:col-span-2 flex gap-2">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-all disabled:opacity-60"
                            >
                                <Save size={16} />
                                {isPending
                                    ? 'Guardando...'
                                    : editingId
                                        ? 'Guardar Cambios'
                                        : 'Crear Torneo'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCloseForm}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold text-sm"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista de torneos */}
            <div className="space-y-3">
                {(tournaments || []).length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        No hay torneos. ¡Crea el primero!
                    </div>
                ) : (
                    (tournaments || []).map((t) => (
                        <div
                            key={t.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                        >
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="font-bold text-gray-900">{t.nombre}</h3>
                                        <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                            {t.categoria} {GENDERS[t.genero]}
                                        </span>
                                        <span
                                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.estado === 'grupos'
                                                    ? 'bg-green-100 text-green-700'
                                                    : t.estado === 'playoffs'
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : t.estado === 'finalizado'
                                                            ? 'bg-gray-100 text-gray-600'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                }`}
                                        >
                                            {TOURNAMENT_STATUS[t.estado]}
                                        </span>
                                    </div>
                                    <div className="flex gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={11} />
                                            {format(
                                                new Date(t.fecha_inicio + 'T00:00:00'),
                                                'dd MMM yyyy',
                                                { locale: es }
                                            )}
                                        </span>
                                        {t.sede && (
                                            <span className="flex items-center gap-1">
                                                <MapPin size={11} /> {t.sede}
                                            </span>
                                        )}
                                        <span>{t.numero_grupos} grupos</span>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Cambiar estado (solo en inscripcion) */}
                                    {t.estado === 'inscripcion' && (
                                        <select
                                            value={t.estado}
                                            onChange={(e) =>
                                                handleChangeStatus(t, e.target.value as any)
                                            }
                                            className="text-xs border border-gray-300 rounded-lg px-2 py-1"
                                        >
                                            <option value="inscripcion">Inscripción</option>
                                            <option value="grupos">Iniciar Grupos</option>
                                            <option value="playoffs">Playoffs</option>
                                            <option value="finalizado">Finalizar</option>
                                        </select>
                                    )}

                                    {/* Editar */}
                                    <button
                                        onClick={() => handleOpenEdit(t)}
                                        title="Editar torneo"
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={15} />
                                    </button>

                                    {/* Eliminar */}
                                    <button
                                        onClick={() => handleDelete(t)}
                                        disabled={deleteTournament.isPending}
                                        title="Eliminar torneo"
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                                    >
                                        <Trash2 size={15} />
                                    </button>

                                    {/* Gestionar */}
                                    <button
                                        onClick={() => onSelectTournament(t.id)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                                    >
                                        Gestionar <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
