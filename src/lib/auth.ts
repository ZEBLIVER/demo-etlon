import { useStore } from '@/store';
import type { User } from './types';

export function useCurrentUser(): User | null {
  const users = useStore((s) => s.users);
  const id = useStore((s) => s.currentUserId);
  const u = users.find((x) => x.id === id);
  if (!u || !u.enabled) return null;
  return u;
}
