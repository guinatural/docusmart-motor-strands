import { statusSinistroMeta, TONE_CLASSES } from '@/lib/docusmart/constants';
import { cn } from '@/lib/utils';

export default function StatusBadge({
  status,
  className,
}: {
  status?: string;
  className?: string;
}) {
  const meta = statusSinistroMeta(status);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONE_CLASSES[meta.tone],
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
