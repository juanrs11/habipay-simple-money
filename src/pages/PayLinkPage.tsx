import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PaymentLink } from '@/types';
import { resolveLink, payLink } from '@/services/paymentLinks';
import { toast } from 'sonner';

export default function PayLinkPage() {
  const { token } = useParams<{ token: string }>();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    resolveLink(token).then(l => {
      setLink(l);
      setLoading(false);
    });
  }, [token]);

  const handlePay = async () => {
    if (!token) return;
    if (!user) {
      sessionStorage.setItem('habipay_redirect', `/pay/${token}`);
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await payLink(token, user.id);
      refreshUser();
      setPaid(true);
      toast.success('Payment sent!');
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 py-3 border-b border-border">
        <Link to="/" className="text-xl font-bold font-heading text-primary">HabiPay</Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl bg-card p-6 shadow-card"
        >
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">Loading...</p>
          ) : !link ? (
            <div className="text-center space-y-2">
              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
              <p className="font-medium text-foreground">Link not found</p>
              <p className="text-sm text-muted-foreground">This payment link may have been deleted.</p>
            </div>
          ) : paid ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <p className="text-lg font-semibold text-foreground">Payment sent!</p>
              <p className="text-sm text-muted-foreground">
                ${link.amount.toFixed(2)} to {link.creatorName}
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-3 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Back to dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-3 inline-flex rounded-full bg-primary/10 p-3">
                  <Link2 className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{link.creatorName} is requesting</p>
                <p className="mt-1 text-4xl font-bold font-heading text-foreground">
                  ${link.amount.toFixed(2)}
                </p>
                <p className="mt-2 text-sm text-foreground">{link.description}</p>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <button
                onClick={handlePay}
                disabled={submitting}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Processing...' : user ? 'Pay now' : 'Login to pay'}
              </button>

              {user && (
                <p className="text-center text-xs text-muted-foreground">
                  Paying as {user.name} • Balance ${user.balance.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
