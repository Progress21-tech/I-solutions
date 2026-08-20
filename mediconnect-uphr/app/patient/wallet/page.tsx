'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Transaction = { id: string; direction: 'credit' | 'debit'; amount_kobo: number; status: string; created_at: string; metadata: { purpose?: string } }
type Point = { id: string; direction: 'earn' | 'redeem' | 'adjustment'; points: number; created_at: string }

export default function WalletPage() {
  const router = useRouter(); const [transactions, setTransactions] = useState<Transaction[]>([]); const [points, setPoints] = useState<Point[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  useEffect(() => { void load() }, [])
  async function load() {
    const { data: auth } = await supabase.auth.getUser(); if (!auth.user) { router.replace('/login'); return }
    const { data: wallet, error: walletError } = await supabase.from('wallets').select('id').eq('owner_id', auth.user.id).maybeSingle()
    const [transactionResult, pointsResult] = await Promise.all([wallet ? supabase.from('wallet_transactions').select('id, direction, amount_kobo, status, created_at, metadata').eq('wallet_id', wallet.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [] as Transaction[], error: null }), supabase.from('points_ledger').select('id, direction, points, created_at').eq('owner_id', auth.user.id).order('created_at', { ascending: false })])
    if (walletError || transactionResult.error || pointsResult.error) setError('Your wallet is temporarily unavailable. Please try again.')
    setTransactions((transactionResult.data || []) as Transaction[]); setPoints((pointsResult.data || []) as Point[]); setLoading(false)
  }
  const balance = transactions.filter(transaction => transaction.status === 'completed').reduce((total, transaction) => total + (transaction.direction === 'credit' ? transaction.amount_kobo : -transaction.amount_kobo), 0)
  const pointBalance = points.reduce((total, entry) => total + (entry.direction === 'redeem' ? -entry.points : entry.points), 0)
  return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white px-6 py-4"><button onClick={() => router.back()} className="font-semibold text-blue-800 underline">← Back</button></header><section className="mx-auto max-w-2xl p-6"><h1 className="text-2xl font-bold text-slate-950">Wallet & health points</h1><p className="mt-1 text-sm text-slate-700">Points can only be used toward eligible healthcare costs on UDPR.</p>{error && <p role="alert" className="mt-5 text-sm text-red-800">{error}</p>}{loading ? <p className="mt-8 text-slate-700">Loading wallet…</p> : <><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-blue-700 p-5 text-white"><p className="text-sm text-blue-100">Wallet balance</p><p className="mt-2 text-2xl font-bold">₦{(balance / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div><div className="rounded-2xl bg-emerald-700 p-5 text-white"><p className="text-sm text-emerald-100">Health points</p><p className="mt-2 text-2xl font-bold">{pointBalance.toLocaleString()}</p></div></div><h2 className="mt-8 text-lg font-bold text-slate-950">Transactions</h2><div className="mt-3 space-y-2">{transactions.length ? transactions.map(transaction => <div key={transaction.id} className="rounded-xl bg-white p-4 text-sm shadow-sm"><p className="font-semibold text-slate-900">{transaction.metadata?.purpose?.replaceAll('_', ' ') || 'Wallet transaction'}</p><p className="mt-1 text-slate-700">{transaction.direction === 'credit' ? '+' : '−'}₦{(transaction.amount_kobo / 100).toLocaleString()} · {transaction.status}</p></div>) : <p className="rounded-xl bg-white p-4 text-sm text-slate-700">No wallet transactions yet.</p>}</div></>}</section></main>
}
