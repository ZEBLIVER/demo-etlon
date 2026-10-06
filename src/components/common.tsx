import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ApiError } from '@/api';
import { Button } from './ui/button';
import { Skeleton } from './ui/primitives';

export function useApi<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setData(await fnRef.current());
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(500, 'Что-то пошло не так'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { void reload(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, error, loading, reload };
}

export function errMsg(e: unknown) {
  return e instanceof ApiError ? e.message : 'Что-то пошло не так';
}
export async function run<T>(p: Promise<T>, success?: string): Promise<T | undefined> {
  try {
    const r = await p;
    if (success) toast.success(success);
    return r;
  } catch (e) {
    toast.error(errMsg(e));
    return undefined;
  }
}

export function PageHeader({ title, subtitle, actions, back }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className="mb-6">
      {back}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }: { icon: LucideIcon; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <div className="font-medium">{title}</div>
      {hint && <div className="mt-1 max-w-sm text-sm text-muted-foreground">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function GridSkeleton({ n = 6, h = 'h-44' }: { n?: number; h?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: n }, (_, i) => <Skeleton key={i} className={h} />)}
    </div>
  );
}

export function NoAccess({ message }: { message?: string }) {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-semibold">Нет доступа</h1>
      <p className="mt-2 text-muted-foreground">{message ?? 'У вас нет прав для просмотра этой страницы. Если это ошибка, обратитесь к администратору.'}</p>
      <Button asChild className="mt-6">
        <Link to="/">На главную</Link>
      </Button>
    </div>
  );
}

export function ErrorView({ error }: { error: ApiError }) {
  if (error.status === 403) return <NoAccess message={error.message} />;
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <h1 className="text-2xl font-semibold">{error.status === 404 ? 'Не найдено' : 'Ошибка'}</h1>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
      <Button asChild className="mt-6"><Link to="/">На главную</Link></Button>
    </div>
  );
}
