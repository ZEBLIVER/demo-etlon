import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { playerAck, playerPing } from '@/api';
import { VariantPreview } from '@/components/VariantPreview';
import { useStore } from '@/store';

/**
 * Заглушка плеера: страница, которую телевизор открывает по своей ссылке /<код кофейни>/<номер ТВ>.
 * Без авторизации (меню не секретное). Раз в 5 секунд (в реальности ~5 минут) «отчитывается» серверу
 * и, увидев новую версию, «скачивает» её и переключается. Работает между вкладками через localStorage.
 */
export default function PlayerPage() {
  const { code = '', num = '' } = useParams();
  const n = Number(num);
  const location = useStore((s) => s.locations.find((l) => l.code === code && !l.archived));
  const screen = useStore((s) => (location ? s.screens.find((x) => x.locationId === location.id && x.number === n) : undefined));
  const pending = useRef(false);

  useEffect(() => {
    document.title = 'Плеер ТВ-меню';
    const tick = () => {
      const sc = playerPing(code, n);
      if (sc && sc.shownVersion < sc.version && !pending.current) {
        pending.current = true;
        setTimeout(() => { playerAck(code, n); pending.current = false; }, 4000); // «скачивание» файла
      }
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
  }, [code, n]);

  if (!screen || !location) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center text-white">
        <div className="text-2xl font-semibold">Телевизор не найден</div>
        <div className="mt-2 text-white/60">Проверьте адрес: etlonmenu.ru/код-кофейни/номер-телевизора</div>
      </div>
    );
  }
  const portrait = screen.orientation === 'portrait';
  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-black">
      <div style={{ width: portrait ? 'min(100vw, 56.25vh)' : 'min(100vw, 177.78vh)' }}>
        <VariantPreview variantId={screen.shownVariantId} portrait={portrait} className="!rounded-none" />
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-[11px] text-white/60">
        Заглушка плеера · {location.name}, {screen.name} · версия {screen.shownVersion}
        {screen.shownVersion < screen.version && ` → обновляется до ${screen.version}…`}
      </div>
    </div>
  );
}
