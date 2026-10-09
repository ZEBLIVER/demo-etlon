import { useStore, currentUser } from '@/store';
import type { AuditEntry, HistoryEntry, Location, MenuVariant, Orientation, Role, Screen, TvModel, User, UserAccount } from '@/lib/types';
import { computeStatus, genPassword, isAvailable, isProblem, uid } from '@/lib/utils';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const wait = () => new Promise<void>((r) => setTimeout(r, 300 + Math.random() * 300));
const st = () => useStore.getState();
const set = useStore.setState;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const strip = ({ password: _p, ...u }: UserAccount): User => u;

function me(): UserAccount {
  const u = currentUser();
  if (!u) throw new ApiError(401, 'Требуется вход');
  return u;
}
function admin(): UserAccount {
  const u = me();
  if (u.role !== 'ADMIN') throw new ApiError(403, 'Недостаточно прав');
  return u;
}
/** Действие над телевизорами: админ везде, управляющий только в своих кофейнях (иначе 403) */
function inScope(locationId: string): UserAccount {
  const u = me();
  if (!canSeeLocation(u, locationId)) throw new ApiError(403, 'Нет доступа к этой кофейне');
  return u;
}
function canSeeLocation(u: UserAccount, id: string) {
  return u.role === 'ADMIN' || u.locationIds.includes(id);
}
function log(userName: string, action: string, target: string) {
  const e: AuditEntry = { id: uid('a'), userName, action, target, createdAt: new Date().toISOString() };
  set((s) => ({ audit: [e, ...s.audit] }));
}
const locName = (id: string) => st().locations.find((l) => l.id === id)?.name ?? '';
const screenLabel = (s: Screen) => `${locName(s.locationId)} / ${s.name}`;

// ---------- Авторизация ----------
// Защита от подбора: 5 неудач подряд с одного IP (в демо IP один) → заморозка входа на 15 минут
let failures = 0;
let lockedUntil = 0;
export async function login(loginStr: string, password: string): Promise<User> {
  await wait();
  if (Date.now() < lockedUntil) {
    throw new ApiError(429, `Слишком много неудачных попыток. Вход с этого устройства заморожен ещё на ${Math.ceil((lockedUntil - Date.now()) / 60000)} мин`);
  }
  const u = st().users.find((x) => x.login === loginStr.trim());
  if (!u || u.password !== password) {
    if (++failures >= 5) {
      failures = 0;
      lockedUntil = Date.now() + 15 * 60_000;
      throw new ApiError(429, 'Слишком много неудачных попыток. Вход с этого устройства заморожен на 15 минут');
    }
    throw new ApiError(401, 'Неверный логин или пароль');
  }
  failures = 0;
  if (!u.enabled) throw new ApiError(403, 'Учётная запись отключена. Обратитесь к администратору');
  set({ currentUserId: u.id });
  return strip(u);
}
export async function changePassword(newPassword: string, oldPassword?: string): Promise<void> {
  await wait();
  const u = me();
  if (!u.mustChangePassword && u.password !== oldPassword) throw new ApiError(400, 'Текущий пароль указан неверно');
  if (newPassword.length < 6) throw new ApiError(400, 'Пароль должен быть не короче 6 символов');
  set((s) => ({ users: s.users.map((x) => (x.id === u.id ? { ...x, password: newPassword, mustChangePassword: false } : x)) }));
}
export async function logout(): Promise<void> {
  await wait();
  set({ currentUserId: null });
}
export async function getMe(): Promise<User | null> {
  const u = currentUser();
  return u ? strip(u) : null;
}

