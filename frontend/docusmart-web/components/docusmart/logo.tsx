import { cn } from '@/lib/utils';

export default function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        alt="DocuSmart"
        src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
        className="h-8 w-auto"
      />
      {showText && (
        <span className="text-foreground text-base font-semibold tracking-tight">
          DocuSmart
          <span className="text-indigo-500"> Intelligence</span>
        </span>
      )}
    </div>
  );
}
