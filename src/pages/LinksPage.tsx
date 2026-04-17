import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link2, Plus, Copy, X, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import { PaymentLink } from '@/types';
import { createPaymentLink, getMyLinks } from '@/services/paymentLinks';
import { toast } from 'sonner';

export default function LinksPage() {
  const { user } = useAuth();
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const reload = async () => {
    if (!user) return;
    setLinks(await getMyLinks(user.id));
  };

  useEffect(() => { if (user) reload(); }, []);

  if (!user) return <Navigate to="/login" replace />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !description) {
      toast.error('Fill in all fields');
      return;
    }
    await createPaymentLink(user.id, amt, description);
    toast.success('Link created');
    setAmount(''); setDescription(''); setShowForm(false);
    reload();
  };

  const buildUrl = (token: string) => `${window.location.origin}/pay/${token}`;

  const handleCopy = async (token: string) => {
    await navigator.clipboard.writeText(buildUrl(token));
    setCopiedToken(token);
    toast.success('Link copied');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <h2 className="text-xl font-bold font-heading text-foreground">Payment links</h2>

        <button
          onClick={() => setShowForm(s => !s)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Create new link'}
        </button>

        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreate}
            className="space-y-3 rounded-xl bg-card p-4 shadow-card"
          >
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
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Concert ticket"
              />
            </div>
            <button type="submit" className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Create link
            </button>
          </motion.form>
        )}

        <div className="space-y-2">
          {links.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No payment links yet</p>
          )}
          {links.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl bg-card p-3 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Link2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{l.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Paid {l.payCount}× • {new Date(l.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-semibold text-foreground">${l.amount.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                  /pay/{l.token}
                </code>
                <button
                  onClick={() => handleCopy(l.token)}
                  className="rounded-md bg-secondary px-2 py-1 text-secondary-foreground hover:bg-muted transition"
                >
                  {copiedToken === l.token ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
