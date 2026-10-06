import { AlertTriangle, CheckCircle2, Clock, Link2Off, Moon, RefreshCw, WifiOff } from 'lucide-react';
import type { ScreenStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export const STATUS_META: Record<ScreenStatus, { label: string; icon: typeof CheckCircle2; badge: string; dot: string }> = {
  online: { label: 'На экране', icon: CheckCircle2, badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  updating: { label: 'Обновляется', icon: RefreshCw, badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
  lagging: { label: 'Отстаёт', icon: Clock, badge: 'bg-amber-500/20 text-amber-800 dark:text-amber-300', dot: 'bg-amber-500' },
  offline: { label: 'Нет связи', icon: WifiOff, badge: 'bg-red-500/15 text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  offline_night: { label: 'Нет связи (ночь)', icon: Moon, badge: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300', dot: 'bg-zinc-400' },
  never: { label: 'Ещё не подключён', icon: Link2Off, badge: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300', dot: 'bg-zinc-300' },
  error: { label: 'Ошибка', icon: AlertTriangle, badge: 'bg-red-500/15 text-red-700 dark:text-red-300', dot: 'bg-red-500' },
};

export function StatusBadge({ status, className }: { status: ScreenStatus; className?: string }) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', m.badge, className)}>
      <Icon className={cn('h-3.5 w-3.5', status === 'updating' && 'animate-spin')} />
      {m.label}
    </span>
  );
}

export function StatusDot({ status }: { status: ScreenStatus }) {
  return <span title={STATUS_META[status].label} className={cn('inline-block h-2.5 w-2.5 rounded-full', STATUS_META[status].dot)} />;
}
