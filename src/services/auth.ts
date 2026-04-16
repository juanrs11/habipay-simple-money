import { User } from '@/types';

const USERS_KEY = 'habipay_users';
const CURRENT_USER_KEY = 'habipay_current_user';

function getUsers(): (User & { password: string })[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    // seed demo users
    const seed = [
      { id: '1', name: 'Alice Johnson', email: 'alice@example.com', password: 'pass', balance: 1250.00 },
      { id: '2', name: 'Bob Smith', email: 'bob@example.com', password: 'pass', balance: 830.50 },
      { id: '3', name: 'Carol Davis', email: 'carol@example.com', password: 'pass', balance: 2100.00 },
      { id: '4', name: 'Dan Wilson', email: 'dan@example.com', password: 'pass', balance: 450.75 },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}

function saveUsers(users: (User & { password: string })[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function signup(name: string, email: string, password: string): Promise<User> {
  const users = getUsers();
  if (users.find(u => u.email === email)) throw new Error('Email already exists');
  const newUser = { id: crypto.randomUUID(), name, email, password, balance: 0 };
  users.push(newUser);
  saveUsers(users);
  const { password: _, ...user } = newUser;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

export async function login(email: string, password: string): Promise<User> {
  const users = getUsers();
  const found = users.find(u => u.email === email && u.password === password);
  if (!found) throw new Error('Invalid credentials');
  const { password: _, ...user } = found;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

export async function logout(): Promise<void> {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function refreshCurrentUser(): User | null {
  const current = getCurrentUser();
  if (!current) return null;
  const users = getUsers();
  const found = users.find(u => u.id === current.id);
  if (!found) return null;
  const { password: _, ...user } = found;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

export function updateUserBalance(userId: string, newBalance: number) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx >= 0) {
    users[idx].balance = newBalance;
    saveUsers(users);
  }
}

export function getAllUsers(): User[] {
  return getUsers().map(({ password: _, ...u }) => u);
}
