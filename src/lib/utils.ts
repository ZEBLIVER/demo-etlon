import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { MenuVariant, Screen, ScreenStatus } from './types';

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`;

export const ago = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ru });
export const fmtDate = (iso: string) => format(new Date(iso), 'd MMM yyyy, HH:mm', { locale: ru });

export function fmtSize(b: number) {
  if (b > 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} МБ`;
  return `${Math.max(1, Math.round(b / 1024))} КБ`;
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

const MIN = 60_000;
/** Ночное окно по времени города (по умолчанию 23:00–07:00, Санкт-Петербург) */
export function isNight(now = Date.now(), tz = 'Europe/Moscow') {
  const h = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: tz }).format(now)) % 24;
  return h >= 23 || h < 7;
}
export const neverSeen = (s: Screen) => new Date(s.lastSeenAt).getTime() < 1e11;
/** Интервал связи 5 мин: нет связи — 3 интервала (15 мин), отстаёт — 6 интервалов (30 мин) */
export function computeStatus(s: Screen, now = Date.now()): ScreenStatus {
  if (neverSeen(s)) return 'never';
  if (now - new Date(s.lastSeenAt).getTime() > 15 * MIN) return isNight(now) ? 'offline_night' : 'offline';
  if (s.lastError) return 'error';
  if (s.shownVersion < s.version) {
    const since = s.versionChangedAt ? now - new Date(s.versionChangedAt).getTime() : 0;
    return since > 30 * MIN ? 'lagging' : 'updating';
  }
  return 'online';
}
export const isConnected = (st: ScreenStatus) => st !== 'offline' && st !== 'offline_night' && st !== 'never';

export const isProblem = (st: ScreenStatus) => st === 'offline' || st === 'error' || st === 'lagging';

export const LINK_HOST = 'https://etlonmenu.ru';
/** Ссылка телевизора: код кофейни + номер, например https://etlonmenu.ru/baza/3 */
export const screenLink = (code: string, number: number) => `${LINK_HOST}/${code}/${number}`;
/** Рабочий адрес заглушки плеера внутри демо */
export const demoPlayerPath = (code: string, number: number) => `/${code}/${number}`;

/** Доступен ли вариант телевизору: стандартные — всем подходящей ориентации (кроме отключённых), остальные — только назначенным */
export function isAvailable(screen: Screen, v: MenuVariant): boolean {
  if (v.orientation !== screen.orientation) return false;
  return v.standard ? !screen.disabledVariantIds.includes(v.id) : screen.allowedVariantIds.includes(v.id);
}
export function genPassword() {
  const c = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => c[Math.floor(Math.random() * c.length)]).join('');
}
