import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft, Check, Clock, Copy, Download, Eraser, ExternalLink, History, Layers, Loader2, Send, SlidersHorizontal, Trash2, Tv } from 'lucide-react';
import { toast } from 'sonner';
import { deleteScreen, getScreen, getScreenHistory, resetScreenCache, setCurrentVariant, simulateScreenAck, updateScreenVariants } from '@/api';
import { EmptyState, ErrorView, errMsg, PageHeader, run, useApi } from '@/components/common';
import { StatusBadge } from '@/components/StatusBadge';
import { VariantPreview } from '@/components/VariantPreview';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, Skeleton } from '@/components/ui/primitives';
import { useCurrentUser } from '@/lib/auth';
import { useStore } from '@/store';
import { ago, cn, computeStatus, demoPlayerPath, fmtDate, isAvailable, neverSeen, screenLink } from '@/lib/utils';

const STEPS = [
  { label: 'Отправлено', icon: Send },
  { label: 'Обновляется', icon: Download },
  { label: 'На экране', icon: Tv },
];

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center" aria-label="Статус доставки меню">
      {STEPS.map((s, i) => {
        const done = i < step || (step === 2 && i === 2);
        const active = i === step && step < 2;
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  done ? 'border-emerald-500 bg-emerald-500 text-white' : active ? 'border-sky-500 bg-sky-500/15 text-sky-600' : 'text-muted-foreground',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={cn('text-xs font-medium', done || active ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={cn('mx-2 mb-5 h-0.5 flex-1 rounded transition-colors', i < step ? 'bg-emerald-500' : 'bg-border')} />}
          </div>
        );
      })}
    </div>
  );
}

