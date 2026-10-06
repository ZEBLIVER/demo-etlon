import { useState, type FormEvent } from 'react';
import { changePassword } from '@/api';
import { toast } from 'sonner';
import { errMsg } from './common';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { Input, Label } from './ui/primitives';

/** forced=true: первый вход по временному паролю — закрыть окно нельзя, пока не задан свой пароль */
export function ChangePasswordDialog({ open, onOpenChange, forced }: { open: boolean; onOpenChange: (o: boolean) => void; forced?: boolean }) {
  const [oldP, setOldP] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (p1 !== p2) return;
    setBusy(true);
    try {
      await changePassword(p1, oldP);
      toast.success('Пароль изменён');
      setOldP(''); setP1(''); setP2('');
      onOpenChange(false);
    } catch (x) {
      toast.error(errMsg(x));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !forced && onOpenChange(o)}>
      <DialogContent
        title={forced ? 'Задайте свой пароль' : 'Смена пароля'}
        description={forced ? 'Вы вошли по временному паролю. Придумайте личный пароль, чтобы продолжить.' : undefined}
      >
        <form onSubmit={submit} className="space-y-4">
          {!forced && (
            <div><Label htmlFor="op">Текущий пароль</Label><Input id="op" type="password" value={oldP} onChange={(e) => setOldP(e.target.value)} required /></div>
          )}
          <div><Label htmlFor="np">Новый пароль</Label><Input id="np" type="password" value={p1} onChange={(e) => setP1(e.target.value)} minLength={6} required autoFocus /></div>
          <div>
            <Label htmlFor="np2">Повторите пароль</Label>
            <Input id="np2" type="password" value={p2} onChange={(e) => setP2(e.target.value)} required />
            {p2 && p1 !== p2 && <div className="mt-1 text-xs text-red-600">Пароли не совпадают</div>}
          </div>
          <div className="flex justify-end gap-2">
            {!forced && <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>}
            <Button type="submit" disabled={busy || !p1 || p1 !== p2}>Сохранить</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
