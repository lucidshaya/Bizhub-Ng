import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ShoppingCart, Trash2, Minus, Plus, CreditCard, Banknote,
    Smartphone, Loader2, X, Printer, Check, Barcode
} from 'lucide-react';
import { inventoryApi, salesApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../web/Toast';

interface Product { id: string; name: string; sellingPriceNaira: number; quantity: number; unit: string; barcode?: string; sku?: string; category?: string; }
interface CartItem extends Product { cartQty: number; }

const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const PAYMENT_METHODS = [
    { id: 'cash', label: 'Cash', icon: <Banknote size={16} /> },
    { id: 'card', label: 'Card', icon: <CreditCard size={16} /> },
    { id: 'transfer', label: 'Transfer', icon: <Smartphone size={16} /> },
] as const;

export function POSScreen() {
    const { user } = useAuth();
    const toast = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discount, setDiscount] = useState('');
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
    const [cashGiven, setCashGiven] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [completedSale, setCompletedSale] = useState<any>(null);
    const scanBufferRef = useRef('');
    const scanTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const searchInputRef = useRef<HTMLInputElement>(null);

    // USB Barcode scanner: captures rapid keypresses globally
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            // Ignore if typing in an input/textarea that isn't our search
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' && e.target !== searchInputRef.current) return;
            if (tag === 'TEXTAREA' || tag === 'SELECT') return;

            if (e.key === 'Enter') {
                const code = scanBufferRef.current.trim();
                if (code.length >= 4) handleBarcodeScanned(code);
                scanBufferRef.current = '';
                clearTimeout(scanTimeoutRef.current);
            } else if (e.key.length === 1) {
                scanBufferRef.current += e.key;
                clearTimeout(scanTimeoutRef.current);
                // If no Enter after 200ms, clear buffer (not a scanner)
                scanTimeoutRef.current = setTimeout(() => { scanBufferRef.current = ''; }, 200);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => { window.removeEventListener('keydown', onKey); clearTimeout(scanTimeoutRef.current); };
    }, [products]);

    const handleBarcodeScanned = (code: string) => {
        const found = products.find(p => p.barcode === code || p.sku === code);
        if (found) {
            addToCart(found);
            toast.success(`Scanned: ${found.name}`);
        } else {
            toast.warning(`No product found for barcode: ${code}`);
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const res = await inventoryApi.getProducts({ search: search || undefined });
                setProducts(res.data);
            } catch { toast.error('Failed to load products'); }
        };
        load();
    }, [search]);

    const addToCart = (product: Product) => {
        if (product.quantity === 0) { toast.warning(`"${product.name}" is out of stock`); return; }
        setCart(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                if (existing.cartQty >= product.quantity) { toast.warning('Not enough stock'); return prev; }
                return prev.map(i => i.id === product.id ? { ...i, cartQty: i.cartQty + 1 } : i);
            }
            return [...prev, { ...product, cartQty: 1 }];
        });
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev
            .map(i => i.id === id ? { ...i, cartQty: Math.min(Math.max(1, i.cartQty + delta), i.quantity) } : i)
            .filter(i => i.cartQty > 0)
        );
    };

    const removeItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

    const subtotal = cart.reduce((s, i) => s + i.sellingPriceNaira * i.cartQty, 0);
    const discountAmt = discountType === 'percentage'
        ? (subtotal * parseFloat(discount || '0')) / 100
        : parseFloat(discount || '0');
    const total = Math.max(0, subtotal - discountAmt);
    const change = paymentMethod === 'cash' ? parseFloat(cashGiven || '0') - total : 0;

    const handleCheckout = async () => {
        if (cart.length === 0) { toast.error('Cart is empty'); return; }
        if (paymentMethod === 'cash' && parseFloat(cashGiven || '0') < total) {
            toast.error('Cash given is less than total amount'); return;
        }
        setIsProcessing(true);
        try {
            const res = await salesApi.createSale({
                items: cart.map(i => ({ productId: i.id, quantity: i.cartQty })),
                discount: Math.round(discountAmt * 100),
                discountType,
                paymentMethod,
            });
            setCompletedSale({ ...res.data, cashGiven: parseFloat(cashGiven || '0'), change, businessName: user?.businessName, cashier: user?.fullName });
            setCart([]);
            setDiscount('');
            setCashGiven('');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Checkout failed');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex h-full gap-0">
            {/* Left: Product grid */}
            <div className="flex-1 p-4 overflow-y-auto border-r border-[#1E2535]">
                <div className="mb-4 relative">
                    <Barcode size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
                    <input
                        ref={searchInputRef}
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search products or focus here and scan barcode..."
                        className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#00D084]"
                    />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {products.map(p => (
                        <button
                            key={p.id}
                            onClick={() => addToCart(p)}
                            disabled={p.quantity === 0}
                            className={`bg-[#161B27] border rounded-xl p-3 text-left transition-all group ${p.quantity === 0 ? 'border-[#1E2535] opacity-40 cursor-not-allowed' : 'border-[#1E2535] hover:border-[#00D084]/40 hover:bg-[#1a2030] active:scale-95'}`}
                        >
                            <div className="w-full h-16 bg-[#1E2535] rounded-lg mb-3 flex items-center justify-center group-hover:bg-[#232d42] transition-colors">
                                <ShoppingCart size={20} className="text-[#475569]" />
                            </div>
                            <p className="text-[#F1F5F9] text-xs font-semibold leading-tight line-clamp-2">{p.name}</p>
                            <p className="text-[#00D084] text-sm font-bold mt-1">{fmt(p.sellingPriceNaira)}</p>
                            <p className="text-[#475569] text-xs">{p.quantity} {p.unit} left</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right: Cart */}
            <div className="w-80 flex flex-col bg-[#0D1220] p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[#F1F5F9] font-bold">Cart</h2>
                    {cart.length > 0 && (
                        <button onClick={() => setCart([])} className="text-xs text-[#EF4444] hover:underline">Clear all</button>
                    )}
                </div>

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                    <AnimatePresence>
                        {cart.length === 0 ? (
                            <div className="text-center py-12 text-[#475569]">
                                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Cart is empty</p>
                            </div>
                        ) : cart.map(item => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-[#161B27] border border-[#1E2535] rounded-xl p-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-[#F1F5F9] text-xs font-semibold flex-1 leading-tight">{item.name}</p>
                                    <button onClick={() => removeItem(item.id)} className="text-[#475569] hover:text-[#EF4444] flex-shrink-0"><X size={12} /></button>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-[#1E2535] text-[#94A3B8] hover:bg-[#2A3548] flex items-center justify-center"><Minus size={10} /></button>
                                        <span className="text-[#F1F5F9] text-xs font-bold w-6 text-center">{item.cartQty}</span>
                                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-[#1E2535] text-[#94A3B8] hover:bg-[#2A3548] flex items-center justify-center"><Plus size={10} /></button>
                                    </div>
                                    <p className="text-[#00D084] text-xs font-bold">{fmt(item.sellingPriceNaira * item.cartQty)}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Totals */}
                {cart.length > 0 && (
                    <div className="pt-4 border-t border-[#1E2535] space-y-3">
                        <div className="flex justify-between text-sm text-[#94A3B8]">
                            <span>Subtotal</span><span>{fmt(subtotal)}</span>
                        </div>

                        {/* Discount */}
                        <div className="flex gap-2">
                            <input
                                type="number" value={discount} onChange={e => setDiscount(e.target.value)}
                                placeholder="Discount"
                                className="flex-1 bg-[#161B27] border border-[#1E2535] rounded-lg px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00D084]"
                            />
                            <select value={discountType} onChange={e => setDiscountType(e.target.value as any)}
                                className="bg-[#161B27] border border-[#1E2535] rounded-lg px-2 py-2 text-xs text-[#94A3B8] focus:outline-none">
                                <option value="fixed">₦</option>
                                <option value="percentage">%</option>
                            </select>
                        </div>

                        {discountAmt > 0 && (
                            <div className="flex justify-between text-xs text-[#EF4444]">
                                <span>Discount</span><span>- {fmt(discountAmt)}</span>
                            </div>
                        )}

                        <div className="bg-[#1E2535] rounded-xl p-3 flex justify-between items-center">
                            <span className="text-[#94A3B8] text-sm font-medium">Total</span>
                            <span className="text-[#00D084] text-xl font-bold">{fmt(total)}</span>
                        </div>

                        {/* Payment method */}
                        <div className="grid grid-cols-3 gap-1.5">
                            {PAYMENT_METHODS.map(m => (
                                <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                                    className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all ${paymentMethod === m.id ? 'bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/30' : 'bg-[#161B27] border border-[#1E2535] text-[#64748B] hover:border-[#00D084]/20'}`}>
                                    {m.icon}<span>{m.label}</span>
                                </button>
                            ))}
                        </div>

                        {paymentMethod === 'cash' && (
                            <input type="number" value={cashGiven} onChange={e => setCashGiven(e.target.value)}
                                placeholder="Cash given by customer..."
                                className="w-full bg-[#161B27] border border-[#1E2535] rounded-lg px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00D084]" />
                        )}

                        {paymentMethod === 'cash' && cashGiven && change >= 0 && (
                            <div className="flex justify-between text-xs text-[#3B82F6] font-semibold">
                                <span>Change</span><span>{fmt(change)}</span>
                            </div>
                        )}

                        <button onClick={handleCheckout} disabled={isProcessing}
                            className="w-full bg-[#00D084] hover:bg-[#00b872] disabled:opacity-50 text-[#0F1117] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            Checkout
                        </button>
                    </div>
                )}
            </div>

            {/* Receipt Modal */}
            <AnimatePresence>
                {completedSale && (
                    <ReceiptModal sale={completedSale} onClose={() => setCompletedSale(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Receipt Modal ─────────────────────────────────────────────────────────
function ReceiptModal({ sale, onClose }: { sale: any; onClose: () => void }) {
    const handlePrint = () => window.print();

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
                className="bg-white text-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden print:shadow-none">

                {/* Screen-only header */}
                <div className="bg-[#0F1117] px-4 py-3 flex items-center justify-between print:hidden">
                    <span className="text-[#F1F5F9] font-bold text-sm">Receipt</span>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-1.5 bg-[#00D084] text-[#0F1117] px-3 py-1.5 rounded-lg text-xs font-bold">
                            <Printer size={12} /> Print
                        </button>
                        <button onClick={onClose} className="text-[#475569] hover:text-white"><X size={16} /></button>
                    </div>
                </div>

                <div className="p-5 font-mono text-xs" id="receipt-content">
                    <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
                        <h2 className="font-bold text-base text-gray-900">{sale.businessName || 'BizhubNg Store'}</h2>
                        <p className="text-gray-500 text-[10px]">RECEIPT</p>
                        <p className="text-gray-400 text-[10px]">{new Date(sale.createdAt || Date.now()).toLocaleString()}</p>
                    </div>

                    <div className="space-y-1 mb-3">
                        {sale.items?.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between">
                                <span className="flex-1 truncate">{item.name} x{item.quantity}</span>
                                <span className="ml-2 tabular-nums">₦{item.subtotalNaira?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-dashed border-gray-300 pt-3 space-y-1">
                        <div className="flex justify-between"><span>Subtotal</span><span>₦{sale.subtotalNaira?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span></div>
                        {sale.discountNaira > 0 && (
                            <div className="flex justify-between text-red-500"><span>Discount</span><span>-₦{sale.discountNaira?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span></div>
                        )}
                        <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-2 mt-2">
                            <span>TOTAL</span><span>₦{sale.totalNaira?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-gray-500"><span>Payment</span><span className="capitalize">{sale.paymentMethod}</span></div>
                        {sale.cashGiven > 0 && <>
                            <div className="flex justify-between"><span>Cash Given</span><span>₦{sale.cashGiven?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span></div>
                            <div className="flex justify-between text-green-700 font-bold"><span>Change</span><span>₦{sale.change?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span></div>
                        </>}
                    </div>

                    <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-300 text-gray-400 text-[10px]">
                        <p>Served by: {sale.cashier || 'Cashier'}</p>
                        <p className="font-bold mt-1">Thank you! Please come again 🙏</p>
                        <p className="mt-1 opacity-60">Powered by BizhubNg</p>
                    </div>
                </div>
            </motion.div>

            {/* Print styles */}
            <style>{`
                @media print {
                    body > * { display: none !important; }
                    .fixed { display: block !important; position: static !important; background: none !important; }
                    #receipt-content { display: block !important; }
                }
            `}</style>
        </motion.div>
    );
}
