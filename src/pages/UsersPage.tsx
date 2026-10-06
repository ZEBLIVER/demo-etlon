import { useState, type FormEvent } from 'react';
import { Copy, KeyRound, Plus, Sparkles, UserX, UserCheck, Pencil, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createUser, getUsers, resetPassword, updateUser } from '@/api';
import { EmptyState, ErrorView, PageHeader, run, useApi } from '@/components/common';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, Chip, Input, Label, Select, Skeleton } from '@/components/ui/primitives';
import { useStore } from '@/store';
import { cn, genPassword } from '@/lib/utils';
import type { Role, User } from '@/lib/types';

export default function UsersPage() {
  const { data, error, loading, reload } = useApi(getUsers, []);
  const locations = useStore((s) => s.locations);
  const users = useStore((s) => s.users);
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [toggle, setToggle] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [loginV, setLoginV] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('MANAGER');
  const [locIds, setLocIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [resetFor, setResetFor] = useState<User | null>(null);
  const [cred, setCred] = useState<{ name: string; login: string; password: string } | null>(null);

  if (error) return <ErrorView error={error} />;

  const openDlg = (u: User | 'new') => {
    setEditing(u);
    if (u === 'new') {
      setName(''); setLoginV(''); setPassword(genPassword()); setRole('MANAGER'); setLocIds([]);
    } else {
      setName(u.name); setLoginV(u.login); setPassword(''); setRole(u.role); setLocIds(u.locationIds);
    }
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = editing === 'new'
      ? await run(createUser({ name, login: loginV, password, role, locationIds: locIds }), 'Пользователь создан')
      : await run(updateUser((editing as User).id, { name, role, locationIds: locIds }), 'Изменения сохранены');
    setBusy(false);
    if (r) {
      if (editing === 'new') setCred({ name, login: loginV, password });
      setEditing(null);
      void reload(true);
    }
  };
  const list = data ? users : [];

  return (
    <>
      <PageHeader title="Пользователи" subtitle="Регистрации нет — учётные записи создаёт только администратор" actions={<Button onClick={() => openDlg('new')}><Plus className="h-4 w-4" />Добавить пользователя</Button>} />
      {loading ? (
        <Skeleton className="h-80" />
      ) : list.length === 0 ? (
        <EmptyState icon={UsersIcon} title="Пользователей нет" />
      ) : (
        <>
        <div className="space-y-3 md:hidden">
          {list.map((u) => (
            <Card key={u.id} className={cn('p-4', !u.enabled && 'opacity-60')}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-sm text-muted-foreground">{u.login} · {u.role === 'ADMIN' ? 'Админ' : 'Управляющий'}</div>
                </div>
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', u.enabled ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-zinc-500/15')}>{u.enabled ? 'Активен' : 'Отключён'}</span>
              </div>
              {u.role === 'MANAGER' && <div className="mt-2 flex flex-wrap gap-1">{u.locationIds.map((id) => <Chip key={id}>{locations.find((l) => l.id === id)?.name}</Chip>)}</div>}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openDlg(u)}><Pencil className="h-4 w-4" />Изменить</Button>
                <Button size="sm" variant="outline" onClick={() => setResetFor(u)}><KeyRound className="h-4 w-4" />Пароль</Button>
                <Button size="sm" variant="outline" onClick={() => setToggle(u)}>{u.enabled ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}{u.enabled ? 'Отключить' : 'Включить'}</Button>
              </div>
            </Card>
          ))}
        </div>
        <Card className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                {['Имя', 'Логин', 'Роль', 'Кофейни', 'Статус', ''].map((h) => <th key={h} className="p-3.5 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className={cn('border-b last:border-0 hover:bg-muted/50', !u.enabled && 'opacity-60')}>
                  <td className="p-3.5 font-medium">{u.name}</td>
                  <td className="p-3.5 text-muted-foreground">{u.login}</td>
                  <td className="p-3.5">{u.role === 'ADMIN' ? 'Админ' : 'Управляющий'}</td>
                  <td className="p-3.5">
                    {u.role === 'ADMIN' ? <span className="text-muted-foreground">Все</span> : (
                      <div className="flex flex-wrap gap-1">{u.locationIds.map((id) => <Chip key={id}>{locations.find((l) => l.id === id)?.name}</Chip>)}</div>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', u.enabled ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-zinc-500/15')}>
                      {u.enabled ? 'Активен' : 'Отключён'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" aria-label="Редактировать" onClick={() => openDlg(u)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Сбросить пароль" title="Сбросить пароль" onClick={() => setResetFor(u)}><KeyRound className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label={u.enabled ? 'Отключить' : 'Включить'} onClick={() => setToggle(u)}>
                        {u.enabled ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        </>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent title={editing === 'new' ? 'Новый пользователь' : 'Редактирование пользователя'}>
          <form onSubmit={submit} className="space-y-4">
            <div><Label htmlFor="un">Имя</Label><Input id="un" value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="ul">Логин</Label><Input id="ul" value={loginV} onChange={(e) => setLoginV(e.target.value)} required disabled={editing !== 'new'} /></div>
              <div>
                <Label htmlFor="ur">Роль</Label>
                <Select id="ur" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="MANAGER">Управляющий</option>
                  <option value="ADMIN">Админ</option>
                </Select>
              </div>
            </div>
            {editing === 'new' && (
              <div>
                <Label htmlFor="up">Временный пароль</Label>
                <div className="flex gap-2">
                  <Input id="up" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} />
                  <Button type="button" variant="outline" onClick={() => setPassword(genPassword())}><Sparkles className="h-4 w-4" />Сгенерировать</Button>
                </div>
              </div>
            )}
            {role === 'MANAGER' && (
              <div>
                <Label>Кофейни</Label>
                <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto">
                  {locations.map((l) => {
                    const on = locIds.includes(l.id);
                    return (
                      <button key={l.id} type="button" aria-pressed={on} onClick={() => setLocIds((c) => (on ? c.filter((x) => x !== l.id) : [...c, l.id]))}
                        className={cn('rounded-full border px-3 py-1 text-sm transition-colors', on ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted')}>
                        {l.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
              <Button type="submit" disabled={busy}>{editing === 'new' ? 'Создать' : 'Сохранить'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!resetFor}
        onOpenChange={(o) => !o && setResetFor(null)}
        title="Сбросить пароль?"
        description={`Для ${resetFor?.name} будет выдан новый временный пароль, открытые сессии закроются. При входе человек задаст свой пароль.`}
        confirmLabel="Сбросить"
        onConfirm={async () => {
          if (!resetFor) return;
          const pwd = await run(resetPassword(resetFor.id), 'Пароль сброшен');
          if (pwd) setCred({ name: resetFor.name, login: resetFor.login, password: pwd });
        }}
      />
      <Dialog open={!!cred} onOpenChange={(o) => !o && setCred(null)}>
        <DialogContent title="Данные для входа" description={`Передайте их ${cred?.name} удобным способом: система сама ничего не отправляет.`}>
          <div className="space-y-2 rounded-xl bg-muted p-4 font-mono text-sm">
            <div>Логин: <b>{cred?.login}</b></div>
            <div>Временный пароль: <b>{cred?.password}</b></div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">При первом входе человек задаст свой пароль. Показываем один раз.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { void navigator.clipboard?.writeText(`Логин: ${cred?.login}\nПароль: ${cred?.password}`); toast.success('Скопировано'); }}><Copy className="h-4 w-4" />Скопировать</Button>
            <Button onClick={() => setCred(null)}>Готово</Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!toggle}
        onOpenChange={(o) => !o && setToggle(null)}
        title={toggle?.enabled ? 'Отключить пользователя?' : 'Включить пользователя?'}
        description={toggle?.enabled ? `${toggle?.name} больше не сможет войти в систему.` : `${toggle?.name} снова сможет войти в систему.`}
        confirmLabel={toggle?.enabled ? 'Отключить' : 'Включить'}
        destructive={toggle?.enabled}
        onConfirm={async () => {
          if (!toggle) return;
          await run(updateUser(toggle.id, { enabled: !toggle.enabled }), toggle.enabled ? 'Пользователь отключён' : 'Пользователь включён');
          void reload(true);
        }}
      />
    </>
  );
}
