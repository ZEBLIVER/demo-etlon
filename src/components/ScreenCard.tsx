import { Link } from 'react-router-dom';
import { ChevronRight, Clock } from 'lucide-react';
import { useStore } from '@/store';
import type { Screen } from '@/lib/types';
import { ago, computeStatus, neverSeen } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { VariantPreview } from './VariantPreview';

export function ScreenCard({ screen }: { screen: Screen }) {
  const variants = useStore((s) => s.variants);
  const status = computeStatus(screen);
  const current = variants.find((v) => v.id === screen.variantId);
  const never = neverSeen(screen);
  const portrait = screen.orientation === 'portrait';
  return (
    <Link
      to={`/screens/${screen.id}`}
      className="group block overflow-hidden rounded-2xl border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99]"
    >
      <div className="flex justify-center bg-gradient-to-b from-muted to-muted/40 p-4">
        <div className={portrait ? 'w-28' : 'w-full max-w-sm'}>
          <div className="rounded-xl bg-zinc-900 p-1.5 shadow-lg ring-1 ring-black/10">
            <VariantPreview variantId={screen.shownVariantId} portrait={portrait} className="rounded-md" />
          </div>
        </div>
      </div>
      <div className="space-y-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-lg font-semibold">{screen.name}</div>
          <StatusBadge status={status} />
        </div>
        <div className="truncate text-sm font-medium">{current?.name ?? <span className="font-normal text-muted-foreground">Меню не выбрано · заглушка</span>}</div>
        {screen.lastError && status === 'error' && <div className="text-xs text-red-600 dark:text-red-400">{screen.lastError}</div>}
        <div className="flex items-center justify-between border-t pt-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{never ? 'ещё не подключался' : `на связи ${ago(screen.lastSeenAt)}`}</span>
          <span className="flex items-center gap-0.5">
            {screen.model.replace('Samsung ', '')}{screen.comment && ` · ${screen.comment}`}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
