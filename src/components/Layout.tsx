import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, Coffee, LayoutDashboard, Store, ListVideo, Users, ScrollText, Menu, Moon, Sun, LogOut, RotateCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import { logout } from '@/api';
import { resetDemo, startLiveSimulation, useStore } from '@/store';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { ConfirmDialog } from './ui/dialog';
import { useCurrentUser } from '@/lib/auth';
import { ChangePasswordDialog } from './ChangePasswordDialog';

const ADMIN_NAV: { to: string; label: string; icon: typeof Store; end?: boolean }[] = [
  { to: '/', label: 'Обзор', icon: LayoutDashboard, end: true },
  { to: '/locations', label: 'Кофейни', icon: Store },
  { to: '/menu', label: 'Меню', icon: ListVideo },
  { to: '/users', label: 'Пользователи', icon: Users },
  { to: '/audit', label: 'Журнал', icon: ScrollText },
];
const MANAGER_NAV: typeof ADMIN_NAV = [{ to: '/locations', label: 'Мои кофейни', icon: Store, end: false }];

function useTheme() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('tv-theme') === 'dark'; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('tv-theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [dark]);
  return [dark, setDark] as const;
}

export function Layout() {
  const user = useCurrentUser()!;
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useTheme();
  const [confirmReset, setConfirmReset] = useState(false);
  const [pwd, setPwd] = useState(false);
  const isAdmin = user.role === 'ADMIN';
  const items = isAdmin ? ADMIN_NAV : MANAGER_NAV;

  useEffect(() => startLiveSimulation(), []);
  useEffect(() => setOpen(false), [loc.pathname]);

  const sidebar = (
    <div className="flex h-full flex-col gap-1 p-4">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
          <Coffee className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold leading-tight">ТВ-меню</div>
          <div className="text-xs text-muted-foreground">Сеть кофеен</div>
        </div>
      </div>
      <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{isAdmin ? 'Управление' : 'Меню'}</div>
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn('relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors', isActive ? 'bg-accent text-foreground before:absolute before:-left-4 before:top-2 before:h-[calc(100%-1rem)] before:w-1 before:rounded-r before:bg-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')
          }
        >
          <Icon className="h-[18px] w-[18px]" />
          {label}
        </NavLink>
      ))}
      <div className="mt-auto flex items-center gap-3 rounded-xl bg-muted/60 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {user.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium leading-tight">{user.name}</div>
          <div className="text-xs text-muted-foreground">{isAdmin ? 'Головной офис' : `Кофеен: ${user.locationIds.length}`}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r bg-card shadow-2xl">
            <button className="absolute right-3 top-4 rounded-lg p-1.5 hover:bg-muted" onClick={() => setOpen(false)} aria-label="Закрыть меню">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          {isAdmin && (
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Открыть меню">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Coffee className="h-4 w-4" /></div>
            <span className="font-semibold">ТВ-меню</span>
          </div>
          <div className="flex-1" />
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)} title="Сбросить демо-данные">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden md:inline">Сбросить демо-данные</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setPwd(true)} aria-label="Сменить пароль" title="Сменить пароль">
            <KeyRound className="h-[18px] w-[18px]" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} aria-label="Сменить тему">
            {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium leading-tight">{user.name}</div>
            <div className="text-xs text-muted-foreground">{isAdmin ? 'Администратор' : 'Управляющий'}</div>
          </div>
          <span className={cn('hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline', isAdmin ? 'bg-primary text-primary-foreground' : 'bg-accent')}>
            {isAdmin ? 'Админ' : 'Управляющий'}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Выйти"
            onClick={async () => {
              await logout();
              nav('/login');
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      <ChangePasswordDialog open={pwd || !!user.mustChangePassword} onOpenChange={setPwd} forced={!!user.mustChangePassword} />
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Сбросить демо-данные?"
        description="Все изменения будут потеряны, данные вернутся к исходному состоянию. Вы останетесь в системе."
        confirmLabel="Сбросить"
        destructive
        onConfirm={() => {
          const id = useStore.getState().currentUserId;
          resetDemo();
          useStore.setState({ currentUserId: id });
          toast.success('Демо-данные сброшены');
        }}
      />
    </div>
  );
}