// ---------- Кофейни ----------
export async function getLocations(): Promise<Location[]> {
  await wait();
  const u = me();
  return st().locations.filter((l) => !l.archived && canSeeLocation(u, l.id));
}
export async function getLocation(id: string): Promise<{ location: Location; screens: Screen[] }> {
  await wait();
  const u = me();
  const location = st().locations.find((l) => l.id === id);
  if (!location || location.archived) throw new ApiError(404, 'Кофейня не найдена или архивирована');
  if (!canSeeLocation(u, id)) throw new ApiError(403, 'Нет доступа к этой кофейне');
  return { location, screens: st().screens.filter((s) => s.locationId === id) };
}
export async function createLocation(data: { name: string; code: string; address: string }): Promise<Location> {
  await wait();
  const u = admin();
  const code = data.code.trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(code)) throw new ApiError(400, 'Код кофейни: только латиница, цифры и дефис, например baza');
  if (st().locations.some((l) => l.code === code)) throw new ApiError(409, `Код «${code}» уже занят другой кофейней`);
  const l: Location = { id: uid('l'), name: data.name.trim(), code, address: data.address.trim(), city: 'Санкт-Петербург' };
  set((s) => ({ locations: [...s.locations, l] }));
  log(u.name, 'Создание кофейни', l.name);
  return l;
}
export async function updateLocation(id: string, data: { name: string; address: string }): Promise<Location> {
  await wait();
  const u = admin();
  const cur = st().locations.find((l) => l.id === id);
  if (!cur) throw new ApiError(404, 'Кофейня не найдена');
  const next = { ...cur, name: data.name.trim(), address: data.address.trim() };
  set((s) => ({ locations: s.locations.map((l) => (l.id === id ? next : l)) }));
  log(u.name, 'Изменение кофейни', next.name);
  return next;
}
/** Закрылась → архив: пропадает из списков и учёток управляющих, история сохраняется */
export async function archiveLocation(id: string): Promise<void> {
  await wait();
  const u = admin();
  const cur = st().locations.find((l) => l.id === id);
  if (!cur) throw new ApiError(404, 'Кофейня не найдена');
  set((s) => ({
    locations: s.locations.map((l) => (l.id === id ? { ...l, archived: true } : l)),
    users: s.users.map((x) => ({ ...x, locationIds: x.locationIds.filter((l) => l !== id) })),
  }));
  log(u.name, 'Архивация кофейни', cur.name);
}

// ---------- Экраны ----------
export async function createScreen(
  locationId: string,
  data: { number: number; orientation: Orientation; model: TvModel; comment: string },
): Promise<Screen> {
  await wait();
  const u = inScope(locationId);
  if (!Number.isInteger(data.number) || data.number < 1) throw new ApiError(400, 'Номер телевизора: целое число от 1');
  if (st().screens.some((x) => x.locationId === locationId && x.number === data.number)) throw new ApiError(409, `ТВ ${data.number} в этой кофейне уже есть`);
  const sc: Screen = {
    id: uid('s'), locationId, number: data.number, name: `ТВ ${data.number}`, orientation: data.orientation,
    model: data.model, comment: data.comment.trim(),
    variantId: null, shownVariantId: null, version: 0, shownVersion: 0,
    lastSeenAt: new Date(0).toISOString(), lastError: null, allowedVariantIds: [], disabledVariantIds: [],
  };
  set((s) => ({ screens: [...s.screens, sc] }));
  log(u.name, 'Добавление экрана', screenLabel(sc));
  return sc;
}
export async function deleteScreen(screenId: string): Promise<void> {
  await wait();
  const screen = st().screens.find((s) => s.id === screenId);
  if (!screen) throw new ApiError(404, 'Экран не найден');
  const u = inScope(screen.locationId);
  set((s) => ({ screens: s.screens.filter((x) => x.id !== screenId) }));
  log(u.name, 'Удаление экрана', screenLabel(screen));
}
export async function getScreen(id: string): Promise<{ screen: Screen; location: Location }> {
  await wait();
  const u = me();
  const screen = st().screens.find((s) => s.id === id);
  if (!screen) throw new ApiError(404, 'Экран не найден');
  if (!canSeeLocation(u, screen.locationId)) throw new ApiError(403, 'Нет доступа к этому экрану');
  return { screen, location: st().locations.find((l) => l.id === screen.locationId)! };
}
export async function setCurrentVariant(screenId: string, variantId: string): Promise<Screen> {
  await wait();
  const u = me();
  const screen = st().screens.find((s) => s.id === screenId);
  if (!screen) throw new ApiError(404, 'Экран не найден');
  if (!canSeeLocation(u, screen.locationId)) throw new ApiError(403, 'Нет доступа к этому экрану');
  const variant = st().variants.find((v) => v.id === variantId);
  if (!variant || !isAvailable(screen, variant)) throw new ApiError(403, 'Этот вариант не доступен для экрана');
  const entry: HistoryEntry = {
    id: uid('h'), screenId, userName: u.name, fromVariantId: screen.variantId, toVariantId: variantId, createdAt: new Date().toISOString(),
  };
  const next: Screen = { ...screen, variantId, version: screen.version + 1, versionChangedAt: new Date().toISOString(), lastError: null };
  set((s) => ({ screens: s.screens.map((x) => (x.id === screenId ? next : x)), history: [entry, ...s.history] }));
  log(u.name, 'Переключение меню', screenLabel(screen));
  return next;
}
/** Имитация: телевизор скачал и показал новую версию (вызывается таймерами на странице экрана) */
export function simulateScreenAck(screenId: string) {
  set((s) => ({
    screens: s.screens.map((x) =>
      x.id === screenId ? { ...x, shownVersion: x.version, shownVariantId: x.variantId, lastSeenAt: new Date().toISOString() } : x,
    ),
  }));
}
/** Заглушка плеера: телевизор открывает ссылку /<код>/<номер>, отчитывается (пиксель-пинг) и подхватывает новую версию. Без авторизации: меню не секретное. */
function findByLink(code: string, num: number): Screen | undefined {
  const loc = st().locations.find((l) => l.code === code && !l.archived);
  return loc ? st().screens.find((x) => x.locationId === loc.id && x.number === num) : undefined;
}
export function playerPing(code: string, num: number): Screen | null {
  const sc = findByLink(code, num);
  if (!sc) return null;
  set((s) => ({ screens: s.screens.map((x) => (x.id === sc.id ? { ...x, lastSeenAt: new Date().toISOString(), lastError: null } : x)) }));
  return st().screens.find((x) => x.id === sc.id) ?? null;
}
export function playerAck(code: string, num: number) {
  const sc = findByLink(code, num);
  if (sc) simulateScreenAck(sc.id);
}
/**
 * Перевыпуск ссылки: телевизор получает новый номер в кофейне, а значит и новый адрес /<код>/<номер>.
 * Старая ссылка перестаёт работать, новую нужно ввести в URL Launcher. Админ везде, управляющий в своих кофейнях.
 */
