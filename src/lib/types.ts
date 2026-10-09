export type Role = 'ADMIN' | 'MANAGER';

export interface User { id: string; login: string; name: string; role: Role; enabled: boolean; locationIds: string[]; createdAt: string; mustChangePassword?: boolean; }
export interface UserAccount extends User { password: string; }

/** code — латиница, входит в ссылку телевизора (etlonmenu.ru/<code>/<номер>), после создания не меняется */
export interface Location { id: string; name: string; code: string; address: string; city: string; archived?: boolean; }

export type ScreenStatus = 'online' | 'updating' | 'lagging' | 'offline' | 'offline_night' | 'error' | 'never';
export type TvModel = 'Samsung PMF' | 'Samsung DBE';
export type Orientation = 'landscape' | 'portrait';

export interface Screen {
  id: string; locationId: string;
  /** номер телевизора (1, 2, 3…), он же в ссылке, после создания не меняется */
  number: number;
  name: string; // «ТВ 1»
  orientation: Orientation; model: TvModel; comment: string;
  variantId: string | null; shownVariantId?: string | null; version: number; shownVersion: number;
  lastSeenAt: string; lastError: string | null;
  /** нестандартные варианты, назначенные именно этому телевизору (прайс Брусники и Лета) */
  allowedVariantIds: string[];
  /** стандартные варианты, отключённые для этого телевизора */
  disabledVariantIds: string[];
  /** момент, когда экран получил новую версию (для вычисления updating/lagging) */
  versionChangedAt?: string;
}

/**
 * Вариант меню = один файл (картинка висит постоянно, видео крутится по кругу). Отдельной медиатеки нет:
 * админ загружает файл в разделе «Меню», задаёт название и ориентацию, и появляется вариант.
 */
export interface MenuVariant {
  id: string; name: string; orientation: Orientation;
  kind: 'image' | 'video'; mime: string; sizeBytes: number; width: number; height: number; durationSec?: number;
  /** имя исходного файла (для превью и защиты от дубликатов) */
  fileName: string; previewColor: string; fingerprint?: string;
  /** стандартный: доступен всем телевизорам подходящей ориентации; иначе только назначенным */
  standard: boolean;
  createdAt: string; updatedAt: string; version: number;
}
export interface AuditEntry { id: string; userName: string; action: string; target: string; createdAt: string; }
export interface HistoryEntry { id: string; screenId: string; userName: string; fromVariantId: string | null; toVariantId: string | null; createdAt: string; }

export interface DemoState {
  users: UserAccount[];
  locations: Location[];
  screens: Screen[];
  variants: MenuVariant[];
  audit: AuditEntry[];
  history: HistoryEntry[];
  currentUserId: string | null;
}
