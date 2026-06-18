import { STATUS_SINISTRO, TONE_CLASSES } from '@/lib/docusmart/constants';
import type { StatusSinistro } from '@/lib/docusmart/types';
import { cn } from '@/lib/utils';

export default function StatusBadge({
  status,
  className,
}: {
  status: StatusSinistro;
  className?: string;
}) {
  const meta = STATUS_SINISTRO[status];
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
