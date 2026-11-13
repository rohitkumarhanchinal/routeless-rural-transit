export type DemoRole = 'student' | 'operator';

export interface DemoAccount {
  id: string;
  email: string;
  password: string;
  role: DemoRole;
  displayName: string;
}

export type AuthenticatedDemoAccount = Omit<DemoAccount, 'password'>;

// Demo-only credentials. Replace this local adapter with a server auth provider before production use.
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { id: 'demo-student', email: 'student@ruralride.demo', password: 'student123', role: 'student', displayName: 'Student demo' },
  { id: 'demo-operator', email: 'operator@ruralride.demo', password: 'operator123', role: 'operator', displayName: 'Operator demo' },
];

export const authenticateDemo = (email: string, password: string): AuthenticatedDemoAccount | null => {
  const account = DEMO_ACCOUNTS.find((entry) => entry.email.toLowerCase() === email.trim().toLowerCase() && entry.password === password);
  if (!account) return null;
  const { password: _password, ...safeAccount } = account;
  return safeAccount;
};
