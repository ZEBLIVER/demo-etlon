import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { MapPin, Plus, Search, Store } from 'lucide-react';
import { createLocation, getLocations } from '@/api';
import { EmptyState, ErrorView, GridSkeleton, PageHeader, run, useApi } from '@/components/common';
import { StatusDot } from '@/components/StatusBadge';
import { VariantPreview } from '@/components/VariantPreview';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, Input, Label } from '@/components/ui/primitives';
import { useCurrentUser } from '@/lib/auth';
import { useStore } from '@/store';
import { computeStatus, isProblem, plural } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function LocationsPage() {
  const user = useCurrentUser()!;
  const isAdmin = user.role === 'ADMIN';
  const { data, error, loading, reload } = useApi(getLocations, [user.id]);
  const screens = useStore((s) => s.screens);
  const [q, setQ] = useState('');
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [dlg, setDlg] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  if (error) return <ErrorView error={error} />;
  if (!isAdmin && data?.length === 1) return <Navigate to={`/locations/${data[0].id}`} replace />;

  const rows = (data ?? [])
    .map((l) => {
      const sc = screens.filter((s) => s.locationId === l.id);
      const statuses = sc.map((s) => computeStatus(s));
      return { l, sc, statuses, problem: statuses.some(isProblem) };
    })
    .filter((r) => r.l.name.toLowerCase().includes(q.toLowerCase()) && (!onlyProblems || r.problem));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await run(createLocation({ name, code, address }), 'Кофейня добавлена');
    setBusy(false);
    if (r) {
      setDlg(false);
      setName('');
      setAddress('');
      setCode('');
      void reload(true);
    }
  };

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Кофейни' : 'Мои кофейни'}
        subtitle={isAdmin ? 'Все точки сети и состояние их экранов' : 'Выберите кофейню, чтобы управлять её телевизорами'}
        actions={isAdmin && <Button onClick={() => setDlg(true)}><Plus className="h-4 w-4" />Добавить кофейню</Button>}
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Поиск по названию" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button
          onClick={() => setOnlyProblems((v) => !v)}
          className={cn('h-10 rounded-xl border px-4 text-sm font-medium transition-colors', onlyProblems ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted')}
        >
          Только с проблемами
        </button>
      </div>
      {loading ? (
        <GridSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState icon={Store} title="Ничего не найдено" hint={onlyProblems ? 'Проблемных кофеен нет — отлично!' : 'Попробуйте изменить запрос.'} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ l, sc, statuses, problem }) => (
            <Link key={l.id} to={`/locations/${l.id}`}>
              <Card className="rise h-full p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-lg font-semibold">{l.name}</div>
                  <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-medium', problem ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300')}>
                    {problem ? 'Есть проблемы' : 'Всё работает'}
                  </span>
                </div>
                <div className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {l.address}
                </div>
                <div className="mt-4 flex gap-2">
                  {sc.map((s) => (
                    <div key={s.id} className={s.orientation === 'portrait' ? 'w-8' : 'w-1/3 max-w-24'}>
                      <VariantPreview variantId={s.shownVariantId} portrait={s.orientation === 'portrait'} compact className="rounded shadow-sm" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
                  <span>{sc.length} {plural(sc.length, 'экран', 'экрана', 'экранов')}</span>
                  <span className="flex items-center gap-1.5">{statuses.map((s, i) => <StatusDot key={i} status={s} />)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent title="Новая кофейня">
          <form onSubmit={submit} className="space-y-4">
            <div><Label htmlFor="n">Название</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></div>
            <div>
              <Label htmlFor="c">Код для ссылки</Label>
              <Input id="c" value={code} onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="например, baza" required />
              <p className="mt-1 text-xs text-muted-foreground">Латиницей. Ссылки телевизоров: etlonmenu.ru/{code || 'код'}/1. После создания код не меняется.</p>
            </div>
            <div><Label htmlFor="a">Адрес</Label><Input id="a" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Санкт-Петербург, ..." required /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDlg(false)}>Отмена</Button>
              <Button type="submit" disabled={busy}>Добавить</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