export async function reissueLink(screenId: string): Promise<Screen> {
  await wait();
  const screen = st().screens.find((x) => x.id === screenId);
  if (!screen) throw new ApiError(404, 'Экран не найден');
  const u = inScope(screen.locationId);
  const number = Math.max(0, ...st().screens.filter((x) => x.locationId === screen.locationId).map((x) => x.number)) + 1;
  const next: Screen = { ...screen, number, name: `ТВ ${number}`, lastSeenAt: new Date(0).toISOString() };
  set((s) => ({ screens: s.screens.map((x) => (x.id === screenId ? next : x)) }));
  log(u.name, 'Перевыпуск ссылки', `${locName(screen.locationId)} / ${screen.name} → ${next.name}`);
  return next;
}
/** Список доступных телевизору вариантов: стандартные включаются/отключаются, остальные назначаются */
export async function updateScreenVariants(screenId: string, availableIds: string[]): Promise<Screen> {
  await wait();
  const u = admin();
  const screen = st().screens.find((x) => x.id === screenId);
  if (!screen) throw new ApiError(404, 'Экран не найден');
  const own = st().variants.filter((v) => v.orientation === screen.orientation);
  const next: Screen = {
    ...screen,
    disabledVariantIds: own.filter((v) => v.standard && !availableIds.includes(v.id)).map((v) => v.id),
    allowedVariantIds: own.filter((v) => !v.standard && availableIds.includes(v.id)).map((v) => v.id),
  };
  set((s) => ({ screens: s.screens.map((x) => (x.id === screenId ? next : x)) }));
  log(u.name, 'Изменение доступа к вариантам', screenLabel(screen));
  return next;
}
export async function getScreenHistory(screenId: string): Promise<HistoryEntry[]> {
  await wait();
  const u = me();
  const screen = st().screens.find((s) => s.id === screenId);
  if (!screen || !canSeeLocation(u, screen.locationId)) throw new ApiError(403, 'Нет доступа');
  return st().history.filter((h) => h.screenId === screenId);
}

