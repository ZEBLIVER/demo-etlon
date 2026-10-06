import { useRef, useState, type DragEvent } from 'react';
import { Film, Image as ImageIcon, Pencil, Search, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { deleteMedia, getMedia, renameMedia, uploadMedia } from '@/api';
import { EmptyState, ErrorView, errMsg, GridSkeleton, PageHeader, run, useApi } from '@/components/common';
import { MenuPreview } from '@/components/MenuPreview';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, Input, Progress } from '@/components/ui/primitives';
import { useStore } from '@/store';
import { cn, fmtSize, plural } from '@/lib/utils';

type Filter = 'all' | 'image' | 'video';

export default function MediaPage() {
  const { data, error, loading, reload } = useApi(getMedia, []);
  const variants = useStore((s) => s.variants);
  const media = useStore((s) => s.media);
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [dlg, setDlg] = useState(false);
  const [drag, setDrag] = useState(false);
  const [upload, setUpload] = useState<{ name: string; pct: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  if (error) return <ErrorView error={error} />;

  const list = (data ? media : []).filter((m) => (filter === 'all' || m.type === filter) && m.name.toLowerCase().includes(q.toLowerCase()));
  const usage = (id: string) => variants.filter((v) => v.mediaId === id);

  const startUpload = async (files: File[]) => {
    let ok = 0;
    for (const file of files) {
      for (let p = 0; p <= 100; p += 20) {
        setUpload({ name: file.name, pct: p });
        await new Promise((r) => setTimeout(r, 90));
      }
      try {
        await uploadMedia({ name: file.name, size: file.size, type: file.type });
        ok++;
      } catch (e) {
        toast.error(errMsg(e)); // понятная причина отказа: формат, повреждён, дубликат
      }
    }
    setUpload(null);
    if (ok) {
      toast.success(ok === 1 ? 'Файл загружен' : `Загружено файлов: ${ok}`);
      setDlg(false);
      void reload(true);
    }
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files.length) void startUpload([...e.dataTransfer.files]);
  };

  const FILTERS: [Filter, string][] = [['all', 'Все'], ['image', 'Картинки'], ['video', 'Видео']];

  return (
    <>
      <PageHeader title="Медиатека" subtitle="Картинки и видео для меню на телевизорах" actions={<Button onClick={() => setDlg(true)}><UploadCloud className="h-4 w-4" />Загрузить</Button>} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl bg-muted p-1">
          {FILTERS.map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={cn('rounded-lg px-4 py-1.5 text-sm font-medium transition-colors', filter === v ? 'bg-card shadow-soft' : 'text-muted-foreground')}>
              {l}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Поиск по названию" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {loading ? (
        <GridSkeleton n={8} h="h-60" />
      ) : list.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Файлов не найдено" hint="Измените фильтр или загрузите новый файл." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {list.map((m) => {
            const used = usage(m.id);
            const portrait = m.height > m.width;
            return (
              <Card key={m.id} className="rise overflow-hidden">
                <div className="flex h-44 items-center justify-center bg-muted/60 p-3">
                  <div className={portrait ? 'h-full' : 'w-full'}>
                    <div className={portrait ? 'h-full [&>div]:h-full [&>div]:w-auto' : ''}><MenuPreview media={m} compact={portrait} /></div>
                  </div>
                </div>
                <div className="space-y-1 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate font-medium" title={m.name}>{m.name}</div>
                    <button
                      aria-label="Переименовать"
                      className="ml-auto rounded-lg p-1 text-muted-foreground hover:bg-muted"
                      onClick={() => setRenaming({ id: m.id, name: m.name })}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="Удалить"
                      className="rounded-lg p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                      onClick={async () => {
                        if (used.length) {
                          toast.error(`Нельзя удалить: файл используется в ${used.length} ${plural(used.length, 'варианте', 'вариантах', 'вариантах')} (${used.map((v) => v.name).join(', ')})`);
                          return;
                        }
                        await run(deleteMedia(m.id), 'Файл удалён');
                        void reload(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {m.type === 'video' ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                    {fmtSize(m.sizeBytes)} · {m.width}×{m.height}{m.durationSec ? ` · ${m.durationSec} с` : ''}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {used.length ? `Используется в ${used.length} ${plural(used.length, 'варианте', 'вариантах', 'вариантах')}` : 'Не используется'}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog open={dlg} onOpenChange={(o) => !upload && setDlg(o)}>
        <DialogContent title="Загрузка файла" description="Можно выбрать несколько файлов сразу. Принимаются JPG, WEBP, MP4, WEBM, до 10 МБ (в демо без реальной загрузки).">
          {upload ? (
            <div className="space-y-3 py-4">
              <div className="truncate text-sm font-medium">{upload.name}</div>
              <Progress value={upload.pct} />
              <div className="text-xs text-muted-foreground">Загрузка… {upload.pct}%</div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => input.current?.click()}
              className={cn('flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors', drag ? 'border-primary bg-accent' : 'hover:bg-muted')}
            >
              <UploadCloud className="mb-3 h-10 w-10 text-primary" />
              <div className="font-medium">Перетащите файл сюда</div>
              <div className="mt-1 text-sm text-muted-foreground">или нажмите, чтобы выбрать на компьютере</div>
              <input ref={input} type="file" multiple accept="image/*,video/*" hidden onChange={(e) => { const f = e.target.files ? [...e.target.files] : []; if (f.length) void startUpload(f); e.target.value = ''; }} />
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent title="Название файла" description="Сам файл не меняется. Новый прайс = загрузить новую картинку и поставить её в вариант вместо старой.">
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!renaming) return;
              await run(renameMedia(renaming.id, renaming.name), 'Название изменено');
              setRenaming(null);
              void reload(true);
            }}
          >
            <Input value={renaming?.name ?? ''} onChange={(e) => setRenaming((r) => r && { ...r, name: e.target.value })} required autoFocus />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRenaming(null)}>Отмена</Button>
              <Button type="submit">Сохранить</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
