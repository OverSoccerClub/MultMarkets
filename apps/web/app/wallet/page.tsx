'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi, pixApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';

// ── Helpers ────────────────────────────────────────────────────────────
function formatBRL(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pendente', color: 'badge-warn' },
    CONFIRMED: { label: 'Confirmado', color: 'badge-accent' },
    PAID: { label: 'Pago', color: 'badge-yes' },
    COMPLETED: { label: 'Concluído', color: 'badge-yes' },
    FAILED: { label: 'Falhou', color: 'badge-no' },
    CANCELLED: { label: 'Cancelado', color: 'badge-neutral' },
    REFUNDED: { label: 'Estornado', color: 'badge-warn' },
};

type Tab = 'deposit' | 'withdraw' | 'history';

// ── QR Code SVG renderer ───────────────────────────────────────────────
function QrCodeDisplay({ payload }: { payload: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(payload);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* QR code placeholder — use the payload for copy-paste */}
            <div className="relative w-56 h-56 bg-white rounded-2xl p-4 flex items-center justify-center">
                <div className="absolute inset-0 bg-white rounded-2xl" />
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-20 h-20 text-gray-900" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="3" height="3" />
                        <rect x="18" y="14" width="3" height="3" />
                        <rect x="14" y="18" width="3" height="3" />
                        <rect x="18" y="18" width="3" height="3" />
                        <rect x="5" y="5" width="3" height="3" fill="currentColor" />
                        <rect x="16" y="5" width="3" height="3" fill="currentColor" />
                        <rect x="5" y="16" width="3" height="3" fill="currentColor" />
                    </svg>
                    <span className="text-[10px] text-gray-500 font-medium">PIX Copia e Cola</span>
                </div>
            </div>

            <div className="w-full max-w-sm">
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Código PIX (Copia e Cola)</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        readOnly
                        value={payload}
                        className="input input-sm flex-1 font-mono text-xs truncate"
                    />
                    <button
                        onClick={handleCopy}
                        className="btn btn-sm btn-primary whitespace-nowrap"
                    >
                        {copied ? '✓ Copiado!' : 'Copiar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function WalletPage() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<Tab>('deposit');
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [depositResult, setDepositResult] = useState<any>(null);
    const [pollTxId, setPollTxId] = useState<string | null>(null);

    // ── Wallet data ─────────────────────────────────────────────────
    const { data: wallet, isLoading: walletLoading } = useQuery({
        queryKey: ['wallet'],
        queryFn: walletApi.get,
        retry: false,
    });

    // ── Transaction history ──────────────────────────────────────────
    const { data: transactions } = useQuery({
        queryKey: ['wallet-transactions'],
        queryFn: () => walletApi.transactions(1, 20),
    });

    // ── PIX Deposit mutation ─────────────────────────────────────────
    const depositMutation = useMutation({
        mutationFn: (amount: number) => pixApi.deposit(amount),
        onSuccess: (data) => {
            setDepositResult(data);
            setPollTxId(data.txId);
        },
    });

    // ── PIX Withdraw mutation ────────────────────────────────────────
    const withdrawMutation = useMutation({
        mutationFn: (amount: number) => pixApi.withdraw(amount),
        onSuccess: () => {
            setWithdrawAmount('');
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
        },
    });

    // ── Poll for deposit confirmation ────────────────────────────────
    useEffect(() => {
        if (!pollTxId) return;

        const interval = setInterval(async () => {
            try {
                const status = await pixApi.status(pollTxId);
                if (status.status === 'PAID') {
                    setPollTxId(null);
                    setDepositResult((prev: any) => prev ? { ...prev, status: 'PAID' } : null);
                    queryClient.invalidateQueries({ queryKey: ['wallet'] });
                    queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
                }
            } catch {
                // ignore polling errors
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [pollTxId, queryClient]);

    const handleDeposit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount < 10) return;
        depositMutation.mutate(amount);
    };

    const handleWithdraw = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount < 10) return;
        if (!user?.cpf) return; // Ensure CPF is available
        withdrawMutation.mutate(amount);
    };

    const resetDeposit = useCallback(() => {
        setDepositResult(null);
        setPollTxId(null);
        setDepositAmount('');
    }, []);

    // ── Quick amount buttons ─────────────────────────────────────────
    const quickAmounts = [25, 50, 100, 200, 500];

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-8 pb-20">
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="mb-8">
                <h1 className="text-3xl font-black uppercase tracking-tight">Carteira</h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Gerencie seus depósitos e saques via PIX
                </p>
            </div>

            {/* ── Balance Card ─────────────────────────────────────────── */}
            <div className="market-card p-6 mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">Saldo Disponível</p>
                        <p className="text-2xl font-bold text-[var(--color-yes-text)] font-mono">
                            {walletLoading ? '...' : formatBRL(wallet?.available ?? 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">Saldo Bloqueado</p>
                        <p className="text-lg font-semibold text-[var(--color-warn-text)] font-mono">
                            {walletLoading ? '...' : formatBRL(wallet?.lockedBalance ?? 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">Saldo Total</p>
                        <p className="text-lg font-semibold text-[var(--text-primary)] font-mono">
                            {walletLoading ? '...' : formatBRL(wallet?.balance ?? 0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Tabs ─────────────────────────────────────────────────── */}
            <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]">
                {([
                    { key: 'deposit' as Tab, label: '💰 Depositar', icon: '↓' },
                    { key: 'withdraw' as Tab, label: '💸 Sacar', icon: '↑' },
                    { key: 'history' as Tab, label: '📋 Histórico', icon: '≡' },
                ]).map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            setActiveTab(tab.key);
                            if (tab.key === 'deposit') resetDeposit();
                        }}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key
                            ? 'bg-[var(--color-accent-subtle)] text-[var(--text-accent)] border border-[var(--color-accent-border)]'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Deposit Tab ──────────────────────────────────────────── */}
            {activeTab === 'deposit' && (
                <div className="market-card p-6">
                    {!depositResult ? (
                        <form onSubmit={handleDeposit} className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Depositar via PIX</h3>
                                <p className="text-sm text-[var(--text-muted)] mb-4">
                                    Insira o valor desejado e gere um QR Code PIX para pagamento. O saldo será
                                    creditado automaticamente após a confirmação do pagamento.
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                                    Valor do depósito
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-semibold">
                                        R$
                                    </span>
                                    <input
                                        type="number"
                                        min="10"
                                        max="50000"
                                        step="0.01"
                                        placeholder="0,00"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        className="input input-bet pl-12"
                                    />
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    Mínimo R$ 10,00 · Máximo R$ 50.000,00
                                </p>
                            </div>

                            {/* Quick amounts */}
                            <div className="flex flex-wrap gap-2">
                                {quickAmounts.map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => setDepositAmount(String(amt))}
                                        className={`btn btn-sm ${depositAmount === String(amt) ? 'btn-primary' : 'btn-secondary'}`}
                                    >
                                        R$ {amt}
                                    </button>
                                ))}
                            </div>

                            {depositMutation.isError && (
                                <div className="p-3 rounded-lg bg-[var(--color-no-subtle)] border border-[var(--color-no-border)] text-sm text-[var(--color-no-text)]">
                                    {(depositMutation.error as any)?.response?.data?.message || 'Erro ao gerar QR Code. Tente novamente.'}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={depositMutation.isPending || !depositAmount || parseFloat(depositAmount) < 10}
                                className="btn btn-primary btn-lg w-full"
                            >
                                {depositMutation.isPending ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" /></svg>
                                        Gerando QR Code...
                                    </span>
                                ) : 'Gerar QR Code PIX'}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {depositResult.status === 'PAID' ? (
                                <div className="text-center space-y-4">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-yes-subtle)] border border-[var(--color-yes-border)]">
                                        <svg className="w-8 h-8 text-[var(--color-yes-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-[var(--color-yes-text)]">Depósito Confirmado!</h3>
                                    <p className="text-[var(--text-secondary)]">
                                        {formatBRL(depositResult.amount)} foi creditado na sua carteira.
                                    </p>
                                    <button onClick={resetDeposit} className="btn btn-primary btn-lg">
                                        Fazer outro depósito
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <h3 className="text-lg font-semibold mb-1">QR Code Gerado</h3>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            Escaneie o QR Code ou copie o código PIX para realizar o pagamento de{' '}
                                            <strong className="text-[var(--text-primary)]">{formatBRL(depositResult.amount)}</strong>
                                        </p>
                                    </div>

                                    <QrCodeDisplay payload={depositResult.qrCode} />

                                    {/* Polling indicator */}
                                    <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-warn-text)]">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" /></svg>
                                        Aguardando pagamento...
                                    </div>

                                    {depositResult.expiresAt && (
                                        <p className="text-center text-xs text-[var(--text-muted)]">
                                            Expira em: {formatDate(depositResult.expiresAt)}
                                        </p>
                                    )}

                                    <button onClick={resetDeposit} className="btn btn-secondary w-full">
                                        Cancelar e voltar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Withdraw Tab ─────────────────────────────────────────── */}
            {activeTab === 'withdraw' && (
                <div className="market-card p-6">
                    <form onSubmit={handleWithdraw} className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Sacar via PIX</h3>
                            <p className="text-sm text-[var(--text-muted)] mb-4">
                                Informe o valor e a chave PIX de destino. O saque será processado em instantes.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                                Valor do saque
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-semibold">
                                    R$
                                </span>
                                <input
                                    type="number"
                                    min="10"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="input input-bet pl-12"
                                />
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                Mínimo R$ 10,00 · Disponível: {formatBRL(wallet?.available ?? 0)}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                                Chave PIX de destino
                            </label>
                            {user?.cpf ? (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/50 font-mono text-sm flex items-center justify-between">
                                    <span>CPF Cadastrado:</span>
                                    <strong className="text-white truncate max-w-xs">
                                        ***.{user.cpf.substring(3, 6)}.{user.cpf.substring(6, 9)}-**
                                    </strong>
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-accent-500/10 border border-accent-500/30 text-accent-500 text-sm">
                                    <p className="font-bold mb-2">⚠️ Saque Bloqueado</p>
                                    <p className="mb-4">Você precisa registrar seu CPF no seu Perfil para liberar saques.</p>
                                    <Link href={"/profile" as any} className="btn btn-primary btn-sm block text-center w-full">
                                        Cadastrar CPF no Perfil
                                    </Link>
                                </div>
                            )}
                        </div>

                        {withdrawMutation.isSuccess && (
                            <div className="p-3 rounded-lg bg-[var(--color-yes-subtle)] border border-[var(--color-yes-border)] text-sm text-[var(--color-yes-text)]">
                                ✓ Saque enviado com sucesso! O PIX será processado em instantes.
                            </div>
                        )}

                        {withdrawMutation.isError && (
                            <div className="p-3 rounded-lg bg-[var(--color-no-subtle)] border border-[var(--color-no-border)] text-sm text-[var(--color-no-text)]">
                                {(withdrawMutation.error as any)?.response?.data?.message || 'Erro ao processar saque. Tente novamente.'}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={
                                withdrawMutation.isPending ||
                                !withdrawAmount ||
                                parseFloat(withdrawAmount) < 10 ||
                                !user?.cpf
                            }
                            className="btn btn-primary btn-lg w-full"
                        >
                            {withdrawMutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" /></svg>
                                    Processando saque...
                                </span>
                            ) : 'Solicitar Saque via PIX'}
                        </button>
                    </form>
                </div>
            )}

            {/* ── History Tab ──────────────────────────────────────────── */}
            {activeTab === 'history' && (
                <div className="market-card overflow-hidden">
                    <div className="p-6 pb-4 border-b border-[var(--border-default)]">
                        <h3 className="text-lg font-semibold">Histórico de Transações</h3>
                    </div>

                    {transactions?.items?.length > 0 ? (
                        <div className="divide-y divide-[var(--border-muted)]">
                            {transactions.items.map((tx: any) => (
                                <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-[var(--bg-subtle)] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${tx.type === 'DEPOSIT' || tx.type === 'PAYOUT' || tx.type === 'BONUS'
                                            ? 'bg-[var(--color-yes-subtle)] text-[var(--color-yes-text)]'
                                            : 'bg-[var(--color-no-subtle)] text-[var(--color-no-text)]'
                                            }`}>
                                            {tx.type === 'DEPOSIT' || tx.type === 'PAYOUT' || tx.type === 'BONUS' ? '↓' : '↑'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[var(--text-primary)]">
                                                {tx.description || tx.type}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">{formatDate(tx.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-semibold font-mono ${tx.type === 'DEPOSIT' || tx.type === 'PAYOUT' || tx.type === 'BONUS'
                                            ? 'text-[var(--color-yes-text)]'
                                            : 'text-[var(--color-no-text)]'
                                            }`}>
                                            {tx.type === 'DEPOSIT' || tx.type === 'PAYOUT' || tx.type === 'BONUS' ? '+' : '-'}
                                            {formatBRL(tx.amount)}
                                        </p>
                                        <span className={`badge text-[10px] ${STATUS_MAP[tx.status]?.color || 'badge-neutral'}`}>
                                            {STATUS_MAP[tx.status]?.label || tx.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <p className="text-[var(--text-muted)] text-sm">Nenhuma transação encontrada.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
