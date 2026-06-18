import { cn } from '@/lib/utils';

export default function Logo({
  className,
  showText = true,
  onDark = false,
}: {
  className?: string;
  showText?: boolean;
  onDark?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img alt="DocuSmart" src="/nuvem_logo.png" className="h-8 w-auto" />
      {showText && (
        <span
          className={cn(
            'text-base font-semibold tracking-tight',
            onDark ? 'text-white' : 'text-foreground',
          )}
        >
          DocuSmart
          <span className={onDark ? 'text-sky-400' : 'text-sky-500'}>
            {' '}
            Intelligence
          </span>
        </span>
      )}
    </div>
  );
}
