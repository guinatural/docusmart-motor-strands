'use client';

import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/20/solid';
import React from 'react';

import { cn } from '@/lib/utils';

export default function CopyButton({
  value,
  className,
  label = 'Copiar',
}: {
  value: string;
  className?: string;
  label?: string;
}) {
  const [copiado, setCopiado] = React.useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(value);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard indisponível — ignora */
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
        copiado
          ? 'text-emerald-600'
          : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5',
        className,
      )}
    >
      {copiado ? (
        <CheckIcon className="size-4" />
      ) : (
        <ClipboardDocumentIcon className="size-4" />
      )}
      {copiado ? 'Copiado' : label}
    </button>
  );
}
