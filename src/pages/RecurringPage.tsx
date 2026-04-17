import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Repeat, Trash2, Plus, Play, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import { RecurringPayment, User } from '@/types';
import {
  getRecurringPayments,
  createRecurringPayment,
  cancelRecurringPayment,
  tickRecurring,
} from '@/services/recurring';
import { getAllUsers } from '@/services/auth';
import { toast } from 'sonner';

export default function RecurringPage() {
  const { user, refreshUser } = useAuth();
  const [items, setItems] = useState<RecurringPayment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // form state
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const reload = async () => {
    if (!user) return;
    const data = await getRecurringPayments(user.id);
    setItems(data);
  };

  useEffect(() => {
    if (user) {
      reload();
      setUsers(getAllUsers().filter(u => u.id !== user.id));
    }
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!toId || !amt || amt <= 0 || !label) {
      toast.error('Fill in all fields');
      return;
    }
    await createRecurringPayment(user.id, toId, amt, label, frequency, startDate);
    toast.success('Recurring payment created');
    setShowForm(false);
    setToId(''); setAmount(''); setLabel('');
    reload();
  };

  const handleCancel = async (id: string) => {
    await cancelRecurringPayment(id);
    toast.success('Cancelled');
    reload();
  };

  const handleTick = async () => {
    const count = await tickRecurring();
    if (count > 0) {
      toast.success(`Executed ${count} payment${count > 1 ? 's' : ''}`);
      refreshUser();
      reload();
    } else {
      toast.info('No payments due');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-heading text-foreground">Recurring payments</h2>
          <button
            onClick={handleTick}
            className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-muted transition"
          >
            <Play className="h-3 w-3" /> Simulate tick
          </button>
        </div>

        <button
          onClick={() => setShowForm(s => !s)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'New recurring payment'}
        </button>

        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreate}
            className="space-y-3 rounded-xl bg-card p-4 shadow-card"
          >
            <div>
              <label className="text-xs font-medium text-muted-foreground">Recipient</label>
              <select
                value={toId}
                onChange={e => setToId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select recipient</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Amount</label>
              <input
                type="number" step="0.01" value={amount}
                onChange={e => setAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Label</label>
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="March rent"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground">Frequency</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value as 'weekly' | 'monthly')}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground">Start date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button type="submit" className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Create
            </button>
          </motion.form>
        )}

        <div className="space-y-2">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No active recurring payments</p>
          )}
          {items.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card"
            >
              <div className="rounded-full bg-primary/10 p-2">
                <Repeat className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.label}</p>
                <p className="text-xs text-muted-foreground">
                  To {r.toName} • {r.frequency} • next {new Date(r.nextRunAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-sm font-semibold text-foreground">${r.amount.toFixed(2)}</span>
              <button
                onClick={() => handleCancel(r.id)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
