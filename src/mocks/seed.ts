import type { AuditEntry, DemoState, HistoryEntry, Location, Media, MenuVariant, Screen, UserAccount } from '@/lib/types';

const MIN = 60_000, H = 60 * MIN, D = 24 * H;

export function buildSeed(): DemoState {
  const now = Date.now();
  const t = (msAgo: number) => new Date(now - msAgo).toISOString();

  const locs: [string, string, string][] = [
    ['apelsin', 'Апельсин', 'Большой пр. П.С., 54'],
    ['7line', '7-я линия', '7-я линия В.О., 18'],
    ['brusnika', 'Брусника', 'ул. Рубинштейна, 12'],
    ['zk1', 'ЗК-1', 'Загородный пр., 1'],
    ['kremen', 'Кремень', 'ул. Кронверкская, 23'],
    ['leto', 'Лето', 'Каменноостровский пр., 40'],
    ['liteyny', 'Литейный', 'Литейный пр., 33'],
    ['pravda', 'Правда', 'ул. Правды, 10'],
    ['narva', 'Нарвские ворота', 'пр. Стачек, 9'],
    ['uralskaya', 'Уральская', 'Уральская ул., 17'],
    ['grina', 'Грина', 'ул. Грина, 8'],
    ['piramida', 'Пирамида', 'Лиговский пр., 30'],
    ['golovina', 'Головина', 'ул. Головина, 5'],
    ['vami', 'Вами', 'Московский пр., 97'],
  ];
  const locations: Location[] = locs.map(([k, name, address]) => ({ id: `l_${k}`, name, code: k === '7line' ? '7liniya' : k, address: `Санкт-Петербург, ${address}`, city: 'Санкт-Петербург' }));

  interface M { id: string; name: string; type: 'image' | 'video'; w: number; h: number; c: string; s: number; d?: number }
  const rawMedia: M[] = [
    { id: 'm1', name: 'Кофе классика', type: 'image', w: 1920, h: 1080, c: '#6b3f1d', s: 1.4 },
    { id: 'm2', name: 'Сезонное меню осень', type: 'image', w: 1920, h: 1080, c: '#b4561a', s: 1.9 },
    { id: 'm3', name: 'Десерты', type: 'image', w: 1920, h: 1080, c: '#c98a5a', s: 1.7 },
    { id: 'm4', name: 'Завтраки', type: 'image', w: 1920, h: 1080, c: '#d9a441', s: 1.6 },
    { id: 'm5', name: 'Промо тыквенный латте', type: 'video', w: 1920, h: 1080, c: '#d2691e', s: 8.4, d: 15 },
    { id: 'm6', name: 'Прайс Брусника/Лето', type: 'image', w: 1920, h: 1080, c: '#8a5a44', s: 1.3 },
    { id: 'm7', name: 'Чай и какао', type: 'image', w: 1920, h: 1080, c: '#7a4b2a', s: 1.2 },
    { id: 'm8', name: 'Эспрессо-бар', type: 'image', w: 1920, h: 1080, c: '#4a2c17', s: 1.5 },
    { id: 'm9', name: 'Выпечка', type: 'image', w: 1920, h: 1080, c: '#c07a3a', s: 1.8 },
    { id: 'm10', name: 'Сэндвичи и салаты', type: 'image', w: 1920, h: 1080, c: '#a65e2e', s: 1.6 },
    { id: 'm11', name: 'Акция 2+1', type: 'video', w: 1920, h: 1080, c: '#b5472a', s: 5.1, d: 10 },
    { id: 'm12', name: 'Вертикальное меню — кофе', type: 'image', w: 1080, h: 1920, c: '#6b3f1d', s: 1.5 },
    { id: 'm13', name: 'Вертикальное меню — авторские', type: 'image', w: 1080, h: 1920, c: '#8c4a2a', s: 1.4 },
    { id: 'm14', name: 'Новинка: раф солёная карамель', type: 'video', w: 1920, h: 1080, c: '#c8873a', s: 6.7, d: 12 },
    { id: 'm15', name: 'Бейглы и тосты', type: 'image', w: 1920, h: 1080, c: '#d6a15e', s: 1.3 },
  ];
  const media: Media[] = rawMedia.map((m, i) => ({
    id: m.id, name: m.name, type: m.type,
    mime: m.type === 'video' ? 'video/mp4' : 'image/jpeg',
    sizeBytes: Math.round(m.s * 1024 * 1024), width: m.w, height: m.h,
    durationSec: m.d, previewColor: m.c, createdAt: t((20 - i) * D / 2),
  }));

  // Вариант = один файл. Стандартные доступны всем телевизорам своей ориентации, v2 — только Бруснике и Лету.
  const variants: MenuVariant[] = [
    { id: 'v1', name: 'Основной прайс', orientation: 'landscape', mediaId: 'm1', standard: true, version: 4, updatedAt: t(3 * D) },
    { id: 'v2', name: 'Прайс Брусника/Лето', orientation: 'landscape', mediaId: 'm6', standard: false, version: 2, updatedAt: t(6 * D) },
    { id: 'v3', name: 'Завтраки', orientation: 'landscape', mediaId: 'm4', standard: true, version: 3, updatedAt: t(5 * D) },
    { id: 'v4', name: 'Десерты', orientation: 'landscape', mediaId: 'm3', standard: true, version: 2, updatedAt: t(2 * D) },
    { id: 'v5', name: 'Промо осень (видео)', orientation: 'landscape', mediaId: 'm5', standard: true, version: 1, updatedAt: t(1 * D) },
    { id: 'v6', name: 'Вертикальный — напитки', orientation: 'portrait', mediaId: 'm12', standard: true, version: 2, updatedAt: t(4 * D) },
    { id: 'v7', name: 'Акцент на раф (видео)', orientation: 'landscape', mediaId: 'm14', standard: true, version: 1, updatedAt: t(1 * D) },
    { id: 'v8', name: 'Сезонное меню осень', orientation: 'landscape', mediaId: 'm2', standard: true, version: 2, updatedAt: t(2 * D) },
  ];

  type S = [string, string | null, ('landscape' | 'portrait')?];
  const plan: Record<string, S[]> = {
    apelsin: [['ТВ 1', 'v1'], ['ТВ 2', 'v3']],
    '7line': [['ТВ 1', 'v1']],
    brusnika: [['ТВ 1', 'v2'], ['ТВ 2', 'v4'], ['ТВ 3', 'v5']],
    zk1: [['ТВ 1', 'v1'], ['ТВ 2', 'v3']],
    kremen: [['ТВ 1', 'v1']],
    leto: [['ТВ 1', 'v2'], ['ТВ 2', 'v4']],
    liteyny: [['ТВ 1', 'v1'], ['ТВ 2', 'v3'], ['ТВ 3', 'v5']],
    pravda: [['ТВ 1', 'v8'], ['ТВ 2', 'v3']],
    narva: [['ТВ 1', 'v1'], ['ТВ 2', 'v5']],
    uralskaya: [['ТВ 1', 'v1']],
    grina: [['ТВ 1', 'v1'], ['ТВ 2', 'v4']],
    piramida: [['ТВ 1', 'v1']],
    golovina: [['ТВ 1', 'v1'], ['ТВ 2', 'v6', 'portrait']],
    vami: [['ТВ 1', 'v1']],
  };

  const screens: Screen[] = [];
  for (const [loc, list] of Object.entries(plan)) {
    list.forEach(([name, variantId, orient], i) => {
      const portrait = orient === 'portrait';
      const s: Screen = {
        model: (i + loc.length) % 3 === 0 ? 'Samsung DBE' : 'Samsung PMF', comment: i === 0 ? 'над кассой' : i === 1 ? 'у входа' : 'в зале',
        id: `s_${loc}_${i + 1}`, locationId: `l_${loc}`, number: i + 1, name,
        orientation: portrait ? 'portrait' : 'landscape',
        variantId, shownVariantId: variantId,
        version: 3 + ((i * 7 + loc.length) % 9), shownVersion: 0,
        lastSeenAt: t((1 + ((i * 3 + loc.length) % 5)) * MIN), lastError: null,
        allowedVariantIds: variantId === 'v2' ? ['v2'] : [], disabledVariantIds: [],
      };
      s.shownVersion = s.version;
      screens.push(s);
    });
  }
  const upd = (id: string, p: Partial<Screen>) => Object.assign(screens.find((s) => s.id === id)!, p);
  upd('s_kremen_1', { lastSeenAt: t(3 * D) });
  upd('s_uralskaya_1', { lastSeenAt: t(20 * MIN) });
  upd('s_narva_2', { lastError: 'Видео не воспроизводится', disabledVariantIds: ['v3'] }); // исключение: стандартный вариант отключён
  const pr = screens.find((s) => s.id === 's_pravda_1')!;
  Object.assign(pr, { version: pr.version + 1, versionChangedAt: t(3 * MIN), shownVariantId: 'v1' });

  const users: UserAccount[] = [
    { id: 'u_admin', login: 'admin', password: 'admin', name: 'Мария Соколова', role: 'ADMIN', enabled: true, locationIds: [], createdAt: t(120 * D) },
    { id: 'u_manager', login: 'manager', password: 'manager', name: 'Илья Петров', role: 'MANAGER', enabled: true, locationIds: ['l_liteyny', 'l_pravda', 'l_apelsin'], createdAt: t(90 * D) },
    { id: 'u_anna', login: 'belova', password: 'demo1234', name: 'Анна Белова', role: 'MANAGER', enabled: true, locationIds: ['l_brusnika', 'l_leto'], createdAt: t(70 * D) },
    { id: 'u_dmitry', login: 'orlov', password: 'demo1234', name: 'Дмитрий Орлов', role: 'MANAGER', enabled: true, locationIds: ['l_kremen', 'l_uralskaya', 'l_grina'], createdAt: t(60 * D) },
    { id: 'u_olga', login: 'kim', password: 'demo1234', name: 'Ольга Ким', role: 'MANAGER', enabled: true, locationIds: ['l_narva', 'l_zk1', 'l_7line'], createdAt: t(45 * D) },
    { id: 'u_sergey', login: 'volkov', password: 'demo1234', name: 'Сергей Волков', role: 'MANAGER', enabled: false, locationIds: ['l_piramida', 'l_golovina'], createdAt: t(30 * D) },
    { id: 'u_pavel', login: 'mironov', password: 'demo1234', name: 'Павел Миронов', role: 'MANAGER', enabled: true, locationIds: ['l_vami'], createdAt: t(12 * D) },
  ];

  const hist = (n: number, screenId: string, userName: string, from: string | null, to: string | null, ago: number): HistoryEntry =>
    ({ id: `h${n}`, screenId, userName, fromVariantId: from, toVariantId: to, createdAt: t(ago) });
  const history: HistoryEntry[] = [
    hist(1, 's_liteyny_1', 'Илья Петров', 'v2', 'v1', 2 * D + 3 * H),
    hist(2, 's_liteyny_1', 'Илья Петров', 'v1', 'v2', 5 * D),
    hist(3, 's_liteyny_2', 'Илья Петров', 'v4', 'v3', 1 * D + 2 * H),
    hist(4, 's_liteyny_3', 'Мария Соколова', null, 'v5', 4 * D),
    hist(5, 's_pravda_1', 'Илья Петров', 'v1', 'v2', 3 * H),
    hist(6, 's_brusnika_1', 'Анна Белова', 'v1', 'v2', 1 * D),
    hist(7, 's_leto_1', 'Анна Белова', 'v1', 'v2', 3 * D),
    hist(8, 's_narva_2', 'Ольга Ким', 'v3', 'v5', 5 * H),
    hist(9, 's_apelsin_2', 'Илья Петров', 'v4', 'v3', 6 * D),
    hist(10, 's_grina_2', 'Дмитрий Орлов', 'v3', 'v4', 2 * D),
  ].sort((x, y) => +new Date(y.createdAt) - +new Date(x.createdAt));

  const a = (n: number, userName: string, action: string, target: string, ago: number): AuditEntry =>
    ({ id: `a${n}`, userName, action, target, createdAt: t(ago) });
  const audit: AuditEntry[] = [
    a(1, 'Мария Соколова', 'Создание варианта меню', 'Промо осень (видео)', 1 * D + 30 * MIN),
    a(2, 'Мария Соколова', 'Загрузка медиа', 'Новинка: раф солёная карамель', 1 * D + 2 * H),
    a(3, 'Илья Петров', 'Переключение меню', 'Литейный / ТВ 2', 1 * D + 2 * H),
    a(4, 'Анна Белова', 'Переключение меню', 'Брусника / ТВ 1', 1 * D),
    a(5, 'Мария Соколова', 'Создание пользователя', 'Павел Миронов', 12 * D),
    a(6, 'Ольга Ким', 'Переключение меню', 'Нарвские ворота / ТВ 2', 5 * H),
    a(7, 'Илья Петров', 'Переключение меню', 'Правда / ТВ 1', 3 * H),
    a(8, 'Мария Соколова', 'Сброс кэша', 'Кремень / ТВ 1', 2 * D + 5 * H),
    a(9, 'Мария Соколова', 'Изменение варианта меню', 'Десерты', 2 * D),
    a(10, 'Дмитрий Орлов', 'Переключение меню', 'Грина / ТВ 2', 2 * D),
    a(11, 'Мария Соколова', 'Добавление экрана', 'Головина / ТВ 2', 3 * D + 4 * H),
    a(12, 'Мария Соколова', 'Отключение пользователя', 'Сергей Волков', 3 * D),
    a(13, 'Анна Белова', 'Переключение меню', 'Лето / ТВ 1', 3 * D),
    a(14, 'Мария Соколова', 'Загрузка медиа', 'Бейглы и тосты', 4 * D + 2 * H),
    a(15, 'Илья Петров', 'Переключение меню', 'Литейный / ТВ 1', 2 * D + 3 * H),
    a(16, 'Мария Соколова', 'Создание кофейни', 'Вами', 9 * D),
    a(17, 'Мария Соколова', 'Изменение доступа к вариантам', 'Нарвские ворота / ТВ 2', 6 * H),
    a(18, 'Мария Соколова', 'Создание варианта меню', 'Вертикальный — напитки', 4 * D),
  ].sort((x, y) => +new Date(y.createdAt) - +new Date(x.createdAt));

  return { users, locations, screens, media, variants, audit, history, currentUserId: null };
}
