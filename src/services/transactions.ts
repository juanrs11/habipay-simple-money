import { Transaction } from '@/types';
import { updateUserBalance, getAllUsers } from './auth';

const TXN_KEY = 'habipay_transactions';

function getAll(): Transaction[] {
  const raw = localStorage.getItem(TXN_KEY);
  if (!raw) {
    // seed some transactions for demo users
    const seed: Transaction[] = [
      { id: '1', type: 'topup', amount: 500, label: 'Initial deposit', date: '2025-04-10T10:00:00Z' },
      { id: '2', type: 'sent', amount: 45.00, counterpart: 'Bob Smith', counterpartId: '2', label: 'Lunch split', date: '2025-04-11T14:30:00Z' },
      { id: '3', type: 'received', amount: 120.00, counterpart: 'Carol Davis', counterpartId: '3', label: 'Concert tickets', date: '2025-04-12T09:15:00Z' },
      { id: '4', type: 'sent', amount: 30.00, counterpart: 'Dan Wilson', counterpartId: '4', label: 'Coffee run', date: '2025-04-13T16:45:00Z' },
      { id: '5', type: 'topup', amount: 750, label: 'Paycheck deposit', date: '2025-04-14T08:00:00Z' },
    ];
    localStorage.setItem(TXN_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}

function save(txns: Transaction[]) {
  localStorage.setItem(TXN_KEY, JSON.stringify(txns));
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  return getAll().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addFunds(userId: string, currentBalance: number, amount: number): Promise<Transaction> {
  const txn: Transaction = {
    id: crypto.randomUUID(),
    type: 'topup',
    amount,
    label: 'Added funds',
    date: new Date().toISOString(),
  };
  const all = getAll();
  all.push(txn);
  save(all);
  updateUserBalance(userId, currentBalance + amount);
  return txn;
}

export async function sendMoney(
  senderId: string,
  senderBalance: number,
  recipientId: string,
  amount: number,
  label: string
): Promise<Transaction> {
  if (amount > senderBalance) throw new Error('Insufficient balance');
  const users = getAllUsers();
  const recipient = users.find(u => u.id === recipientId);
  const sender = users.find(u => u.id === senderId);
  if (!recipient || !sender) throw new Error('User not found');

  const sentTxn: Transaction = {
    id: crypto.randomUUID(),
    type: 'sent',
    amount,
    counterpart: recipient.name,
    counterpartId: recipientId,
    label,
    date: new Date().toISOString(),
  };

  const all = getAll();
  all.push(sentTxn);
  save(all);

  updateUserBalance(senderId, senderBalance - amount);
  updateUserBalance(recipientId, recipient.balance + amount);
  return sentTxn;
}