export default function ScreenPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const isAdmin = useCurrentUser()?.role === 'ADMIN';
  const { data, error, loading } = useApi(() => getScreen(id), [id]);
  const screen = useStore((s) => s.screens.find((x) => x.id === id));
  const variants = useStore((s) => s.variants);
  const [selected, setSelected] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [step, setStep] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<'cache' | 'delete' | null>(null);
  const [allowDlg, setAllowDlg] = useState(false);
  const [allowDraft, setAllowDraft] = useState<string[]>([]);
  const history = useApi(() => getScreenHistory(id), [id, screen?.version]);
  const inited = useRef('');

  useEffect(() => {
    if (screen && inited.current !== id) {
      inited.current = id;
      setSelected(screen.variantId);
      setStep(null);
    }
  }, [screen, id]);

  if (error) return <ErrorView error={error} />;
  if (loading || !screen || !data) {
    return (
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-80 lg:col-span-3" />
        <Skeleton className="h-80 lg:col-span-2" />
      </div>
    );
  }

  const { location } = data;
  const status = computeStatus(screen);
  const portrait = screen.orientation === 'portrait';
  const available = variants.filter((v) => isAvailable(screen, v));
  const current = variants.find((v) => v.id === screen.variantId);
  const shown = variants.find((v) => v.id === screen.shownVariantId);
  const stepIdx = step ?? (status === 'updating' ? 1 : null);
  const busyDelivery = stepIdx !== null && stepIdx < 2;
  const never = neverSeen(screen);
  const currentHidden = !!current && !isAvailable(screen, current);
  const link = screenLink(location.code, screen.number);
  const canApply = !!selected && selected !== screen.variantId && !applying && !busyDelivery;

  const apply = async () => {
    if (!selected) return;
    setApplying(true);
    const r = await run(setCurrentVariant(screen.id, selected), 'Меню отправлено на экран');
    setApplying(false);
    if (!r) return;
    setStep(0);
    // имитация телевизора: скачал → показал (таймеры живут, даже если уйти со страницы)
    setTimeout(() => setStep(1), 3500);
    setTimeout(() => {
      simulateScreenAck(screen.id);
      setStep(2);
      toast.success(`${screen.name}: новое меню на экране`);
    }, 9000);
  };

  return (
    <>
      <PageHeader
        back={
          <Link to={`/locations/${location.id}`} className="mb-3 inline-flex min-h-9 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />{location.name}
          </Link>
        }
        title={<span className="flex flex-wrap items-center gap-x-3 gap-y-1">{screen.name}<StatusBadge status={status} /></span>}
        subtitle={`${location.name} · ${portrait ? 'вертикальный' : 'горизонтальный'} · ${screen.model}${screen.comment ? ` · ${screen.comment}` : ''}`}
      />
      <div className="grid gap-6 pb-24 lg:grid-cols-5 lg:pb-0">
        <div className="space-y-6 lg:col-span-3">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-b from-muted to-muted/30 p-4 sm:p-6">
              <div className={cn('mx-auto', portrait ? 'w-44 sm:w-56' : 'w-full')}>
                <div className="rounded-[18px] bg-zinc-900 p-2 shadow-xl ring-1 ring-black/10">
                  <VariantPreview variantId={screen.shownVariantId} portrait={portrait} className="rounded-lg" />
                </div>
                <div className="mx-auto h-2 w-1/4 rounded-b-xl bg-zinc-300 dark:bg-zinc-700" />
                <div className="mx-auto h-1 w-1/3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x border-t text-center text-sm">
              <div className="p-3">
                <div className="text-xs text-muted-foreground">Сейчас на экране</div>
                <div className="mt-0.5 font-medium leading-snug">{shown?.name ?? 'Заглушка'}</div>
              </div>
              <div className="p-3">
                <div className="text-xs text-muted-foreground">Версия экрана</div>
                <div className="mt-0.5 font-medium">{screen.shownVersion}{screen.shownVersion !== screen.version && <span className="text-sky-600"> → {screen.version}</span>}</div>
              </div>
              <div className="p-3">
                <div className="text-xs text-muted-foreground">На связи</div>
                <div className="mt-0.5 font-medium leading-snug">{never ? 'не подключался' : ago(screen.lastSeenAt)}</div>
              </div>
            </div>
          </Card>

          {stepIdx !== null && (
            <Card className="p-5">
              <div className="mb-4 text-sm font-medium">{stepIdx < 2 ? 'Телевизор получает новое меню…' : 'Новое меню показывается на экране'}</div>
              <Stepper step={stepIdx} />
              {stepIdx < 2 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Пока меню скачивается, телевизор продолжает показывать прежнее. На реальном телевизоре смена занимает около одного интервала связи (~5 минут) плюс время скачивания, в демо это ускорено.
                </p>
              )}
            </Card>
          )}

          <Tabs.Root defaultValue="menu">
            <Tabs.List className="mb-4 inline-flex rounded-xl bg-muted p-1">
              {[['menu', 'Выбрать меню'], ['history', 'История']].map(([v, l]) => (
                <Tabs.Trigger key={v} value={v} className="min-h-10 rounded-lg px-5 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-soft">
                  {l}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <Tabs.Content value="menu">
              {available.length === 0 ? (
                <EmptyState icon={SlidersHorizontal} title="Нет доступных вариантов" hint="Админ ещё не сделал ни одного варианта доступным для этого телевизора." />
              ) : (
                <>
                  {currentHidden && (
                    <p className="mb-3 rounded-xl bg-amber-500/15 px-3 py-2 text-sm">
                      Текущее меню убрано из списка доступных: оно остаётся на экране, но выбрать его снова будет нельзя.
                    </p>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {available.map((v) => {
                      const on = selected === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelected(v.id)}
                          aria-pressed={on}
                          className={cn('overflow-hidden rounded-2xl border bg-card text-left transition-all active:scale-[0.99]', on ? 'border-primary ring-2 ring-primary/30' : 'hover:border-primary/40')}
                        >
                          <div className="flex justify-center bg-muted/60 p-3">
                            <div className={portrait ? 'w-20' : 'w-full'}><VariantPreview variantId={v.id} portrait={portrait} className="shadow-md" /></div>
                          </div>
                          <div className="flex items-center gap-2 p-3">
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium leading-snug">{v.name}</div>
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {screen.variantId === v.id ? <span className="font-medium text-emerald-600">Выбрано сейчас</span> : v.standard ? 'Стандартный' : 'Только для вашей точки'}
                              </div>
                            </div>
                            <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
                              {on && <Check className="h-3.5 w-3.5" />}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-3 backdrop-blur lg:static lg:mt-4 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                    <div className="mx-auto flex max-w-7xl items-center gap-3 lg:justify-end">
                      <div className="min-w-0 flex-1 text-sm lg:hidden">
                        <div className="truncate font-medium">{variants.find((v) => v.id === selected)?.name ?? 'Выберите меню'}</div>
                        <div className="text-xs text-muted-foreground">{busyDelivery ? 'Подождите, меню ещё доставляется' : selected === screen.variantId ? 'Уже на экране' : 'Готово к отправке'}</div>
                      </div>
                      <Button size="lg" onClick={apply} disabled={!canApply} className="shrink-0">
                        {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Применить
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Tabs.Content>
            <Tabs.Content value="history">
              {history.loading ? (
                <Skeleton className="h-32" />
              ) : history.data!.length === 0 ? (
                <EmptyState icon={History} title="Переключений пока не было" />
              ) : (
                <Card className="divide-y">
                  {history.data!.map((h) => (
                    <div key={h.id} className="p-3.5 text-sm">
                      <div className="flex flex-wrap justify-between gap-x-3"><span className="font-medium">{h.userName}</span><span className="text-muted-foreground">{fmtDate(h.createdAt)}</span></div>
                      <div className="mt-0.5 text-muted-foreground">
                        {variants.find((v) => v.id === h.fromVariantId)?.name ?? '—'} → <span className="text-foreground">{variants.find((v) => v.id === h.toVariantId)?.name ?? '—'}</span>
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </Tabs.Content>
          </Tabs.Root>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><Clock className="h-4 w-4 text-muted-foreground" />Состояние</h2>
            <dl className="space-y-3 text-sm">
              <Row label="Статус"><StatusBadge status={status} /></Row>
              <Row label="Версия">показана <b>{screen.shownVersion}</b> / выбрана <b>{screen.version}</b></Row>
              <Row label="Последнее соединение">{never ? 'ещё не подключался' : ago(screen.lastSeenAt)}</Row>
              <Row label="Текущее меню">{current?.name ?? '—'}</Row>
              <Row label="Модель">{screen.model}</Row>
              {screen.comment && <Row label="Комментарий">{screen.comment}</Row>}
              {screen.lastError && status === 'error' && <Row label="Ошибка"><span className="text-red-600 dark:text-red-400">{screen.lastError}</span></Row>}
            </dl>
            <div className="mt-4 border-t pt-4">
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Ссылка для URL Launcher телевизора</div>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-2.5 py-2.5 text-xs">{link}</code>
                <Button size="icon" variant="outline" aria-label="Скопировать ссылку" onClick={() => { void navigator.clipboard?.writeText(link); toast.success('Ссылка скопирована'); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Адрес собран из кода кофейни и номера телевизора, меню не секретное.</p>
              <Button asChild variant="soft" size="sm" className="mt-2 w-full">
                <a href={demoPlayerPath(location.code, screen.number)} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Открыть заглушку плеера (как на ТВ)</a>
              </Button>
            </div>
          </Card>

          {isAdmin && (
            <Card className="space-y-2 p-5">
              <h2 className="mb-2 font-semibold">Администрирование</h2>
              <Button variant="outline" className="w-full justify-start" onClick={() => { setAllowDraft(available.map((v) => v.id)); setAllowDlg(true); }}>
                <Layers className="h-4 w-4" />Доступные варианты
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setConfirm('cache')}><Eraser className="h-4 w-4" />Сбросить кэш</Button>
              <Button variant="outline" className="w-full justify-start text-red-600" onClick={() => setConfirm('delete')}><Trash2 className="h-4 w-4" />Удалить экран</Button>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'cache'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Сбросить кэш экрана?"
        description="Телевизор заново скачает всё меню. Это займёт несколько минут."
        confirmLabel="Сбросить"
        onConfirm={async () => {
          try {
            await resetScreenCache(screen.id);
            toast.success('Команда сброса кэша отправлена');
          } catch (e) {
            toast.error(errMsg(e));
            return;
          }
          setStep(1);
          setTimeout(() => { simulateScreenAck(screen.id); setStep(2); }, 6000);
        }}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Удалить экран?"
        description="После удаления физический телевизор перестанет получать обновления. Ссылка перестанет работать."
        confirmLabel="Удалить"
        destructive
        onConfirm={async () => {
          try {
            await deleteScreen(screen.id);
          } catch (e) {
            toast.error(errMsg(e));
            return;
          }
          toast.success('Экран удалён');
          nav(`/locations/${location.id}`);
        }}
      />
      <Dialog open={allowDlg} onOpenChange={setAllowDlg}>
        <DialogContent title="Доступные варианты" description="Стандартные варианты можно отключить для этого телевизора, нестандартные — назначить ему. Ориентация должна совпадать.">
          <div className="space-y-2">
            {variants.filter((v) => v.orientation === screen.orientation).map((v) => (
              <label key={v.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 hover:bg-muted">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                  checked={allowDraft.includes(v.id)}
                  onChange={(e) => setAllowDraft((d) => (e.target.checked ? [...d, v.id] : d.filter((x) => x !== v.id)))}
                />
                <span className="flex-1 text-sm">{v.name}</span>
                <span className="text-xs text-muted-foreground">{v.standard ? 'стандартный' : 'особый'}</span>
              </label>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAllowDlg(false)}>Отмена</Button>
            <Button onClick={async () => { await run(updateScreenVariants(screen.id, allowDraft), 'Список вариантов сохранён'); setAllowDlg(false); }}>Сохранить</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
