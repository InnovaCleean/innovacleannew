import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Layout } from '../components/Layout';
import { formatCurrency, formatDate, getCDMXFirstDayOfMonth, getCDMXDate, parseCDMXDate } from '../lib/utils';
import { Expense } from '../types';
import { Plus, Trash2, X, DollarSign, Tag, User, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Edit2 } from 'lucide-react';

export default function Expenses() {
    const expenses = useStore((state) => state.expenses);
    const addExpense = useStore((state) => state.addExpense);
    const updateExpense = useStore((state) => state.updateExpense);
    const deleteExpense = useStore((state) => state.deleteExpense);
    const user = useStore((state) => state.user);
    // const settings = useStore((state) => state.settings); // Removed unused variable

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [startDate, setStartDate] = useState(getCDMXFirstDayOfMonth());
    const [endDate, setEndDate] = useState(getCDMXDate());
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const [newExpense, setNewExpense] = useState<Partial<Expense> & { paymentMethod: string }>({
        description: '',
        amount: 0,
        type: 'variable',
        category: 'General',
        date: new Date().toLocaleDateString('en-CA'), // Initial view value, but we'll send full ISO on submit
        paymentMethod: 'cash'
    });

    // Access check: Admin and Seller allowed (Seller: Capture only)
    if (!user) return null;

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (!sortConfig || sortConfig.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-primary-500 transition-colors" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-primary-600" /> : <ArrowDown className="w-3 h-3 text-primary-600" />;
    };

    const filteredExpenses = React.useMemo(() => {
        const startDay = parseCDMXDate(startDate);
        startDay.setHours(0, 0, 0, 0);
        const endDay = parseCDMXDate(endDate);
        endDay.setHours(23, 59, 59, 999);

        let result = expenses.filter(e => {
            const date = parseCDMXDate(e.date);
            const matchesDate = date >= startDay && date <= endDay;
            const matchesSearch = searchTerm === '' || e.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesDate && matchesSearch;
        });

        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = (a as any)[sortConfig.key];
                const bValue = (b as any)[sortConfig.key];

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            // Default sort: Date desc
            result.sort((a, b) => parseCDMXDate(b.date).getTime() - parseCDMXDate(a.date).getTime());
        }
        return result;
    }, [expenses, startDate, endDate, sortConfig, searchTerm]);

    const handleOpenModal = (expense?: Expense) => {
        if (expense) {
            setEditingExpense(expense);
            // Parse existing description to find payment method tag
            let method = 'cash';
            let desc = expense.description;
            if (desc.includes('[Pago: Tarjeta]')) {
                method = 'card_debit'; // Defaulting to debit, we can't know for sure unless we store it distinctly. Or 'card' generic.
                desc = desc.replace(' [Pago: Tarjeta]', '');
            } else if (desc.includes('[Pago: Transferencia]')) {
                method = 'transfer';
                desc = desc.replace(' [Pago: Transferencia]', '');
            }

            setNewExpense({
                ...expense,
                description: desc,
                amount: expense.amount,
                type: expense.type,
                category: expense.category,
                date: new Date(expense.date).toLocaleDateString('en-CA'),
                paymentMethod: method
            });
        } else {
            setEditingExpense(null);
            setNewExpense({
                description: '',
                amount: 0,
                type: 'variable',
                category: 'General',
                date: new Date().toLocaleDateString('en-CA'),
                paymentMethod: 'cash'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExpense.description || !newExpense.amount) return;

        // Append payment method if not cash
        let finalDesc = newExpense.description;
        if (newExpense.paymentMethod !== 'cash') {
            const methodLabel = newExpense.paymentMethod === 'transfer' ? 'Transferencia' : 'Tarjeta';
            finalDesc += ` [Pago: ${methodLabel}]`;
        }

        // Date Handling Logic:
        // 1. If editing and date hasn't changed (YYYY-MM-DD match), keep original ISO.
        // 2. If new/changed to today, use current time.
        // 3. If changed to specific date, use noon to avoid timezone shifts.

        let finalDateStr = newExpense.date || '';
        const nowLocal = new Date();
        const todayLocalStr = nowLocal.toLocaleDateString('en-CA');

        // Check if we are editing and best effort check if date input value matches the original date part
        const isEditingAndDateUnchanged = editingExpense &&
            newExpense.date === new Date(editingExpense.date).toLocaleDateString('en-CA');

        if (isEditingAndDateUnchanged && editingExpense) {
            // Keep original exact timestamp
            finalDateStr = editingExpense.date;
        } else if (newExpense.date === todayLocalStr) {
            // Use current ISO string
            finalDateStr = nowLocal.toISOString();
        } else {
            // Force mid-day local to prevent rolling offset issues
            const midDay = new Date(`${newExpense.date}T12:00:00`);
            finalDateStr = midDay.toISOString();
        }

        if (editingExpense) {
            updateExpense(editingExpense.id, {
                ...newExpense,
                description: finalDesc,
                date: finalDateStr
            } as Expense);
            alert('Gasto actualizado correctamente');
        } else {
            await addExpense({
                ...newExpense,
                description: finalDesc,
                userId: user.id || '00000000-0000-0000-0000-000000000000',
                userName: user.name || 'Usuario',
                date: finalDateStr
            } as Expense);
            alert('Gasto registrado exitosamente');
        }

        setIsModalOpen(false);
        setEditingExpense(null);
        setNewExpense({
            description: '',
            amount: 0,
            type: 'variable',
            category: 'General',
            date: new Date().toLocaleDateString('en-CA'),
            paymentMethod: 'cash'
        });
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Eliminar este gasto?')) {
            deleteExpense(id);
        }
    };

    return (
        <Layout>
            <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] flex flex-col">
                <div className="flex-none pb-4 bg-slate-50 space-y-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-slate-800">Gastos</h1>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-bold"
                        >
                            <Plus className="w-4 h-4" />
                            REGISTRAR GASTO
                        </button>
                    </div>

                    {/* Filters Bar */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex flex-col lg:flex-row gap-3 items-end">
                            {/* Search First (Left) */}
                            <div className="flex-1 w-full lg:w-auto">
                                <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1 mb-1">
                                    <Tag className="w-3 h-3" /> Buscar
                                </label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Descripción..."
                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 font-bold"
                                />
                            </div>

                            {/* Date Group (Right) */}
                            <div className="flex gap-2 w-full lg:w-auto items-end">
                                <div className="space-y-1 flex-1 lg:w-40">
                                    <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1">
                                        <Calendar className="w-3 h-3" /> Desde
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 font-bold"
                                    />
                                </div>
                                <div className="pb-2 text-slate-400 font-bold">-</div>
                                <div className="space-y-1 flex-1 lg:w-40">
                                    <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1">
                                        <Calendar className="w-3 h-3" /> Hasta
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-slate-50">
                    <table className="w-full text-left text-sm border-separate border-spacing-0">
                        <thead className="bg-primary-600 text-white font-medium sticky top-0 z-10 shadow-md">
                            <tr>
                                <th onClick={() => handleSort('date')} className="px-6 py-4 border-b border-primary-700 cursor-pointer group hover:bg-primary-700 transition-colors">
                                    <div className="flex items-center gap-2">
                                        Fecha <SortIcon columnKey="date" />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('description')} className="px-6 py-4 border-b border-primary-700 cursor-pointer group hover:bg-primary-700 transition-colors">
                                    <div className="flex items-center gap-2">
                                        Descripción <SortIcon columnKey="description" />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('category')} className="px-6 py-4 border-b border-primary-700 cursor-pointer group hover:bg-primary-700 transition-colors">
                                    <div className="flex items-center gap-2">
                                        Categoría <SortIcon columnKey="category" />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('type')} className="px-6 py-4 border-b border-primary-700 cursor-pointer group hover:bg-primary-700 transition-colors">
                                    <div className="flex items-center gap-2">
                                        Tipo <SortIcon columnKey="type" />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('userName')} className="px-6 py-4 border-b border-primary-700 cursor-pointer group hover:bg-primary-700 transition-colors">
                                    <div className="flex items-center gap-2">
                                        Usuario <SortIcon columnKey="userName" />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('amount')} className="px-6 py-4 border-b border-primary-700 cursor-pointer group hover:bg-primary-700 transition-colors text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        Monto <SortIcon columnKey="amount" />
                                    </div>
                                </th>
                                {(user.role === 'admin') && <th className="px-6 py-4 border-b border-primary-700 text-center">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                                        No hay gastos registrados en este periodo.
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                            {formatDate(expense.date)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {expense.description}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                                <Tag className="w-3 h-3 mr-1" />
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${expense.type === 'fijo' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                                {expense.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {expense.userName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-700">
                                            {formatCurrency(expense.amount)}
                                        </td>
                                        {(user.role === 'admin') && (
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(expense)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Editar Gasto"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(expense.id)}
                                                        className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                                                        title="Eliminar Gasto"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all">
                            <div className="bg-primary-600 p-4 flex justify-between items-center text-white">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <DollarSign className="w-5 h-5" />
                                    {editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="hover:bg-primary-700 p-1 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                                    <input
                                        type="text"
                                        value={newExpense.description}
                                        onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300"
                                        placeholder="Ej. Renta del mes"
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monto</label>
                                        <input
                                            type="number"
                                            value={newExpense.amount === 0 ? '' : newExpense.amount}
                                            onChange={e => {
                                                const val = e.target.value;
                                                // Prevent negative inputs
                                                if (val.includes('-')) return;
                                                setNewExpense({ ...newExpense, amount: val === '' ? 0 : parseFloat(val) })
                                            }}
                                            min="0"
                                            step="0.01"
                                            onKeyDown={(e) => {
                                                if (e.key === '-' || e.key === 'e') e.preventDefault();
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-700"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                                        <select
                                            value={newExpense.type}
                                            onChange={e => setNewExpense({ ...newExpense, type: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        >
                                            <option value="variable">Variable</option>
                                            <option value="fijo">Fijo</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Payment Method Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Método de Pago</label>
                                    <select
                                        value={newExpense.paymentMethod}
                                        onChange={e => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    >
                                        <option value="cash">EFECTIVO 💵</option>
                                        <option value="transfer">TRANSFERENCIA 🏦</option>
                                        <option value="card_debit">TARJETA DEBITO 💳</option>
                                        <option value="card_credit">TARJETA CREDITO 💳</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                                        <input
                                            type="text"
                                            value={newExpense.category}
                                            onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="General"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                                        <input
                                            type="date"
                                            value={newExpense.date}
                                            onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-lg shadow-primary-500/20 transition-all"
                                    >
                                        Guardar Gasto
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
