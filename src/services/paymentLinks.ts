import { PaymentLink } from '@/types';
import { getAllUsers } from './auth';
import { sendMoney } from './transactions';

const KEY = 'habipay_payment_links';

function getAll(): PaymentLink[] {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

function save(items: PaymentLink[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

function generateToken(): string {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
}

export async function createPaymentLink(
  userId: string,
  amount: number,
  description: string
): Promise<PaymentLink> {
  const creator = getAllUsers().find(u => u.id === userId);
  if (!creator) throw new Error('User not found');

  const link: PaymentLink = {
    id: crypto.randomUUID(),
    token: generateToken(),
    creatorId: userId,
    creatorName: creator.name,
    amount,
    description,
    payCount: 0,
    createdAt: new Date().toISOString(),
  };
  const all = getAll();
  all.push(link);
  save(all);
  return link;
}

export async function getMyLinks(userId: string): Promise<PaymentLink[]> {
  return getAll()
    .filter(l => l.creatorId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function resolveLink(token: string): Promise<PaymentLink | null> {
  return getAll().find(l => l.token === token) || null;
}

export async function payLink(token: string, payerId: string): Promise<void> {
  const all = getAll();
  const link = all.find(l => l.token === token);
  if (!link) throw new Error('Link not found');
  if (link.creatorId === payerId) throw new Error('Cannot pay your own link');

  const payer = getAllUsers().find(u => u.id === payerId);
  if (!payer) throw new Error('Payer not found');

  await sendMoney(payerId, payer.balance, link.creatorId, link.amount, link.description);
  link.payCount += 1;
  save(all);
}
