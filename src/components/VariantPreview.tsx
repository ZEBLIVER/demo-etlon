import { useStore } from '@/store';
import { MenuPreview } from './MenuPreview';
import { PlayerStub } from './PlayerStub';

/** Превью варианта меню (= его единственного файла). Нет варианта → заглушка плеера (логотип на фоне). */
export function VariantPreview({ variantId, className, compact, portrait }: { variantId: string | null | undefined; className?: string; compact?: boolean; portrait?: boolean }) {
  const v = useStore((s) => s.variants.find((x) => x.id === variantId));
  if (!v) return <PlayerStub portrait={portrait} className={className} />;
  return <MenuPreview variant={v} compact={compact} className={className} />;
}
