import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListVideo, Plus } from 'lucide-react';
import { getVariants } from '@/api';
import { EmptyState, ErrorView, GridSkeleton, PageHeader, useApi } from '@/components/common';
import { VariantPreview } from '@/components/VariantPreview';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, Chip, Input, Label, Select } from '@/components/ui/primitives';
import { useStore } from '@/store';
import { ago, plural } from '@/lib/utils';

export default function VariantsPage() {
  const { data, error, loading } = useApi(getVariants, []);
  const variants = useStore((s) => s.variants);
  const screens = useStore((s) => s.screens);
  const nav = useNavigate();
  const [dlg, setDlg] = useState(false);
  const [name, setName] = useState('');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  if (error) return <ErrorView error={error} />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    // вариант без файла сохранить нельзя: создаём его в редакторе, запись появится после выбора файла
    setDlg(false);
    nav(`/variants/new?name=${encodeURIComponent(name)}&o=${orientation}`);
  };

  return (
    <>
      <PageHeader
        title="Варианты меню"
        subtitle="Вариант — один файл из медиатеки, который целиком показывается на телевизоре"
        actions={<Button onClick={() => { setName(''); setDlg(true); }}><Plus className="h-4 w-4" />Создать вариант</Button>}
      />
      {loading || !data ? (
        <GridSkeleton h="h-60" />
      ) : variants.length === 0 ? (
        <EmptyState icon={ListVideo} title="Вариантов пока нет" hint="Выберите файл в медиатеке и соберите первый вариант." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {variants.map((v) => {
            const on = screens.filter((s) => s.variantId === v.id).length;
            return (
              <Link key={v.id} to={`/variants/${v.id}`}>
                <Card className="rise h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex h-44 justify-center bg-gradient-to-b from-muted to-muted/40 p-4">
                    <div className={v.orientation === 'portrait' ? 'h-full' : 'w-full'}>
                      <div className={v.orientation === 'portrait' ? 'h-full [&>div]:h-full [&>div]:w-auto' : ''}>
                        <VariantPreview variantId={v.id} portrait={v.orientation === 'portrait'} className="shadow-md" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="font-semibold leading-snug">{v.name}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Chip className={v.standard ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-accent'}>{v.standard ? 'Стандартный' : 'Особый'}</Chip>
                      <Chip>{v.orientation === 'portrait' ? 'Вертикальный' : 'Горизонтальный'}</Chip>
                      <Chip>версия {v.version}</Chip>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {on ? `Показывается на ${on} ${plural(on, 'экране', 'экранах', 'экранах')}` : 'Сейчас не показывается'} · изменён {ago(v.updatedAt)}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent title="Новый вариант меню">
          <form onSubmit={submit} className="space-y-4">
            <div><Label htmlFor="vn">Название</Label><Input id="vn" value={name} onChange={(e) => setName(e.target.value)} placeholder="например, Акцент на раф" required autoFocus /></div>
            <div>
              <Label htmlFor="vo">Ориентация</Label>
              <Select id="vo" value={orientation} onChange={(e) => setOrientation(e.target.value as 'landscape' | 'portrait')}>
                <option value="landscape">Горизонтальная</option>
                <option value="portrait">Вертикальная</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDlg(false)}>Отмена</Button>
              <Button type="submit">Далее</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
