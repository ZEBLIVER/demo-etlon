import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileUp, Monitor, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteVariant, getVariant, updateVariant } from '@/api';
import { AssignVariantDialog } from '@/components/AssignVariantDialog';
import { ErrorView, PageHeader, errMsg, run, useApi } from '@/components/common';
import { MenuPreview } from '@/components/MenuPreview';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Card, Chip, Input, Label, Skeleton } from '@/components/ui/primitives';
import { useStore } from '@/store';
import { fmtDate, fmtSize, plural } from '@/lib/utils';

/** Вариант меню: название, файл (можно заменить), где доступен. Ориентация задаётся при загрузке и не меняется. */
export default function MenuItemPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { data, error, loading } = useApi(() => getVariant(id), [id]);
  const live = useStore((s) => s.variants.find((v) => v.id === id));
  const screens = useStore((s) => s.screens);
  const [name, setName] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [assign, setAssign] = useState(false);
  const [del, setDel] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data) setName(data.name);
  }, [data]);

  if (error) return <ErrorView error={error} />;
  if (loading || !data || !live) return <Skeleton className="h-96" />;

  const onScreens = screens.filter((s) => s.variantId === id).length;
  const availableOn = screens.filter((s) => s.orientation === live.orientation && (live.standard ? !s.disabledVariantIds.includes(live.id) : s.allowedVariantIds.includes(live.id))).length;
  const dirty = name.trim() !== live.name || !!newFile;

  const save = async () => {
    const r = await run(
      updateVariant(id, { name, file: newFile ? { name: newFile.name, size: newFile.size, type: newFile.type } : undefined }),
      onScreens ? 'Сохранено, экраны обновятся сами' : 'Вариант сохранён',
    );
    if (r) setNewFile(null);
  };

  return (
    <>
      <PageHeader
        back={<Link to="/menu" className="mb-3 inline-flex min-h-9 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Всё меню</Link>}
        title={live.name}
        subtitle={`Версия ${live.version} · ${onScreens ? `показывается на ${onScreens} ${plural(onScreens, 'экране', 'экранах', 'экранах')}` : 'сейчас не показывается'}`}
        actions={
          <>
            <Button variant="outline" onClick={() => setDel(true)}><Trash2 className="h-4 w-4" />Удалить</Button>
            <Button onClick={() => (onScreens ? setConfirm(true) : void save())} disabled={!dirty}><Save className="h-4 w-4" />Сохранить</Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card className="space-y-4 p-5">
            <div>
              <Label htmlFor="vn">Название</Label>
              <Input id="vn" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip>{live.orientation === 'portrait' ? 'Вертикальный' : 'Горизонтальный'}</Chip>
              <Chip>{live.kind === 'video' ? 'Видео крутится по кругу' : 'Картинка висит постоянно'}</Chip>
              <Chip>{fmtSize(live.sizeBytes)}</Chip>
              <Chip>{live.width}×{live.height}</Chip>
              {live.durationSec && <Chip>{live.durationSec} с</Chip>}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Файл</h2>
              <Button variant="soft" size="sm" onClick={() => input.current?.click()}><FileUp className="h-4 w-4" />Заменить файл</Button>
              <input ref={input} type="file" accept="image/*,video/*" hidden onChange={(e) => { setNewFile(e.target.files?.[0] ?? null); e.target.value = ''; }} />
            </div>
            <div className="text-sm">
              {newFile ? (
                <p className="rounded-xl bg-sky-500/10 px-3 py-2">Будет загружен новый файл «{newFile.name}» ({fmtSize(newFile.size)}). Сохранение создаст версию {live.version + 1}; телевизоры скачают её целиком.</p>
              ) : (
                <p className="text-muted-foreground">Сейчас: «{live.fileName}». Загружен {fmtDate(live.createdAt)}. Новый прайс = заменить файл или загрузить новый вариант.</p>
              )}
            </div>
          </Card>

          <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2 text-sm">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span>{live.standard ? 'Стандартный вариант' : 'Особый вариант'}: доступен на {availableOn} {plural(availableOn, 'телевизоре', 'телевизорах', 'телевизорах')}</span>
            </div>
            <Button variant="soft" size="sm" onClick={() => setAssign(true)}>Где доступен</Button>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="p-5 lg:sticky lg:top-24">
            <div className="mb-3 text-sm font-medium">Предпросмотр</div>
            <div className={`mx-auto rounded-[18px] bg-zinc-900 p-2 shadow-xl ${live.orientation === 'portrait' ? 'w-44' : 'w-full'}`}>
              <MenuPreview variant={live} className="rounded-lg" />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">Каждое сохранение создаёт новую версию с номером.</p>
          </Card>
        </div>
      </div>

      <AssignVariantDialog open={assign} onOpenChange={setAssign} variantId={id} orientation={live.orientation} standard={live.standard} />
      <ConfirmDialog
        open={del}
        onOpenChange={setDel}
        title="Удалить вариант и файл?"
        description="Вариант, который сейчас показывается хотя бы на одном телевизоре, удалить нельзя: система покажет, где он стоит."
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
          nav('/menu');
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
