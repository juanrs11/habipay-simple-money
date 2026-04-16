import { Group, GroupExpense } from '@/types';
import { sendMoney, addFunds } from './transactions';
import { getAllUsers, refreshCurrentUser } from './auth';

const GROUPS_KEY = 'habipay_groups';

function getAll(): Group[] {
  const raw = localStorage.getItem(GROUPS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function save(groups: Group[]) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

export async function getGroups(): Promise<Group[]> {
  return getAll();
}

export async function createGroup(name: string, memberIds: string[]): Promise<Group> {
  const users = getAllUsers();
  const group: Group = {
    id: crypto.randomUUID(),
    name,
    members: memberIds.map(id => {
      const u = users.find(u => u.id === id);
      return { userId: id, name: u?.name || 'Unknown', balance: 0 };
    }),
    expenses: [],
  };
  const all = getAll();
  all.push(group);
  save(all);
  return group;
}

export async function addExpense(
  groupId: string,
  description: string,
  amount: number,
  paidByUserId: string,
  splitAmong: string[]
): Promise<Group> {
  const all = getAll();
  const group = all.find(g => g.id === groupId);
  if (!group) throw new Error('Group not found');

  const users = getAllUsers();
  const payer = users.find(u => u.id === paidByUserId);

  const expense: GroupExpense = {
    id: crypto.randomUUID(),
    description,
    amount,
    paidByUserId,
    paidByName: payer?.name || 'Unknown',
    splitAmong,
    date: new Date().toISOString(),
  };

  group.expenses.push(expense);

  // Recalculate balances
  group.members.forEach(m => (m.balance = 0));
  group.expenses.forEach(exp => {
    const share = exp.amount / exp.splitAmong.length;
    exp.splitAmong.forEach(uid => {
      const member = group.members.find(m => m.userId === uid);
      if (member) {
        if (uid === exp.paidByUserId) {
          member.balance += exp.amount - share;
        } else {
          member.balance -= share;
        }
      }
    });
  });

  save(all);
  return group;
}

export async function settleDebt(
  groupId: string,
  fromUserId: string,
  toUserId: string,
  amount: number
): Promise<Group> {
  const fromUser = getAllUsers().find(u => u.id === fromUserId);
  if (!fromUser) throw new Error('User not found');

  await sendMoney(fromUserId, fromUser.balance, toUserId, amount, `Group settlement`);

  // Adjust group balances
  const all = getAll();
  const group = all.find(g => g.id === groupId);
  if (!group) throw new Error('Group not found');

  const from = group.members.find(m => m.userId === fromUserId);
  const to = group.members.find(m => m.userId === toUserId);
  if (from) from.balance += amount;
  if (to) to.balance -= amount;

  save(all);
  return group;
}
