import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Archive, ArrowLeft, Copy, Monitor, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { archiveLocation, createScreen, getLocation, updateLocation } from '@/api';
import { EmptyState, ErrorView, GridSkeleton, PageHeader, run, useApi } from '@/components/common';
import { ScreenCard } from '@/components/ScreenCard';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, Dialog, DialogContent } from '@/components/ui/dialog';
import { Input, Label, Select, Skeleton } from '@/components/ui/primitives';
import { screenLink } from '@/lib/utils';
import { useCurrentUser } from '@/lib/auth';
import { useStore } from '@/store';
import type { Screen, TvModel } from '@/lib/types';

export default function LocationPage() {
  const { id = '' } = useParams();
  const isAdmin = useCurrentUser()?.role === 'ADMIN';
  const { data, error, loading, reload } = useApi(() => getLocation(id), [id]);
  const screens = useStore((s) => s.screens).filter((s) => s.locationId === id);
  const [dlg, setDlg] = useState(false);
  const [number, setNumber] = useState(1);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [model, setModel] = useState<TvModel>('Samsung PMF');
  const [comment, setComment] = useState('');
  const [editDlg, setEditDlg] = useState(false);
  const [lName, setLName] = useState('');
  const [lAddr, setLAddr] = useState('');
  const [archive, setArchive] = useState(false);
  const nav = useNavigate();
  const [created, setCreated] = useState<Screen | null>(null);
  const [busy, setBusy] = useState(false);

  if (error) return <ErrorView error={error} />;

  const open = () => {
    setNumber(Math.max(0, ...screens.map((s) => s.number)) + 1);
    setOrientation('landscape');
    setModel('Samsung PMF');
    setComment('');
    setCreated(null);
    setDlg(true);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await run(createScreen(id, { number, orientation, model, comment }), 'Экран добавлен');
    setBusy(false);
    if (r) {
      setCreated(r);
      void reload(true);
    }
  };

  return (
    <>
      <PageHeader
        back={<Link to="/locations" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Все кофейни</Link>}
        title={loading ? <Skeleton className="h-8 w-56" /> : data!.location.name}
        subtitle={data?.location.address}
        actions={isAdmin && (
          <>
            <Button variant="outline" onClick={() => { setLName(data?.location.name ?? ''); setLAddr(data?.location.address ?? ''); setEditDlg(true); }}><Pencil className="h-4 w-4" />Изменить</Button>
            <Button variant="outline" onClick={() => setArchive(true)}><Archive className="h-4 w-4" />Архивировать</Button>
            <Button onClick={open}><Plus className="h-4 w-4" />Добавить экран</Button>
          </>
        )}
      />
      {loading ? (
        <GridSkeleton n={3} h="h-72" />
      ) : screens.length === 0 ? (
        <EmptyState icon={Monitor} title="Экранов пока нет" hint={isAdmin ? 'Добавьте первый телевизор и вставьте ссылку в его URL Launcher.' : 'Обратитесь к администратору.'} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{screens.map((s) => <ScreenCard key={s.id} screen={s} />)}</div>
      )}
      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent title={created ? 'Экран создан' : 'Новый экран'}>
          {created ? (
            <div className="space-y-4">
              <div>
                <Label>Ссылка плеера</Label>
                <div className="flex gap-2">
                  <Input readOnly value={data ? screenLink(data.location.code, created.number) : ''} onFocus={(e) => e.currentTarget.select()} />
                  <Button variant="outline" onClick={() => { void navigator.clipboard?.writeText(data ? screenLink(data.location.code, created.number) : ''); toast.success('Ссылка скопирована'); }}>
                    <Copy className="h-4 w-4" />Скопировать
                  </Button>
                </div>
              </div>
              <p className="rounded-xl bg-accent px-3 py-2 text-sm">Вставьте эту ссылку в URL Launcher телевизора.</p>
              <div className="flex justify-end"><Button onClick={() => setDlg(false)}>Готово</Button></div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="sn">Номер телевизора</Label>
                <Input id="sn" type="number" min={1} value={number} onChange={(e) => setNumber(Number(e.target.value))} required />
                <p className="mt-1 text-xs text-muted-foreground">Входит в ссылку: {data ? screenLink(data.location.code, number || 1) : ''}. После создания не меняется.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="so">Ориентация</Label>
                  <Select id="so" value={orientation} onChange={(e) => setOrientation(e.target.value as 'landscape' | 'portrait')}>
                    <option value="landscape">Горизонтальная</option>
                    <option value="portrait">Вертикальная</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sr">Модель</Label>
                  <Select id="sr" value={model} onChange={(e) => setModel(e.target.value as TvModel)}>
                    <option>Samsung PMF</option><option>Samsung DBE</option>
                  </Select>
                </div>
              </div>
              <div><Label htmlFor="sc">Комментарий</Label><Input id="sc" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="например, над кассой" /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDlg(false)}>Отмена</Button>
                <Button type="submit" disabled={busy}>Добавить</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={editDlg} onOpenChange={setEditDlg}>
        <DialogContent title="Изменить кофейню">
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run(updateLocation(id, { name: lName, address: lAddr }), 'Изменения сохранены')) {
                setEditDlg(false);
                void reload(true);
              }
            }}
          >
            <div><Label htmlFor="ln">Название</Label><Input id="ln" value={lName} onChange={(e) => setLName(e.target.value)} required /></div>
            <div><Label htmlFor="la">Адрес</Label><Input id="la" value={lAddr} onChange={(e) => setLAddr(e.target.value)} required /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDlg(false)}>Отмена</Button>
              <Button type="submit">Сохранить</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={archive}
        onOpenChange={setArchive}
        title="Архивировать кофейню?"
        description="Кофейня закрылась: она пропадёт из списков и дашборда и будет убрана из учёток управляющих. История сохранится."
        confirmLabel="Архивировать"
        destructive
        onConfirm={async () => {
          if (await run(archiveLocation(id), 'Кофейня архивирована') !== undefined) nav('/locations');
        }}
      />
    </>
  );
}
