import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronRight, Monitor, Store } from 'lucide-react';
import { getAudit, getProblemScreens } from '@/api';
import { EmptyState, ErrorView, PageHeader, useApi } from '@/components/common';
import { STATUS_META, StatusBadge } from '@/components/StatusBadge';
import { Card, Skeleton } from '@/components/ui/primitives';
import { useStore } from '@/store';
import { ago, computeStatus, isConnected, isProblem } from '@/lib/utils';

function Counter({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Store; tone: string }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <div className="text-3xl font-semibold leading-none">{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}

export default function OverviewPage() {
  const allScreens = useStore((s) => s.screens);
  const allLocations = useStore((s) => s.locations);
  const locations = allLocations.filter((l) => !l.archived);
  const screens = allScreens.filter((s) => locations.some((l) => l.id === s.locationId));
  const audit = useApi(getAudit, []);
  const problems = useApi(getProblemScreens, []);
  const statuses = screens.map((s) => computeStatus(s));
  const online = statuses.filter(isConnected).length;
  const attention = problems.data ?? [];
  const cnt = problems.data ? attention.length : statuses.filter(isProblem).length;

  const dist = (Object.keys(STATUS_META) as (keyof typeof STATUS_META)[])
    .map((k) => ({ k, n: statuses.filter((s) => s === k).length }))
    .filter((x) => x.n > 0);

  if (audit.error) return <ErrorView error={audit.error} />;
  return (
    <>
      <PageHeader title="Обзор" subtitle="Состояние сети кофеен на сегодня" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Counter label="Кофеен" value={locations.length} icon={Store} tone="bg-accent text-primary" />
        <Counter label="Экранов" value={screens.length} icon={Monitor} tone="bg-sky-500/15 text-sky-600" />
        <Counter label="На связи" value={online} icon={CheckCircle2} tone="bg-emerald-500/15 text-emerald-600" />
        <Counter label="Требуют внимания" value={cnt} icon={AlertTriangle} tone="bg-amber-500/20 text-amber-600" />
      </div>
      <Card className="mb-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Состояние экранов</h2>
          <span className="text-sm text-muted-foreground">{screens.length} телевизоров</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          {dist.map(({ k, n }) => <div key={k} title={`${STATUS_META[k].label}: ${n}`} className={STATUS_META[k].dot} style={{ width: `${(n / Math.max(1, screens.length)) * 100}%` }} />)}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
          {dist.map(({ k, n }) => (
            <span key={k} className="inline-flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${STATUS_META[k].dot}`} />{STATUS_META[k].label}<b>{n}</b></span>
          ))}
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h2 className="mb-4 font-semibold">Требуют внимания</h2>
          {problems.loading ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : attention.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Всё работает" hint="Проблемных экранов сейчас нет." />
          ) : (
            <div className="space-y-2">
              {attention.map(({ screen, location }) => {
                const st = computeStatus(screen);
                return (
                  <Link key={screen.id} to={`/screens/${screen.id}`} className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{location.name} · {screen.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {screen.lastError && st === 'error' ? screen.lastError + ' · ' : ''}на связи {ago(screen.lastSeenAt)}
                      </div>
                    </div>
                    <StatusBadge status={st} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Последние действия</h2>
          {audit.loading ? (
            <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <ul className="space-y-3">
              {audit.data!.slice(0, 7).map((a) => (
                <li key={a.id} className="text-sm">
                  <div><span className="font-medium">{a.userName}</span> · {a.action}</div>
                  <div className="text-xs text-muted-foreground">{a.target} · {ago(a.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/audit" className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline">Весь журнал <ChevronRight className="h-4 w-4" /></Link>
        </Card>
      </div>
    </>
  );
}
