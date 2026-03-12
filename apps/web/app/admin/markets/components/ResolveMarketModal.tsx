'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { marketsApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface ResolveMarketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    market: any;
}

export function ResolveMarketModal({ isOpen, onClose, onSuccess, market }: ResolveMarketModalProps) {
    const { success, error: toastError } = useToast();
    const [loading, setLoading] = useState(false);
    const [outcome, setOutcome] = useState<'YES' | 'NO' | 'CANCELLED' | ''>('');
    const [confirmText, setConfirmText] = useState('');

    const handleResolve = async () => {
        if (!outcome || confirmText !== 'RESOLVER') return;
        
        setLoading(true);
        try {
            await marketsApi.resolve(market.id, outcome as any);
            success('Mercado Resolvido', `O mercado foi finalizado com resultado ${outcome === 'YES' ? 'SIM' : outcome === 'NO' ? 'NÃO' : 'CANCELADO'}.`);
            onSuccess();
            onClose();
        } catch (err: any) {
            toastError('Erro', err?.response?.data?.message || 'Erro ao resolver mercado.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !market) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                >
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="p-3 rounded-2xl bg-no-500/10 border border-no-500/20">
                                <AlertTriangle className="text-no-400" size={24} />
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-2 mb-8 text-center">
                            <h3 className="text-2xl font-black uppercase tracking-tight">Resolver Mercado</h3>
                            <p className="text-white/40 text-sm">
                                Você está prestes a declarar o resultado final desta predição. 
                                <span className="block font-bold text-no-400 mt-2">Esta ação é irreversível e processará os pagamentos.</span>
                            </p>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mb-8">
                            <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1 text-center">Mercado Selecionado</div>
                            <div className="text-sm font-bold text-white text-center">{market.title}</div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setOutcome('YES')}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${outcome === 'YES' 
                                        ? 'bg-yes-500/20 border-yes-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
                                        : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                >
                                    <div className={`text-xs font-black uppercase tracking-widest ${outcome === 'YES' ? 'text-yes-400' : 'text-white/40'}`}>SIM</div>
                                    <div className={`text-[10px] font-bold ${outcome === 'YES' ? 'text-yes-500' : 'text-white/20'}`}>Venceu</div>
                                </button>
                                
                                <button
                                    onClick={() => setOutcome('NO')}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${outcome === 'NO' 
                                        ? 'bg-no-500/20 border-no-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                                        : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                >
                                    <div className={`text-xs font-black uppercase tracking-widest ${outcome === 'NO' ? 'text-no-400' : 'text-white/40'}`}>NÃO</div>
                                    <div className={`text-[10px] font-bold ${outcome === 'NO' ? 'text-no-500' : 'text-white/20'}`}>Venceu</div>
                                </button>

                                <button
                                    onClick={() => setOutcome('CANCELLED')}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${outcome === 'CANCELLED' 
                                        ? 'bg-white/20 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                                        : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                >
                                    <div className={`text-xs font-black uppercase tracking-widest ${outcome === 'CANCELLED' ? 'text-white' : 'text-white/40'}`}>ANULAR</div>
                                    <div className={`text-[10px] font-bold ${outcome === 'CANCELLED' ? 'text-white/60' : 'text-white/20'}`}>Estornar</div>
                                </button>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block text-center">
                                    Para confirmar, digite <span className="text-white">RESOLVER</span> abaixo:
                                </label>
                                <input
                                    value={confirmText}
                                    onChange={e => setConfirmText(e.target.value)}
                                    placeholder="Digite RESOLVER aqui"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-center focus:outline-none focus:border-accent-500/50 transition-colors tracking-widest"
                                />
                            </div>

                            <button
                                onClick={handleResolve}
                                disabled={loading || !outcome || confirmText !== 'RESOLVER'}
                                className="w-full bg-no-500 text-white font-black py-5 rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-no-600 transition-all duration-300 shadow-glow-no disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    'Processando Liquidacão...'
                                ) : (
                                    <>
                                        <ShieldCheck size={16} />
                                        Finalizar e Pagar Apostas
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
