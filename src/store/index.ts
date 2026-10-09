import { create } from 'zustand';
import type { DemoState } from '@/lib/types';
import { buildSeed } from '@/mocks/seed';
import { computeStatus, isConnected, neverSeen } from '@/lib/utils';

const KEY = 'tv-menu-demo-v4';

function load(): DemoState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const { state, savedAt } = JSON.parse(raw) as { state: DemoState; savedAt: number };
      const now = Date.now();
      const delta = now - savedAt;
      // «Время шло»: онлайн-экраны остаются онлайн, офлайн сохраняют свой возраст
      state.screens = state.screens.map((s) =>
        neverSeen(s) || !isConnected(computeStatus(s, savedAt))
          ? { ...s, lastSeenAt: new Date(new Date(s.lastSeenAt).getTime() + delta).toISOString() }
          : { ...s, lastSeenAt: new Date(now - 60_000).toISOString() },
      );
      return state;
    }
  } catch {
    /* повреждённое хранилище — начинаем с нуля */
  }
  return buildSeed();
}

export const useStore = create<DemoState>(() => load());

let timer: ReturnType<typeof setTimeout> | undefined;
let applyingRemote = false;
useStore.subscribe((state) => {
  if (applyingRemote) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ state, savedAt: Date.now() }));
    } catch {
      /* ignore */
    }
  }, 150);
});

// Синхронизация между вкладками: админка и открытая в соседней вкладке заглушка плеера видят друг друга
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY || !e.newValue) return;
    try {
      const { state } = JSON.parse(e.newValue) as { state: DemoState };
      clearTimeout(timer);
      applyingRemote = true;
      useStore.setState(state, true);
    } catch {
      /* ignore */
    } finally {
      applyingRemote = false;
    }
  });
}

export const currentUser = () => {
  const s = useStore.getState();
  const u = s.users.find((x) => x.id === s.currentUserId);
  // отключённая учётка = сессия закрыта
  return u && u.enabled ? u : null;
};

/** Живость демо: пинги экранов и «дозагрузка» зависшего обновления */
export function startLiveSimulation() {
  const ping = setInterval(() => {
    const now = Date.now();
    useStore.setState((st) => ({
      screens: st.screens.map((s) => (!isConnected(computeStatus(s, now)) ? s : { ...s, lastSeenAt: new Date(now).toISOString() })),
    }));
  }, 25_000);
  const finish = setTimeout(() => {
    useStore.setState((st) => ({
      screens: st.screens.map((s) =>
        s.shownVersion < s.version ? { ...s, shownVersion: s.version, shownVariantId: s.variantId } : s,
      ),
    }));
  }, 60_000);
  return () => {
    clearInterval(ping);
    clearTimeout(finish);
  };
}
