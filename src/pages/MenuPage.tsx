import { useRef, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { Film, Image as ImageIcon, Layers, Search, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import { getVariants, uploadVariant } from '@/api';
import { EmptyState, ErrorView, GridSkeleton, PageHeader, errMsg, useApi } from '@/components/common';
import { VariantPreview } from '@/components/VariantPreview';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, Chip, Input, Progress, Select } from '@/components/ui/primitives';
import { useStore } from '@/store';
import { ago, cn, fmtSize, plural } from '@/lib/utils';

type Filter = 'all' | 'image' | 'video';
interface Row { id: number; file: File; name: string; orientation: 'landscape' | 'portrait'; error?: string }

/** Раздел «Меню»: здесь админ загружает картинки и видео. Файл + название + ориентация = вариант меню. */
export default function MenuPage() {
  const { data, error, loading, reload } = useApi(getVariants, []);
  const variants = useStore((s) => s.variants);
  const screens = useStore((s) => s.screens);
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [dlg, setDlg] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [drag, setDrag] = useState(false);
  const [pct, setPct] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  if (error) return <ErrorView error={error} />;

  const list = (data ? variants : []).filter((v) => (filter === 'all' || v.kind === filter) && v.name.toLowerCase().includes(q.toLowerCase()));

  const addFiles = (files: File[]) =>
    setRows((r) => [...r, ...files.map((file) => ({ id: ++seq.current, file, name: file.name.replace(/\.[^.]+$/, ''), orientation: 'landscape' as const }))]);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files.length) addFiles([...e.dataTransfer.files]);
  };

  const submit = async () => {
    const left: Row[] = [];
    let ok = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      for (let p = 0; p <= 100; p += 25) {
        setPct(Math.round(((i + p / 100) / rows.length) * 100));
        await new Promise((res) => setTimeout(res, 70));
      }
      try {
        await uploadVariant({ name: r.file.name, size: r.file.size, type: r.file.type }, { name: r.name, orientation: r.orientation });
        ok++;
      } catch (e) {
        left.push({ ...r, error: errMsg(e) }); // понятная причина: формат, битый, тяжелее 10 МБ, дубликат
      }
    }
    setPct(null);
    setRows(left);
    if (ok) {
      toast.success(ok === 1 ? 'Вариант добавлен в меню' : `Добавлено вариантов: ${ok}`);
      void reload(true);
    }
    if (!left.length) setDlg(false);
  };

  const FILTERS: [Filter, string][] = [['all', 'Все'], ['image', 'Картинки'], ['video', 'Видео']];

  return (
    <>
      <PageHeader
        title="Меню"
        subtitle="Загрузите картинку или видео, задайте название и ориентацию: это вариант меню, который можно поставить на телевизор"
        actions={<Button onClick={() => { setRows([]); setDlg(true); }}><UploadCloud className="h-4 w-4" />Загрузить</Button>}
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl bg-muted p-1">
          {FILTERS.map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={cn('min-h-9 rounded-lg px-4 text-sm font-medium transition-colors', filter === v ? 'bg-card shadow-soft' : 'text-muted-foreground')}>
              {l}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground sm:top-3" />
          <Input className="pl-9" placeholder="Поиск по названию" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {loading ? (
        <GridSkeleton n={8} h="h-60" />
      ) : list.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Ничего не найдено" hint="Измените фильтр или загрузите файл." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {list.map((v) => {
            const on = screens.filter((s) => s.variantId === v.id).length;
            const portrait = v.orientation === 'portrait';
            return (
              <Link key={v.id} to={`/menu/${v.id}`}>
                <Card className="rise h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <div className={cn('flex items-center justify-center bg-gradient-to-b from-muted to-muted/40 p-3', portrait && 'h-52')}>
                    <div className={portrait ? 'h-full' : 'w-full'}>
                      <div className={portrait ? 'h-full [&>div]:h-full [&>div]:w-auto' : ''}><VariantPreview variantId={v.id} portrait={portrait} className="shadow-md" /></div>
                    </div>
                  </div>
                  <div className="space-y-1.5 p-3.5">
                    <div className="truncate font-semibold" title={v.name}>{v.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {v.kind === 'video' ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                      {fmtSize(v.sizeBytes)} · {v.width}×{v.height}{v.durationSec ? ` · ${v.durationSec} с` : ''}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Chip className={v.standard ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-accent'}>{v.standard ? 'Стандартный' : 'Особый'}</Chip>
                      <Chip>v{v.version}</Chip>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Layers className="h-3.5 w-3.5" />
                      {on ? `На ${on} ${plural(on, 'экране', 'экранах', 'экранах')}` : 'Сейчас не показывается'} · {ago(v.updatedAt)}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Dialog open={dlg} onOpenChange={(o) => pct === null && setDlg(o)}>
        <DialogContent title="Загрузка в меню" description="Можно выбрать несколько файлов сразу. JPG, WEBP, MP4, WEBM, до 10 МБ (в демо без реальной загрузки)." className="max-w-xl">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => input.current?.click()}
            className={cn('flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors', drag ? 'border-primary bg-accent' : 'hover:bg-muted')}
          >
            <UploadCloud className="mb-2 h-9 w-9 text-primary" />
            <div className="font-medium">Перетащите файлы сюда</div>
            <div className="mt-0.5 text-sm text-muted-foreground">или нажмите, чтобы выбрать на компьютере</div>
            <input ref={input} type="file" multiple accept="image/*,video/*" hidden onChange={(e) => { if (e.target.files?.length) addFiles([...e.target.files]); e.target.value = ''; }} />
          </div>
          {rows.length > 0 && (
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
              {rows.map((r) => (
                <div key={r.id} className={cn('rounded-xl border p-2.5', r.error && 'border-red-500/50 bg-red-500/5')}>
                  <div className="flex items-center gap-2">
                    <Input value={r.name} onChange={(e) => setRows((l) => l.map((x) => (x.id === r.id ? { ...x, name: e.target.value, error: undefined } : x)))} aria-label="Название" className="h-10" />
                    <Select value={r.orientation} onChange={(e) => setRows((l) => l.map((x) => (x.id === r.id ? { ...x, orientation: e.target.value as Row['orientation'] } : x)))} aria-label="Ориентация" className="h-10 w-36 shrink-0">
                      <option value="landscape">Горизонт.</option>
                      <option value="portrait">Вертик.</option>
                    </Select>
                    <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Убрать" disabled={pct !== null} onClick={() => setRows((l) => l.filter((x) => x.id !== r.id))}><X className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">{r.file.name} · {fmtSize(r.file.size)}</div>
                  {r.error && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{r.error}</div>}
                </div>
              ))}
            </div>
          )}
          {pct !== null && <div className="mt-4"><Progress value={pct} /></div>}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" disabled={pct !== null} onClick={() => setDlg(false)}>Закрыть</Button>
            <Button disabled={!rows.length || pct !== null || rows.some((r) => !r.name.trim())} onClick={submit}>
              Загрузить{rows.length ? ` (${rows.length})` : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
