import { Play } from 'lucide-react';
import type { MenuVariant } from '@/lib/types';
import { cn } from '@/lib/utils';

// Строки «позиция — цена» для сгенерированных карточек меню (по имени исходного файла)
const LINES: Record<string, [string, string][]> = {
  'Кофе классика': [['Эспрессо', '150 ₽'], ['Американо', '180 ₽'], ['Капучино', '240 ₽'], ['Латте', '260 ₽']],
  'Сезонное меню осень': [['Тыквенный латте', '320 ₽'], ['Масала-чай', '280 ₽'], ['Глинтвейн б/а', '300 ₽']],
  'Десерты': [['Чизкейк', '290 ₽'], ['Эклер', '190 ₽'], ['Тирамису', '320 ₽']],
  'Завтраки': [['Сырники', '320 ₽'], ['Овсянка', '210 ₽'], ['Омлет', '290 ₽']],
  'Прайс Брусника/Лето': [['Айс-латте', '280 ₽'], ['Колд брю', '260 ₽'], ['Лимонад', '240 ₽']],
  'Эспрессо-бар': [['Доппио', '190 ₽'], ['Флэт уайт', '270 ₽'], ['Раф', '310 ₽']],
  'Выпечка': [['Круассан', '170 ₽'], ['Булочка с корицей', '160 ₽'], ['Маффин', '150 ₽']],
  'Вертикальное меню — кофе': [['Эспрессо', '150 ₽'], ['Капучино', '240 ₽'], ['Латте', '260 ₽'], ['Флэт уайт', '270 ₽'], ['Раф', '310 ₽']],
  'Вертикальное меню — авторские': [['Раф солёная карамель', '330 ₽'], ['Бамбл', '300 ₽'], ['Орех-латте', '320 ₽'], ['Кокос-капучино', '310 ₽']],
};
const DEFAULT_LINES: [string, string][] = [['Позиция 1', '200 ₽'], ['Позиция 2', '250 ₽'], ['Позиция 3', '300 ₽']];

const mix = (c: string, pct: number, withColor: string) => `color-mix(in srgb, ${c} ${pct}%, ${withColor})`;

/** Превью варианта меню: «карточка меню» в тёплых тонах. У видео поверх Play, длительность и полоска цикла. */
export function MenuPreview({ variant, className, compact }: { variant: MenuVariant | null | undefined; className?: string; compact?: boolean }) {
  if (!variant) {
    return (
      <div className={cn('flex aspect-video w-full items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground', className)}>
        Нет меню
      </div>
    );
  }
  const portrait = variant.orientation === 'portrait';
  const lines = LINES[variant.fileName] ?? DEFAULT_LINES;
  const c = variant.previewColor;
  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-lg text-white', portrait ? 'aspect-[9/16]' : 'aspect-video', className)}
      style={{ containerType: 'inline-size', background: `linear-gradient(145deg, ${mix(c, 78, '#000')}, ${c} 55%, ${mix(c, 55, '#f6dfbd')})` }}
    >
      <div className="absolute -right-[10%] -top-[18%] h-[60%] aspect-square rounded-full bg-white/10" />
      <div className="absolute -bottom-[25%] -left-[8%] h-[55%] aspect-square rounded-full bg-black/10" />
      <div className="relative flex h-full flex-col" style={{ padding: '6cqw 7cqw' }}>
        <div className="font-bold leading-tight tracking-tight" style={{ fontSize: portrait ? '9cqw' : '5.2cqw' }}>
          {variant.fileName}
        </div>
        {!compact && (
          <div className="mt-[3cqw] space-y-[1.2cqw]" style={{ fontSize: portrait ? '5.4cqw' : '3cqw' }}>
            {lines.map(([n, p]) => (
              <div key={n} className="flex items-baseline gap-[1.5cqw] text-white/90">
                <span className="truncate">{n}</span>
                <span className="min-w-2 flex-1 border-b border-dotted border-white/40" />
                <span className="font-semibold">{p}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-auto font-semibold uppercase tracking-widest text-white/60" style={{ fontSize: portrait ? '3.4cqw' : '1.8cqw' }}>
          ☕ Кофейня
        </div>
      </div>
      {variant.kind === 'video' && (
        <>
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <span className="flex items-center justify-center rounded-full bg-white/90 text-black shadow-lg" style={{ width: '14cqw', height: '14cqw' }}>
              <Play className="fill-current" style={{ width: '6cqw', height: '6cqw' }} />
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-[1cqw] bg-black/30">
            <div className="loop-bar h-full bg-white/80" style={{ animationDuration: `${variant.durationSec ?? 10}s` }} />
          </div>
          <span className="absolute bottom-[2.6cqw] right-[2cqw] rounded bg-black/60 px-[1.6cqw] py-[0.5cqw] font-medium" style={{ fontSize: '2.6cqw' }}>
            0:{String(variant.durationSec ?? 0).padStart(2, '0')}
          </span>
        </>
      )}
    </div>
  );
}
