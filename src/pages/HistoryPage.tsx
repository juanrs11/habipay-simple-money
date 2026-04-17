import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTransactions } from '@/services/transactions';
import { Transaction } from '@/types';
import { ArrowUpRight, ArrowDownLeft, Plus, X } from 'lucide-react';
import AppLayout from '@/components/AppLayout';

export default function HistoryPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  useEffect(() => {
    if (user) getTransactions(user.id).then(setTransactions);
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  const tags = useMemo(
    () => Array.from(new Set(transactions.map(t => t.label).filter(Boolean))),
    [transactions]
  );

  const filtered = transactions.filter(t => {
    const typeMatch =
      filter === 'all' ||
      t.type === filter ||
      (filter === 'received' && t.type === 'topup');
    const tagMatch = !tagFilter || t.label === tagFilter;
    return typeMatch && tagMatch;
  });

  const filters: { value: typeof filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'sent', label: 'Sent' },
    { value: 'received', label: 'Received' },
  ];

  const hasActiveFilters = filter !== 'all' || tagFilter !== null;

  return (
    <AppLayout>
      <div className="space-y-4">
        <h2 className="text-xl font-bold font-heading text-foreground">Transaction history</h2>

        <div className="flex gap-2">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${filter === f.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${tagFilter === tag ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {hasActiveFilters && (
          <button
            onClick={() => { setFilter('all'); setTagFilter(null); }}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}

        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions</p>
          )}
          {filtered.map((txn, i) => (
            <motion.div
              key={txn.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card"
            >
              <div className={`rounded-full p-2 ${txn.type === 'sent' ? 'bg-destructive/10' : txn.type === 'received' ? 'bg-success/10' : 'bg-secondary'}`}>
                {txn.type === 'sent' ? <ArrowUpRight className="h-4 w-4 text-destructive" /> :
                 txn.type === 'received' ? <ArrowDownLeft className="h-4 w-4 text-success" /> :
                 <Plus className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground truncate">{txn.counterpart || 'Top up'}</p>
                  {txn.label && (
                    <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs">
                      {txn.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{new Date(txn.date).toLocaleDateString()}</p>
              </div>
              <span className={`text-sm font-semibold ${txn.type === 'sent' ? 'text-destructive' : 'text-success'}`}>
                {txn.type === 'sent' ? '-' : '+'}${txn.amount.toFixed(2)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
