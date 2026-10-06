import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Coffee, Loader2 } from 'lucide-react';
import { login } from '@/api';
import { errMsg } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, Input, Label } from '@/components/ui/primitives';
import { useCurrentUser } from '@/lib/auth';

export default function LoginPage() {
  const user = useCurrentUser();
  const nav = useNavigate();
  const loc = useLocation();
  const [l, setL] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e?: FormEvent, lg = l, pw = p) => {
    e?.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const u = await login(lg, pw);
      const from = (loc.state as { from?: string } | null)?.from;
      nav(u.role === 'ADMIN' ? from ?? '/' : '/locations', { replace: true });
    } catch (x) {
      setErr(errMsg(x));
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent via-background to-background p-4">
      <div className="rise w-full max-w-sm">
        <Card className="p-7">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <Coffee className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-semibold">ТВ-меню</h1>
            <p className="text-sm text-muted-foreground">Управление меню на экранах кофеен</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="login">Логин</Label>
              <Input id="login" value={l} onChange={(e) => setL(e.target.value)} autoComplete="username" autoFocus />
            </div>
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" />
            </div>
            {err && <div role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{err}</div>}
            <Button type="submit" className="w-full" disabled={busy || !l || !p}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Войти
            </Button>
          </form>
          <div className="mt-6 border-t pt-4">
            <div className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Демо-доступ</div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" disabled={busy} onClick={() => { setL('admin'); setP('admin'); void submit(undefined, 'admin', 'admin'); }}>
                Админ
              </Button>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => { setL('manager'); setP('manager'); void submit(undefined, 'manager', 'manager'); }}>
                Управляющий
              </Button>
            </div>
          </div>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">Доступ выдаёт головной офис</p>
      </div>
    </div>
  );
}
