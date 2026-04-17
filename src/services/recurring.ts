import { RecurringPayment, User } from '@/types';
import { sendMoney } from './transactions';
import { getAllUsers, refreshCurrentUser } from './auth';

const KEY = 'habipay_recurring';

function getAll(): RecurringPayment[] {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

function save(items: RecurringPayment[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

function advance(dateIso: string, frequency: 'weekly' | 'monthly'): string {
  const d = new Date(dateIso);
  if (frequency === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString();
}

export async function getRecurringPayments(userId: string): Promise<RecurringPayment[]> {
  return getAll()
    .filter(r => r.fromId === userId && r.active)
    .sort((a, b) => new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime());
}

export async function createRecurringPayment(
  fromId: string,
  toId: string,
  amount: number,
  label: string,
  frequency: 'weekly' | 'monthly',
  startDate: string
): Promise<RecurringPayment> {
  const users = getAllUsers();
  const recipient = users.find(u => u.id === toId);
  if (!recipient) throw new Error('Recipient not found');

  const item: RecurringPayment = {
    id: crypto.randomUUID(),
    fromId,
    toId,
    toName: recipient.name,
    amount,
    label,
    frequency,
    nextRunAt: new Date(startDate).toISOString(),
    active: true,
  };
  const all = getAll();
  all.push(item);
  save(all);
  return item;
}

export async function cancelRecurringPayment(id: string): Promise<void> {
  const all = getAll();
  const idx = all.findIndex(r => r.id === id);
  if (idx >= 0) {
    all[idx].active = false;
    save(all);
  }
}

export async function tickRecurring(): Promise<number> {
  const all = getAll();
  const now = new Date();
  let executed = 0;

  for (const r of all) {
    if (!r.active) continue;
    while (r.active && new Date(r.nextRunAt) <= now) {
      const sender = getAllUsers().find(u => u.id === r.fromId);
      if (!sender || sender.balance < r.amount) {
        // not enough funds — stop attempting for this one
        break;
      }
      try {
        await sendMoney(r.fromId, sender.balance, r.toId, r.amount, r.label);
        r.nextRunAt = advance(r.nextRunAt, r.frequency);
        executed++;
      } catch {
        break;
      }
    }
  }
  save(all);
  refreshCurrentUser();
  return executed;
}
