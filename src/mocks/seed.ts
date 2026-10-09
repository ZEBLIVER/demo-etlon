import type { AuditEntry, DemoState, HistoryEntry, Location, MenuVariant, Screen, UserAccount } from '@/lib/types';

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

  // Отдельной медиатеки нет: вариант меню = загруженный файл (картинка или видео) + название и ориентация.
  // Стандартные варианты доступны всем телевизорам своей ориентации, «Прайс Брусника/Лето» только Бруснике и Лету.
  interface V { id: string; name: string; file: string; kind?: 'video'; o?: 'portrait'; mb: number; sec?: number; c: string; std?: false; ver: number; ago: number }
  const raw: V[] = [
    { id: 'v1', name: 'Основной прайс', file: 'Кофе классика', mb: 1.4, c: '#6b3f1d', ver: 4, ago: 3 },
    { id: 'v2', name: 'Прайс Брусника/Лето', file: 'Прайс Брусника/Лето', mb: 1.3, c: '#8a5a44', ver: 2, ago: 6, std: false },
    { id: 'v3', name: 'Завтраки', file: 'Завтраки', mb: 1.6, c: '#d9a441', ver: 3, ago: 5 },
    { id: 'v4', name: 'Десерты', file: 'Десерты', mb: 1.7, c: '#c98a5a', ver: 2, ago: 2 },
    { id: 'v5', name: 'Промо осень (видео)', file: 'Промо тыквенный латте', kind: 'video', mb: 8.4, sec: 15, c: '#d2691e', ver: 1, ago: 1 },
    { id: 'v6', name: 'Вертикальный — напитки', file: 'Вертикальное меню — кофе', o: 'portrait', mb: 1.5, c: '#6b3f1d', ver: 2, ago: 4 },
    { id: 'v7', name: 'Акцент на раф (видео)', file: 'Новинка: раф солёная карамель', kind: 'video', mb: 6.7, sec: 12, c: '#c8873a', ver: 1, ago: 1 },
    { id: 'v8', name: 'Сезонное меню осень', file: 'Сезонное меню осень', mb: 1.9, c: '#b4561a', ver: 2, ago: 2 },
    { id: 'v9', name: 'Эспрессо-бар', file: 'Эспрессо-бар', mb: 1.5, c: '#4a2c17', ver: 1, ago: 8 },
    { id: 'v10', name: 'Выпечка и бейглы', file: 'Выпечка', mb: 1.8, c: '#c07a3a', ver: 1, ago: 9 },
    { id: 'v11', name: 'Акция 2+1 (видео)', file: 'Акция 2+1', kind: 'video', mb: 5.1, sec: 10, c: '#b5472a', ver: 1, ago: 10 },
    { id: 'v12', name: 'Вертикальный — авторские', file: 'Вертикальное меню — авторские', o: 'portrait', mb: 1.4, c: '#8c4a2a', ver: 1, ago: 12 },
  ];
  const variants: MenuVariant[] = raw.map((r) => ({
    id: r.id, name: r.name, orientation: r.o ?? 'landscape', kind: r.kind ?? 'image', mime: r.kind ? 'video/mp4' : 'image/jpeg',
    sizeBytes: Math.round(r.mb * 1024 * 1024), width: r.o ? 1080 : 1920, height: r.o ? 1920 : 1080, durationSec: r.sec,
    fileName: r.file, previewColor: r.c, standard: r.std ?? true, version: r.ver, createdAt: t((r.ago + 8) * D), updatedAt: t(r.ago * D),
  }));

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
    a(2, 'Мария Соколова', 'Загрузка файла меню', 'Новинка: раф солёная карамель', 1 * D + 2 * H),
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
    a(14, 'Мария Соколова', 'Загрузка файла меню', 'Выпечка и бейглы', 4 * D + 2 * H),
    a(15, 'Илья Петров', 'Переключение меню', 'Литейный / ТВ 1', 2 * D + 3 * H),
    a(16, 'Мария Соколова', 'Создание кофейни', 'Вами', 9 * D),
    a(17, 'Мария Соколова', 'Изменение доступа к вариантам', 'Нарвские ворота / ТВ 2', 6 * H),
    a(18, 'Мария Соколова', 'Создание варианта меню', 'Вертикальный — напитки', 4 * D),
  ].sort((x, y) => +new Date(y.createdAt) - +new Date(x.createdAt));

  return { users, locations, screens, variants, audit, history, currentUserId: null };
}
