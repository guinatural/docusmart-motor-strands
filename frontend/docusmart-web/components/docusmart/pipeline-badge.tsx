import { statusPipelineMeta, TONE_CLASSES } from '@/lib/docusmart/constants';
import { cn } from '@/lib/utils';

export default function PipelineBadge({
  status,
  className,
}: {
  status?: string;
  className?: string;
}) {
  const meta = statusPipelineMeta(status);
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
