import { ETAPA_OPERACAO } from '@/lib/docusmart/constants';
import { formatDataHora } from '@/lib/docusmart/format';
import type { Operacao } from '@/lib/docusmart/types';

export default function Timeline({ operacoes }: { operacoes: Operacao[] }) {
  if (!operacoes.length) {
    return (
      <p className="text-foreground/50 text-sm">
        Nenhuma operação registrada ainda.
      </p>
    );
  }

  return (
    <ol className="relative space-y-5 border-l border-foreground/15 pl-5">
      {operacoes.map((op, i) => (
        <li key={`${op.timestamp}-${i}`} className="relative">
          <span className="absolute top-1 -left-[1.4rem] size-2.5 rounded-full bg-indigo-500 ring-4 ring-background" />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-foreground text-sm font-semibold">
              {ETAPA_OPERACAO[op.etapa]}
            </span>
            {op.documento_id && (
              <span className="text-foreground/40 font-mono text-xs">
                {op.documento_id}
              </span>
            )}
            <span className="text-foreground/40 ml-auto text-xs">
              {formatDataHora(op.timestamp)}
            </span>
          </div>
          <p className="text-foreground/70 mt-0.5 text-sm">{op.detalhe}</p>
        </li>
      ))}
    </ol>
  );
}
