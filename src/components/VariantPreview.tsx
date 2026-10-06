import { useStore } from '@/store';
import { MenuPreview } from './MenuPreview';
import { PlayerStub } from './PlayerStub';

/** Превью варианта меню = его единственного файла. Нет варианта → заглушка плеера (логотип на фоне). */
export function VariantPreview({ variantId, className, compact, portrait }: { variantId: string | null | undefined; className?: string; compact?: boolean; portrait?: boolean }) {
  const variants = useStore((s) => s.variants);
  const media = useStore((s) => s.media);
  const v = variants.find((x) => x.id === variantId);
  const m = v && media.find((x) => x.id === v.mediaId);
  if (!m) return <PlayerStub portrait={portrait} className={className} />;
  return <MenuPreview media={m} compact={compact} className={className} />;
}
