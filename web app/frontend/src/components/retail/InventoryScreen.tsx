import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, Edit2, Trash2, AlertTriangle, Package,
    Loader2, X, Check, ArrowUpDown, Filter, Upload, ChevronDown
} from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { useToast } from '../web/Toast';

interface Product {
    id: string; name: string; sku?: string; barcode?: string; category?: string;
    sellingPriceNaira: number; costPriceNaira: number; quantity: number;
    lowStockThreshold: number; unit: string; isLowStock: boolean;
}

const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const UNITS = ['piece', 'kg', 'litre', 'carton', 'pack', 'box', 'dozen'];

export function InventoryScreen() {
    const toast = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterLowStock, setFilterLowStock] = useState(false);
    const [showModal, setShowModal] = useState<'create' | 'edit' | 'adjust' | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({ name: '', sku: '', barcode: '', category: '', sellingPrice: '', costPrice: '', quantity: '0', lowStockThreshold: '5', unit: 'piece' });
    const [adjustForm, setAdjustForm] = useState({ type: 'RESTOCK', quantityDelta: '', reason: '' });

    const loadProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const [pRes, cRes] = await Promise.all([
                inventoryApi.getProducts({ search: search || undefined, category: filterCategory || undefined, lowStock: filterLowStock || undefined }),
                inventoryApi.getCategories(),
            ]);
            setProducts(pRes.data);
            setCategories(cRes.data);
        } catch { toast.error('Failed to load inventory'); }
        finally { setIsLoading(false); }
    }, [search, filterCategory, filterLowStock]);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    const openCreate = () => {
        setForm({ name: '', sku: '', barcode: '', category: '', sellingPrice: '', costPrice: '', quantity: '0', lowStockThreshold: '5', unit: 'piece' });
        setSelectedProduct(null);
        setShowModal('create');
    };

    const openEdit = (p: Product) => {
        setSelectedProduct(p);
        setForm({
            name: p.name, sku: p.sku || '', barcode: p.barcode || '', category: p.category || '',
            sellingPrice: p.sellingPriceNaira.toString(), costPrice: p.costPriceNaira.toString(),
            quantity: p.quantity.toString(), lowStockThreshold: p.lowStockThreshold.toString(), unit: p.unit,
        });
        setShowModal('edit');
    };

    const openAdjust = (p: Product) => {
        setSelectedProduct(p);
        setAdjustForm({ type: 'RESTOCK', quantityDelta: '', reason: '' });
        setShowModal('adjust');
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Product name is required'); return; }
        setIsSaving(true);
        try {
            const payload = {
                name: form.name,
                sku: form.sku || undefined,
                barcode: form.barcode || undefined,
                category: form.category || undefined,
                sellingPrice: Math.round(parseFloat(form.sellingPrice || '0') * 100),
                costPrice: Math.round(parseFloat(form.costPrice || '0') * 100),
                quantity: parseInt(form.quantity || '0'),
                lowStockThreshold: parseInt(form.lowStockThreshold || '5'),
                unit: form.unit,
            };
            if (showModal === 'create') {
                await inventoryApi.createProduct(payload);
                toast.success('Product added to inventory');
            } else if (selectedProduct) {
                await inventoryApi.updateProduct(selectedProduct.id, payload);
                toast.success('Product updated');
            }
            setShowModal(null);
            loadProducts();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to save product');
        } finally { setIsSaving(false); }
    };

    const handleAdjust = async () => {
        if (!adjustForm.quantityDelta || !selectedProduct) return;
        setIsSaving(true);
        try {
            await inventoryApi.adjustStock(selectedProduct.id, {
                type: adjustForm.type,
                quantityDelta: parseInt(adjustForm.quantityDelta),
                reason: adjustForm.reason || undefined,
            });
            toast.success('Stock adjusted successfully');
            setShowModal(null);
            loadProducts();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to adjust stock');
        } finally { setIsSaving(false); }
    };

    const handleDelete = async (p: Product) => {
        setIsSaving(true);
        try {
            await inventoryApi.deleteProduct(p.id);
            toast.success(`"${p.name}" deleted`);
            loadProducts();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to delete product');
        } finally { setIsSaving(false); }
    };

    const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const res = await inventoryApi.importCSV(file);
            const { success, skipped, errors } = res.data;
            toast.success(`Imported ${success} products${skipped ? `, ${skipped} skipped` : ''}`);
            if (errors?.length) toast.warning(`${errors.length} errors encountered`);
            loadProducts();
        } catch (e: any) {
            toast.error('CSV import failed');
        }
        e.target.value = '';
    };

    const formRow = (label: string, key: keyof typeof form, type = 'text', prefix?: string) => (
        <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 uppercase tracking-wide">{label}</label>
            <div className="relative">
                {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">{prefix}</span>}
                <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className={`w-full bg-[#0F1117] border border-[#1E2535] rounded-xl py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#00D084] transition-colors ${prefix ? 'pl-7 pr-3' : 'px-3'}`}
                    placeholder={prefix ? '0.00' : ''}
                />
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[#F1F5F9]">Inventory</h1>
                    <p className="text-[#64748B] text-sm">{products.length} products</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-2 bg-[#1E2535] hover:bg-[#2A3548] text-[#94A3B8] px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                        <Upload size={15} /> Import CSV
                        <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
                    </label>
                    <button onClick={openCreate} className="flex items-center gap-2 bg-[#00D084] hover:bg-[#00b872] text-[#0F1117] font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
                        <Plus size={16} /> Add Product
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, SKU, or barcode..."
                        className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#00D084]"
                    />
                </div>
                <select
                    value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                    className="bg-[#161B27] border border-[#1E2535] rounded-xl px-3 py-2.5 text-sm text-[#94A3B8] focus:outline-none focus:border-[#00D084]"
                >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button
                    onClick={() => setFilterLowStock(f => !f)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${filterLowStock ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30' : 'bg-[#161B27] border border-[#1E2535] text-[#94A3B8] hover:border-[#F59E0B]/40'}`}
                >
                    <AlertTriangle size={14} /> Low Stock
                </button>
            </div>

            {/* Table */}
            <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#1E2535]">
                                {['Product', 'SKU', 'Category', 'Selling Price', 'Cost Price', 'Stock', 'Actions'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center py-12"><Loader2 className="inline animate-spin text-[#00D084]" size={24} /></td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-[#475569]">
                                    <Package size={36} className="mx-auto mb-3 opacity-30" />
                                    <p>No products found. Add your first product →</p>
                                </td></tr>
                            ) : products.map(p => (
                                <tr key={p.id} className="border-b border-[#1E2535] hover:bg-[#0F1117] transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="text-[#F1F5F9] font-medium">{p.name}</p>
                                        {p.barcode && <p className="text-[#475569] text-xs">{p.barcode}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-[#64748B]">{p.sku || '—'}</td>
                                    <td className="px-4 py-3">
                                        {p.category ? (
                                            <span className="bg-[#1E2535] text-[#94A3B8] px-2 py-0.5 rounded-md text-xs">{p.category}</span>
                                        ) : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-[#00D084] font-semibold">{fmt(p.sellingPriceNaira)}</td>
                                    <td className="px-4 py-3 text-[#64748B]">{fmt(p.costPriceNaira)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`font-bold ${p.isLowStock ? 'text-[#F59E0B]' : 'text-[#F1F5F9]'}`}>
                                            {p.quantity} {p.unit}
                                        </span>
                                        {p.isLowStock && <AlertTriangle size={12} className="inline ml-1 text-[#F59E0B]" />}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openAdjust(p)} title="Adjust stock" className="p-1.5 rounded-lg text-[#64748B] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors">
                                                <ArrowUpDown size={14} />
                                            </button>
                                            <button onClick={() => openEdit(p)} title="Edit" className="p-1.5 rounded-lg text-[#64748B] hover:text-[#00D084] hover:bg-[#00D084]/10 transition-colors">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(p)} title="Delete" className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Product Modal */}
            <AnimatePresence>
                {(showModal === 'create' || showModal === 'edit') && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={e => e.target === e.currentTarget && setShowModal(null)}
                    >
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#161B27] border border-[#1E2535] rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-[#F1F5F9] font-bold text-lg">{showModal === 'create' ? 'Add Product' : 'Edit Product'}</h2>
                                <button onClick={() => setShowModal(null)} className="text-[#475569] hover:text-[#F1F5F9] transition-colors"><X size={18} /></button>
                            </div>
                            <div className="space-y-4">
                                {formRow('Product Name *', 'name')}
                                <div className="grid grid-cols-2 gap-3">
                                    {formRow('SKU', 'sku')}
                                    {formRow('Barcode', 'barcode')}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {formRow('Category', 'category')}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 uppercase tracking-wide">Unit</label>
                                        <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                                            className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#00D084]">
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {formRow('Selling Price (₦)', 'sellingPrice', 'number')}
                                    {formRow('Cost Price (₦)', 'costPrice', 'number')}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {formRow('Quantity', 'quantity', 'number')}
                                    {formRow('Low Stock Alert', 'lowStockThreshold', 'number')}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowModal(null)} className="flex-1 bg-[#1E2535] hover:bg-[#2A3548] text-[#94A3B8] py-2.5 rounded-xl text-sm font-medium transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-[#00D084] hover:bg-[#00b872] disabled:opacity-50 text-[#0F1117] py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                    {showModal === 'create' ? 'Add Product' : 'Save Changes'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stock Adjustment Modal */}
            <AnimatePresence>
                {showModal === 'adjust' && selectedProduct && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={e => e.target === e.currentTarget && setShowModal(null)}
                    >
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#161B27] border border-[#1E2535] rounded-2xl w-full max-w-md p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[#F1F5F9] font-bold text-lg">Adjust Stock</h2>
                                <button onClick={() => setShowModal(null)} className="text-[#475569] hover:text-[#F1F5F9]"><X size={18} /></button>
                            </div>
                            <p className="text-[#94A3B8] text-sm mb-4">
                                Current stock: <strong className="text-[#F1F5F9]">{selectedProduct.quantity} {selectedProduct.unit}</strong>
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 uppercase tracking-wide">Adjustment Type</label>
                                    <select value={adjustForm.type} onChange={e => setAdjustForm(f => ({ ...f, type: e.target.value }))}
                                        className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#00D084]">
                                        <option value="RESTOCK">Restock (+)</option>
                                        <option value="ADJUSTMENT">Adjustment (+ or -)</option>
                                        <option value="DAMAGED">Damaged (-)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 uppercase tracking-wide">
                                        Quantity {adjustForm.type === 'DAMAGED' ? '(will subtract)' : ''}
                                    </label>
                                    <input type="number" value={adjustForm.quantityDelta}
                                        onChange={e => setAdjustForm(f => ({ ...f, quantityDelta: e.target.value }))}
                                        className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#00D084]"
                                        placeholder="e.g. 10" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 uppercase tracking-wide">Reason (optional)</label>
                                    <input type="text" value={adjustForm.reason}
                                        onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
                                        className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#00D084]"
                                        placeholder="e.g. Received from supplier" />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowModal(null)} className="flex-1 bg-[#1E2535] text-[#94A3B8] py-2.5 rounded-xl text-sm font-medium">Cancel</button>
                                <button onClick={handleAdjust} disabled={isSaving || !adjustForm.quantityDelta}
                                    className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <ArrowUpDown size={15} />}
                                    Adjust Stock
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
