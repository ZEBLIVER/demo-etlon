import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Monitor, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createVariant, deleteVariant, getVariant, updateVariant } from '@/api';
import { AssignVariantDialog } from '@/components/AssignVariantDialog';
import { ErrorView, PageHeader, errMsg, run, useApi } from '@/components/common';
import { MenuPreview } from '@/components/MenuPreview';
import { PlayerStub } from '@/components/PlayerStub';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Card, Chip, Input, Label, Select, Skeleton } from '@/components/ui/primitives';
import { useStore } from '@/store';
import { cn, fmtSize, plural } from '@/lib/utils';
import type { MenuVariant } from '@/lib/types';

/** Редактор варианта: название, ориентация и один файл из медиатеки (картинка висит постоянно, видео крутится по кругу) */
export default function VariantEditorPage() {
  const { id = '' } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { data, error, loading } = useApi<MenuVariant>(
    () =>
      isNew
        ? Promise.resolve({ id: '', name: sp.get('name') ?? 'Новый вариант', orientation: sp.get('o') === 'portrait' ? 'portrait' : 'landscape', mediaId: '', standard: true, updatedAt: new Date().toISOString(), version: 0 })
        : getVariant(id),
    [id],
  );
  const media = useStore((s) => s.media);
  const screens = useStore((s) => s.screens);
  const live = useStore((s) => s.variants.find((v) => v.id === id));
  const [name, setName] = useState('');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [mediaId, setMediaId] = useState('');
  const [dirty, setDirty] = useState(false);
  const [assign, setAssign] = useState(false);
  const [del, setDel] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (data) {
      setName(data.name);
      setOrientation(data.orientation);
      setMediaId(data.mediaId);
      setDirty(isNew);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (error) return <ErrorView error={error} />;
  if (loading || !data) return <Skeleton className="h-96" />;

  const onScreens = screens.filter((s) => s.variantId === id).length;
  const picked = media.find((m) => m.id === mediaId);
  const pickable = media.filter((m) => (m.height > m.width) === (orientation === 'portrait'));
  const availableOn = live ? screens.filter((s) => s.orientation === live.orientation && (live.standard ? !s.disabledVariantIds.includes(live.id) : s.allowedVariantIds.includes(live.id))).length : 0;

  const save = async () => {
    if (!mediaId) {
      toast.error('Выберите файл: вариант без файла сохранить нельзя');
      return;
    }
    if (isNew) {
      const v = await run(createVariant({ name: name.trim() || data.name, orientation, mediaId, standard: true }), 'Вариант создан');
      if (v) nav(`/variants/${v.id}`, { replace: true });
      return;
    }
    const r = await run(updateVariant(id, { name: name.trim() || data.name, orientation, mediaId }), onScreens ? 'Вариант сохранён, экраны обновятся сами' : 'Вариант сохранён');
    if (r) setDirty(false);
  };
  const touch = () => setDirty(true);

  return (
    <>
      <PageHeader
        back={<Link to="/variants" className="mb-3 inline-flex min-h-9 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Все варианты</Link>}
        title={isNew ? 'Новый вариант' : name || 'Вариант'}
        subtitle={isNew ? 'Выберите файл из медиатеки, без файла вариант сохранить нельзя' : `Версия ${data.version} · ${onScreens ? `показывается на ${onScreens} ${plural(onScreens, 'экране', 'экранах', 'экранах')}` : 'сейчас не показывается'}`}
        actions={
          <>
            {!isNew && <Button variant="outline" onClick={() => setDel(true)}><Trash2 className="h-4 w-4" />Удалить</Button>}
            <Button onClick={() => (onScreens && !isNew ? setConfirm(true) : void save())} disabled={!dirty}><Save className="h-4 w-4" />Сохранить</Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card className="grid gap-4 p-5 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="vn">Название</Label>
              <Input id="vn" value={name} onChange={(e) => { setName(e.target.value); touch(); }} />
            </div>
            <div>
              <Label htmlFor="vo">Ориентация</Label>
              <Select
                id="vo"
                value={orientation}
                onChange={(e) => {
                  const o = e.target.value as 'landscape' | 'portrait';
                  setOrientation(o);
                  if (picked && (picked.height > picked.width) !== (o === 'portrait')) setMediaId('');
                  touch();
                }}
              >
                <option value="landscape">Горизонтальная</option>
                <option value="portrait">Вертикальная</option>
              </Select>
            </div>
          </Card>

          {!isNew && (
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span>{live?.standard ? 'Стандартный вариант' : 'Особый вариант'}: доступен на {availableOn} {plural(availableOn, 'телевизоре', 'телевизорах', 'телевизорах')}</span>
              </div>
              <Button variant="soft" size="sm" onClick={() => setAssign(true)}>Где доступен</Button>
            </Card>
          )}

          <div>
            <h2 className="mb-3 font-semibold">Файл из медиатеки</h2>
            {pickable.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Нет подходящих файлов. Загрузите файл нужной ориентации в медиатеку.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {pickable.map((m) => {
                  const on = m.id === mediaId;
                  return (
                    <button
                      key={m.id}
                      aria-pressed={on}
                      onClick={() => { setMediaId(m.id); touch(); }}
                      className={cn('relative rounded-xl border bg-card p-2 text-left transition-all active:scale-[0.98]', on ? 'border-primary ring-2 ring-primary/30' : 'hover:border-primary/40')}
                    >
                      <div className={orientation === 'portrait' ? 'mx-auto w-20' : ''}><MenuPreview media={m} compact /></div>
                      <div className="mt-1.5 truncate text-xs font-medium">{m.name}</div>
                      <div className="text-[11px] text-muted-foreground">{m.type === 'video' ? 'Видео' : 'Картинка'} · {fmtSize(m.sizeBytes)}</div>
                      {on && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-2">
          <Card className="p-5 lg:sticky lg:top-24">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
              Предпросмотр
              {picked && <Chip>{picked.type === 'video' ? 'видео крутится по кругу' : 'картинка висит постоянно'}</Chip>}
            </div>
            <div className={cn('mx-auto rounded-[18px] bg-zinc-900 p-2 shadow-xl', orientation === 'portrait' ? 'w-44' : 'w-full')}>
              {picked ? <MenuPreview media={picked} className="rounded-lg" /> : <PlayerStub portrait={orientation === 'portrait'} />}
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">Каждое сохранение создаёт новую версию, телевизор скачивает её целиком.</p>
          </Card>
        </div>
      </div>

      {!isNew && live && <AssignVariantDialog open={assign} onOpenChange={setAssign} variantId={id} orientation={live.orientation} standard={live.standard} />}
      <ConfirmDialog
        open={del}
        onOpenChange={setDel}
        title="Удалить вариант?"
        description="Вариант, который сейчас показывается хотя бы на одном телевизоре, удалить нельзя."
        confirmLabel="Удалить"
        destructive
        onConfirm={async () => {
          try {
            await deleteVariant(id);
          } catch (e) {
            toast.error(errMsg(e));
            return;
          }
          toast.success('Вариант удалён');
          nav('/variants');
        }}
      />
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Сохранить изменения?"
        description={`Вариант показывается на ${onScreens} ${plural(onScreens, 'экране', 'экранах', 'экранах')}, они обновятся сами.`}
        confirmLabel="Сохранить"
        onConfirm={save}
      />
    </>
  );
}
