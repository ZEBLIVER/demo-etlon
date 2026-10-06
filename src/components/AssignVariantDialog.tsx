import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { setVariantAvailability } from '@/api';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import { errMsg } from './common';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { Input, Select } from './ui/primitives';

/**
 * Доступность варианта: стандартный (всем телевизорам подходящей ориентации, можно отключить исключения)
 * или только выбранным телевизорам (как прайс Брусники и Лета). Фильтр по кофейне, выбор сразу нескольких.
 */
export function AssignVariantDialog({ open, onOpenChange, variantId, orientation, standard: initialStandard }: {
  open: boolean; onOpenChange: (o: boolean) => void; variantId: string; orientation: 'landscape' | 'portrait'; standard: boolean;
}) {
  const screens = useStore((s) => s.screens);
  const locations = useStore((s) => s.locations).filter((l) => !l.archived);
  const [standard, setStandard] = useState(initialStandard);
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [loc, setLoc] = useState('');
  const [busy, setBusy] = useState(false);

  const matching = screens.filter((s) => s.orientation === orientation && locations.some((l) => l.id === s.locationId));
  const initPicked = (std: boolean) =>
    matching.filter((s) => (std ? !s.disabledVariantIds.includes(variantId) : s.allowedVariantIds.includes(variantId))).map((s) => s.id);

  useEffect(() => {
    if (open) {
      setStandard(initialStandard);
      setPicked(initPicked(initialStandard));
      setQ('');
      setLoc('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, variantId]);

  const switchMode = (std: boolean) => {
    setStandard(std);
    setPicked(std ? matching.map((s) => s.id) : initPicked(false));
  };

  const groups = locations
    .filter((l) => (!loc || l.id === loc) && l.name.toLowerCase().includes(q.toLowerCase()))
    .map((l) => ({ l, list: screens.filter((s) => s.locationId === l.id) }))
    .filter((g) => g.list.length);
  const selectable = groups.flatMap((g) => g.list).filter((s) => s.orientation === orientation).map((s) => s.id);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Где доступен вариант" description="Управляющий видит вариант в списке выбора только на телевизорах, где он доступен." className="max-w-xl">
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-sm font-medium">
          {[[true, 'Стандартный'], [false, 'Только выбранным']].map(([v, l]) => (
            <button key={String(v)} onClick={() => switchMode(v as boolean)} className={cn('rounded-lg px-3 py-2 transition-colors', standard === v ? 'bg-card shadow-soft' : 'text-muted-foreground')}>
              {l as string}
            </button>
          ))}
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          {standard
            ? 'Доступен всем телевизорам этой ориентации, в том числе новым. Снимите галочку у телевизоров, где его нужно отключить.'
            : 'Доступен только отмеченным телевизорам, например прайс для Брусники и Лета.'}
        </p>
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          <Input placeholder="Поиск по кофейне" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={loc} onChange={(e) => setLoc(e.target.value)} aria-label="Кофейня">
            <option value="">Все кофейни</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        </div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Доступен на: {picked.length}</span>
          <div className="flex gap-3">
            <button className="font-medium text-primary hover:underline" onClick={() => setPicked((p) => [...new Set([...p, ...selectable])])}>Выбрать все видимые</button>
            <button className="text-muted-foreground hover:underline" onClick={() => setPicked((p) => p.filter((x) => !selectable.includes(x)))}>Снять</button>
          </div>
        </div>
        <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {groups.map(({ l, list }) => (
            <div key={l.id}>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{l.name}</div>
              <div className="space-y-1">
                {list.map((s) => {
                  const bad = s.orientation !== orientation;
                  return (
                    <label key={s.id} className={cn('flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 text-sm', bad ? 'opacity-50' : 'cursor-pointer hover:bg-muted')}>
                      <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" disabled={bad} checked={picked.includes(s.id)} onChange={() => toggle(s.id)} />
                      <span className="flex-1">{s.name}</span>
                      <span className="text-xs text-muted-foreground">{bad ? 'другая ориентация' : s.orientation === 'portrait' ? 'вертикальный' : 'горизонтальный'}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await setVariantAvailability(variantId, standard, picked);
                toast.success('Доступность сохранена');
                onOpenChange(false);
              } catch (e) {
                toast.error(errMsg(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
