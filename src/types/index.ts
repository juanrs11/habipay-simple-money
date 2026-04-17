export interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
}

export interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'topup';
  amount: number;
  counterpart?: string;
  counterpartId?: string;
  label: string;
  date: string;
}

export interface Group {
  id: string;
  name: string;
  members: GroupMember[];
  expenses: GroupExpense[];
}

export interface GroupMember {
  userId: string;
  name: string;
  balance: number; // positive = owed money, negative = owes money
}

export interface GroupExpense {
  id: string;
  description: string;
  amount: number;
  paidByUserId: string;
  paidByName: string;
  splitAmong: string[]; // user IDs
  date: string;
}

export interface RecurringPayment {
  id: string;
  fromId: string;
  toId: string;
  toName: string;
  amount: number;
  label: string;
  frequency: 'weekly' | 'monthly';
  nextRunAt: string; // ISO date
  active: boolean;
}

export interface PaymentLink {
  id: string;
  token: string;
  creatorId: string;
  creatorName: string;
  amount: number;
  description: string;
  payCount: number;
  createdAt: string;
}
