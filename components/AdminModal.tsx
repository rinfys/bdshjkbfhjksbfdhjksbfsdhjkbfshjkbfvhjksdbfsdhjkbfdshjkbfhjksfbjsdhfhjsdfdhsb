import React, { useState } from 'react';
import { Player } from '../types';
import { X, Save, Trash2, Plus, Database, AlertCircle } from 'lucide-react';
import { updatePlayerInDb, addPlayerToDb, deletePlayerFromDb, seedDatabase } from '../firebase';
import { SEED_PLAYERS } from '../constants';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    players: Player[];
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, players }) => {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<Player>>({});

    if (!isOpen) return null;

    const handleEditClick = (player: Player) => {
        setEditingId(player.id);
        setEditForm({ ...player });
    };

    const handleSave = () => {
        if (editingId && editForm.name) {
            updatePlayerInDb(editForm as Player);
            setEditingId(null);
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this player?')) {
            deletePlayerFromDb(id);
        }
    };

    const handleAddNew = () => {
        // Generate a new ID (highest ID + 1)
        const newId = players.length > 0 ? Math.max(...players.map(p => p.id)) + 1 : 1;

        const newPlayer: Player = {
            id: newId,
            name: 'New Player',
            position: 'HS',
            teamColor: 'green',
            points: 0,
            price: 5.0,
            avgRating: 6.0,
            imageUrl: ''
        };

        addPlayerToDb(newPlayer);

        // Automatically enter edit mode for the new player
        setEditingId(newId);
        setEditForm(newPlayer);

        // Scroll to bottom (optional UI enhancement, but browser handles focus usually)
    };

    const handleSeed = () => {
        if (confirm('This will overwrite existing data with the default list. Continue?')) {
            seedDatabase(SEED_PLAYERS);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#29002d] w-full max-w-5xl rounded-2xl shadow-2xl border border-white/10 flex flex-col h-[85vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#29002d] to-[#37003c] rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-fpl-green/20 rounded-lg">
                            <Database className="text-fpl-green" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Database Manager</h2>
                            <p className="text-gray-400 text-sm">Add, Edit, or Remove Players from the global market.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="p-4 bg-[#200025] border-b border-white/5 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-3 py-2 rounded text-xs">
                        <AlertCircle size={14} />
                        <span>Changes here affect all users immediately.</span>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSeed}
                            className="px-4 py-2 text-red-300 text-xs font-bold rounded hover:bg-red-900/40 transition"
                        >
                            Reset Default Data
                        </button>
                        <button
                            onClick={handleAddNew}
                            className="flex items-center gap-2 bg-fpl-green text-fpl-purple px-6 py-2 rounded-lg font-bold hover:bg-white transition shadow-lg shadow-fpl-green/20"
                        >
                            <Plus size={18}/> Add New Player
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[#29002d] z-10 shadow-md">
                        <tr className="text-gray-400 border-b border-white/10 text-xs uppercase tracking-wider">
                            <th className="p-3">ID</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Pos</th>
                            <th className="p-3">Color</th>
                            <th className="p-3">Points</th>
                            <th className="p-3">Price (m)</th>
                            <th className="p-3">Rating</th>
                            <th className="p-3">Image URL</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="text-sm">
                        {players.map(player => {
                            const isEditing = editingId === player.id;
                            return (
                                <tr key={player.id} className={`border-b border-white/5 transition ${isEditing ? 'bg-white/5' : 'hover:bg-white/5'}`}>
                                    <td className="p-3 text-gray-500 font-mono text-xs">{player.id}</td>

                                    {/* NAME */}
                                    <td className="p-3">
                                        {isEditing ? (
                                            <input
                                                className="bg-black/40 text-white p-2 rounded w-full border border-fpl-green/50 focus:border-fpl-green outline-none"
                                                value={editForm.name}
                                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                                                placeholder="Player Name"
                                            />
                                        ) : <span className="font-bold">{player.name}</span>}
                                    </td>

                                    {/* POSITION */}
                                    <td className="p-3">
                                        {isEditing ? (
                                            <select
                                                className="bg-black/40 text-white p-2 rounded w-20 border border-white/20"
                                                value={editForm.position}
                                                onChange={e => setEditForm({...editForm, position: e.target.value as any})}
                                            >
                                                <option value="GK">GK</option>
                                                <option value="CB">CB</option>
                                                <option value="LW">LW</option>
                                                <option value="RW">RW</option>
                                                <option value="HS">HS</option>
                                            </select>
                                        ) : <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${player.position === 'GK' ? 'bg-yellow-600 text-black' : 'bg-gray-700 text-white'}`}>{player.position}</span>}
                                    </td>

                                    {/* COLOR */}
                                    <td className="p-3">
                                        {isEditing ? (
                                            <select
                                                className="bg-black/40 text-white p-2 rounded w-24 border border-white/20"
                                                value={editForm.teamColor}
                                                onChange={e => setEditForm({...editForm, teamColor: e.target.value as any})}
                                            >
                                                <option value="red">Red</option>
                                                <option value="blue">Blue</option>
                                                <option value="sky">Sky</option>
                                                <option value="green">Green</option>
                                                <option value="yellow">Yellow</option>
                                                <option value="purple">Purple</option>
                                                <option value="claret">Claret</option>
                                            </select>
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: player.teamColor === 'sky' ? 'skyblue' : player.teamColor }}></div>
                                        )}
                                    </td>

                                    {/* POINTS */}
                                    <td className="p-3">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="bg-black/40 text-white p-2 rounded w-16 border border-white/20 text-center"
                                                value={editForm.points}
                                                onChange={e => setEditForm({...editForm, points: Number(e.target.value)})}
                                            />
                                        ) : <span className="text-fpl-green font-bold">{player.points}</span>}
                                    </td>

                                    {/* PRICE */}
                                    <td className="p-3">
                                        {isEditing ? (
                                            <input
                                                type="number" step="0.1"
                                                className="bg-black/40 text-white p-2 rounded w-20 border border-white/20 text-center"
                                                value={editForm.price}
                                                onChange={e => setEditForm({...editForm, price: Number(e.target.value)})}
                                            />
                                        ) : <span>{player.price}</span>}
                                    </td>

                                    {/* RATING */}
                                    <td className="p-3 text-fpl-blue">
                                        {isEditing ? (
                                            <input
                                                type="number" step="0.1"
                                                className="bg-black/40 text-white p-2 rounded w-16 border border-white/20 text-center"
                                                value={editForm.avgRating}
                                                onChange={e => setEditForm({...editForm, avgRating: Number(e.target.value)})}
                                            />
                                        ) : player.avgRating}
                                    </td>

                                    {/* IMAGE */}
                                    <td className="p-3">
                                        {isEditing ? (
                                            <input
                                                className="bg-black/40 text-white p-2 rounded w-full border border-white/20 text-xs"
                                                placeholder="Image URL..."
                                                value={editForm.imageUrl || ''}
                                                onChange={e => setEditForm({...editForm, imageUrl: e.target.value})}
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden border border-white/10">
                                                {player.imageUrl && <img src={player.imageUrl} className="w-full h-full object-cover" />}
                                            </div>
                                        )}
                                    </td>

                                    {/* ACTIONS */}
                                    <td className="p-3 text-right">
                                        {isEditing ? (
                                            <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 bg-fpl-green text-fpl-purple font-bold rounded hover:bg-white transition shadow-lg shadow-green-500/20">
                                                <Save size={14} /> Save
                                            </button>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleEditClick(player)} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition" title="Edit">
                                                    <Database size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(player.id)} className="p-2 hover:bg-red-900/50 rounded text-red-400 hover:text-red-300 transition" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminModal;