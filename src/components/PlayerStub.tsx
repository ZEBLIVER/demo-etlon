import { Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Заглушка: пока на телевизоре не выбрано ни одно меню — логотип на фоне */
export function PlayerStub({ portrait, className }: { portrait?: boolean; className?: string }) {
  return (
    <div
      className={cn('flex w-full flex-col items-center justify-center gap-[3cqw] overflow-hidden rounded-lg text-white', portrait ? 'aspect-[9/16]' : 'aspect-video', className)}
      style={{ containerType: 'inline-size', background: 'linear-gradient(145deg, #3b2412, #6b3f1d 55%, #b98a5a)' }}
    >
      <div className="flex items-center justify-center rounded-full bg-white/15" style={{ width: '16cqw', height: '16cqw' }}>
        <Coffee style={{ width: '8cqw', height: '8cqw' }} />
      </div>
      <div className="font-semibold tracking-wide" style={{ fontSize: '5cqw' }}>Etlon Coffee</div>
    </div>
  );
}