// ---------- Меню (варианты = загруженные файлы) ----------
export async function getVariants(): Promise<MenuVariant[]> {
  await wait();
  me();
  return st().variants;
}
export async function getVariant(id: string): Promise<MenuVariant> {
  await wait();
  me();
  const v = st().variants.find((x) => x.id === id);
  if (!v) throw new ApiError(404, 'Вариант не найден');
  return v;
}
const COLORS = ['#6b3f1d', '#b4561a', '#c98a5a', '#d9a441', '#8a5a44', '#a65e2e', '#c07a3a'];
const ALLOWED = ['image/jpeg', 'image/webp', 'video/mp4', 'video/webm'];
function checkFile(file: { name: string; size: number; type: string }) {
  // формат проверяем по содержимому (в браузере это MIME), а не по расширению
  if (!ALLOWED.includes(file.type)) throw new ApiError(400, `«${file.name}»: формат не поддерживается. Допустимы JPG, WEBP, MP4, WEBM`);
  if (file.size === 0) throw new ApiError(400, `«${file.name}»: файл пустой или повреждён`);
  if (file.size > 10 * 1024 * 1024) throw new ApiError(400, `«${file.name}»: файл тяжелее 10 МБ (${(file.size / 1024 / 1024).toFixed(1)} МБ). Сожмите его и загрузите снова`);
  const fingerprint = `${file.name}|${file.size}|${file.type}`;
  const dup = st().variants.find((v) => v.fingerprint === fingerprint);
  if (dup) throw new ApiError(409, `«${file.name}»: такой файл уже есть (вариант «${dup.name}»)`);
  const isVideo = file.type.startsWith('video/');
  return { fingerprint, isVideo };
}
/** Загрузка файла = создание варианта меню: админ задаёт название и ориентацию */
export async function uploadVariant(
  file: { name: string; size: number; type: string },
  data: { name: string; orientation: Orientation },
): Promise<MenuVariant> {
  await wait();
  const u = admin();
  const { fingerprint, isVideo } = checkFile(file);
  const portrait = data.orientation === 'portrait';
  const now = new Date().toISOString();
  const v: MenuVariant = {
    id: uid('v'), name: data.name.trim() || file.name.replace(/\.[^.]+$/, ''), orientation: data.orientation,
    kind: isVideo ? 'video' : 'image', mime: file.type, sizeBytes: file.size,
    width: portrait ? 1080 : 1920, height: portrait ? 1920 : 1080, durationSec: isVideo ? 12 : undefined,
    fileName: file.name.replace(/\.[^.]+$/, ''), previewColor: COLORS[Math.floor(Math.random() * COLORS.length)], fingerprint,
    standard: true, createdAt: now, updatedAt: now, version: 1,
  };
  set((s) => ({ variants: [...s.variants, v] }));
  log(u.name, 'Загрузка файла меню', v.name);
  return v;
}
/** Можно менять название и файл. Каждое сохранение = новая версия, телевизор скачивает её целиком. */
export async function updateVariant(
  id: string,
  data: { name?: string; file?: { name: string; size: number; type: string } },
): Promise<MenuVariant> {
  await wait();
  const u = admin();
  const cur = st().variants.find((x) => x.id === id);
  if (!cur) throw new ApiError(404, 'Вариант не найден');
  if (data.name !== undefined && !data.name.trim()) throw new ApiError(400, 'Название не может быть пустым');
  let patch: Partial<MenuVariant> = {};
  if (data.file) {
    const { fingerprint, isVideo } = checkFile(data.file);
    const portrait = cur.orientation === 'portrait';
    patch = {
      kind: isVideo ? 'video' : 'image', mime: data.file.type, sizeBytes: data.file.size, durationSec: isVideo ? 12 : undefined,
      width: portrait ? 1080 : 1920, height: portrait ? 1920 : 1080, fileName: data.file.name.replace(/\.[^.]+$/, ''), fingerprint,
      previewColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }
  const now = new Date().toISOString();
  const next: MenuVariant = { ...cur, ...patch, name: data.name?.trim() ?? cur.name, updatedAt: now, version: cur.version + 1 };
  set((s) => ({
    variants: s.variants.map((x) => (x.id === id ? next : x)),
    // экраны, где вариант стоит, получают новую версию
    screens: s.screens.map((x) => (x.variantId === id ? { ...x, version: x.version + 1, versionChangedAt: now } : x)),
  }));
  log(u.name, data.file ? 'Замена файла варианта' : 'Изменение варианта меню', next.name);
  // устройства подтягивают обновление автоматически
  const affected = st().screens.filter((x) => x.variantId === id).map((x) => x.id);
  setTimeout(() => affected.forEach(simulateScreenAck), 6000);
  return next;
}
export async function deleteVariant(id: string): Promise<void> {
  await wait();
  const u = admin();
  const v = st().variants.find((x) => x.id === id);
  if (!v) throw new ApiError(404, 'Вариант не найден');
  const on = st().screens.filter((s) => s.variantId === id);
  if (on.length) throw new ApiError(409, `Вариант сейчас показывается на экранах: ${on.map((s) => screenLabel(s)).join(', ')}`);
  set((s) => ({
    variants: s.variants.filter((x) => x.id !== id),
    screens: s.screens.map((x) => ({ ...x, allowedVariantIds: x.allowedVariantIds.filter((a) => a !== id) })),
  }));
  log(u.name, 'Удаление варианта меню и файла', v.name);
}
/**
 * Доступность варианта по телевизорам. Стандартный: доступен всем подходящей ориентации, screenIds — где доступен (остальные отключаются).
 * Нестандартный: доступен только screenIds. Ориентация проверяется.
 */
export async function setVariantAvailability(variantId: string, standard: boolean, screenIds: string[]): Promise<void> {
  await wait();
  const u = admin();
  const v = st().variants.find((x) => x.id === variantId);
  if (!v) throw new ApiError(404, 'Вариант не найден');
  const bad = st().screens.find((s) => screenIds.includes(s.id) && s.orientation !== v.orientation);
  if (bad) throw new ApiError(400, `${screenLabel(bad)}: ориентация экрана не совпадает с ориентацией варианта`);
  set((s) => ({
    variants: s.variants.map((x) => (x.id === variantId ? { ...x, standard } : x)),
    screens: s.screens.map((x) => {
      if (x.orientation !== v.orientation) return x;
      const on = screenIds.includes(x.id);
      return {
        ...x,
        allowedVariantIds: !standard && on ? [...new Set([...x.allowedVariantIds, variantId])] : x.allowedVariantIds.filter((a) => a !== variantId),
        disabledVariantIds: standard && !on ? [...new Set([...x.disabledVariantIds, variantId])] : x.disabledVariantIds.filter((a) => a !== variantId),
      };
    }),
  }));
  log(u.name, 'Назначение варианта экранам', `${v.name}: ${standard ? 'стандартный' : `${screenIds.length} экр.`}`);
}

// ---------- Пользователи ----------
export async function getUsers(): Promise<User[]> {
  await wait();
  admin();
  return st().users.map(strip);
}
export async function createUser(data: { name: string; login: string; password: string; role: Role; locationIds: string[] }): Promise<User> {
  await wait();
  const a = admin();
  if (st().users.some((x) => x.login === data.login.trim())) throw new ApiError(409, 'Логин уже занят');
  const u: UserAccount = {
    id: uid('u'), name: data.name.trim(), login: data.login.trim(), password: data.password, role: data.role, enabled: true, mustChangePassword: true,
    locationIds: data.role === 'ADMIN' ? [] : data.locationIds, createdAt: new Date().toISOString(),
  };
  set((s) => ({ users: [...s.users, u] }));
  log(a.name, 'Создание пользователя', u.name);
  return strip(u);
}
/** Забыл пароль → админ сбрасывает, система выдаёт новый временный; сессия пользователя закрывается */
export async function resetPassword(id: string): Promise<string> {
  await wait();
  const a = admin();
  const cur = st().users.find((x) => x.id === id);
  if (!cur) throw new ApiError(404, 'Пользователь не найден');
  const pwd = genPassword();
  set((s) => ({ users: s.users.map((x) => (x.id === id ? { ...x, password: pwd, mustChangePassword: true } : x)) }));
  log(a.name, 'Сброс пароля', cur.name);
  return pwd;
}
export async function updateUser(id: string, data: Partial<Pick<User, 'name' | 'role' | 'enabled' | 'locationIds'>>): Promise<User> {
  await wait();
  const a = admin();
  const cur = st().users.find((x) => x.id === id);
  if (!cur) throw new ApiError(404, 'Пользователь не найден');
  if (id === a.id && data.enabled === false) throw new ApiError(400, 'Нельзя отключить самого себя');
  const next = { ...cur, ...data };
  if (next.role === 'ADMIN') next.locationIds = [];
  set((s) => ({ users: s.users.map((x) => (x.id === id ? next : x)) }));
  const action = data.enabled === undefined ? 'Изменение пользователя' : data.enabled ? 'Включение пользователя' : 'Отключение пользователя';
  log(a.name, action, next.name);
  return strip(next);
}

// ---------- Сводки ----------
export async function getProblemScreens(): Promise<{ screen: Screen; location: Location }[]> {
  await wait();
  admin();
  const archived = new Set(st().locations.filter((l) => l.archived).map((l) => l.id));
  return st().screens
    .filter((s) => !archived.has(s.locationId) && isProblem(computeStatus(s)))
    .map((screen) => ({ screen, location: st().locations.find((l) => l.id === screen.locationId)! }));
}
export async function getAudit(): Promise<AuditEntry[]> {
  await wait();
  admin();
  return st().audit;
}
