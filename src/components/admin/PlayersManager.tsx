// src/components/admin/PlayersManager.tsx
import React, { useState } from 'react';
import { usePlayers, useCreatePlayer, useUpdatePlayer, useDeletePlayer } from '../../hooks/usePlayers';
import { Player, CreatePlayerInput, CATEGORIES, GENDERS } from '../../types/database';
import { UserPlus, Edit2, Trash2, Search, X, Save } from 'lucide-react';

const EMPTY_FORM: CreatePlayerInput = {
    nombre: '',
    apellido: '',
    dni: '',
    fecha_nacimiento: '',
    genero: 'M',
};

export const PlayersManager: React.FC = () => {
    const { data: players, isLoading } = usePlayers();
    const createPlayer = useCreatePlayer();
    const updatePlayer = useUpdatePlayer();
    const deletePlayer = useDeletePlayer();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CreatePlayerInput>(EMPTY_FORM);
    const [search, setSearch] = useState('');
    const [filterGenero, setFilterGenero] = useState<'all' | 'M' | 'F'>('all');
    const [filterCat, setFilterCat] = useState<string>('all');
    const [formError, setFormError] = useState('');

    const handleOpenCreate = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setFormError('');
        setShowForm(true);
    };

    const handleOpenEdit = (player: Player) => {
        setForm({
            nombre: player.nombre,
            apellido: player.apellido,
            dni: player.dni,
            fecha_nacimiento: player.fecha_nacimiento,
            genero: player.genero,
        });
        setEditingId(player.id);
        setFormError('');
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        try {
            if (editingId) {
                await updatePlayer.mutateAsync({ id: editingId, updates: form });
            } else {
                await createPlayer.mutateAsync(form);
            }
            setShowForm(false);
            setForm(EMPTY_FORM);
            setEditingId(null);
        } catch (err: any) {
            if (err.message?.includes('unique') || err.code === '23505') {
                setFormError('Ya existe un jugador con ese DNI.');
            } else {
                setFormError(err.message || 'Error al guardar el jugador.');
            }
        }
    };

    const handleDelete = async (player: Player) => {
        if (!confirm(`¿Eliminar a ${player.nombre} ${player.apellido}?`)) return;
        await deletePlayer.mutateAsync(player.id);
    };

    const filtered = (players || []).filter((p) => {
        const matchSearch =
            search === '' ||
            `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(search.toLowerCase());
        const matchGenero = filterGenero === 'all' || p.genero === filterGenero;
        const matchCat = filterCat === 'all' || p.categoria === filterCat;
        return matchSearch && matchGenero && matchCat;
    });

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
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Jugadores ({filtered.length})</h2>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all shadow-sm"
                >
                    <UserPlus size={18} /> Nuevo Jugador
                </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
                    />
                </div>
                <select
                    value={filterGenero}
                    onChange={(e) => setFilterGenero(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
                >
                    <option value="all">Todos los géneros</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                </select>
                <select
                    value={filterCat}
                    onChange={(e) => setFilterCat(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
                >
                    <option value="all">Todas las categorías</option>
                    {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            {/* Formulario */}
            {showForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">{editingId ? 'Editar Jugador' : 'Nuevo Jugador'}</h3>
                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
                            <input
                                required
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                placeholder="Juan"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Apellido *</label>
                            <input
                                required
                                value={form.apellido}
                                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                placeholder="Pérez"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">DNI *</label>
                            <input
                                required
                                value={form.dni}
                                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                placeholder="12345678"
                                maxLength={8}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Nacimiento *</label>
                            <input
                                required
                                type="date"
                                value={form.fecha_nacimiento}
                                onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Género *</label>
                            <select
                                value={form.genero}
                                onChange={(e) => setForm({ ...form, genero: e.target.value as 'M' | 'F' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            >
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                            </select>
                        </div>
                        {formError && (
                            <div className="sm:col-span-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm">
                                {formError}
                            </div>
                        )}
                        <div className="sm:col-span-2 flex gap-2">
                            <button
                                type="submit"
                                disabled={createPlayer.isPending || updatePlayer.isPending}
                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-all disabled:opacity-60"
                            >
                                <Save size={16} /> {editingId ? 'Actualizar' : 'Crear Jugador'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold text-sm"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabla */}
            {filtered.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    {search || filterGenero !== 'all' || filterCat !== 'all'
                        ? 'No se encontraron jugadores con esos filtros.'
                        : 'No hay jugadores registrados. ¡Crea el primero!'}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Jugador</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">DNI</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">Categoría</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">Género</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">Ranking</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((player) => (
                                <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-gray-900">
                                            {player.nombre} {player.apellido}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(player.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-PE')}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-gray-700">{player.dni}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                            {player.categoria || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${player.genero === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                                            }`}>
                                            {GENDERS[player.genero]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="font-bold text-orange-600">{player.ranking_points_total}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(player)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(player)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
