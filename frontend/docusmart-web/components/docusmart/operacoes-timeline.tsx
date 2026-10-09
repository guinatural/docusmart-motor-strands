import type { OperacaoApi } from '@/lib/docusmart/api';
import { ETAPA_OPERACAO } from '@/lib/docusmart/constants';
import { formatDataHora } from '@/lib/docusmart/format';

function rotuloEtapa(etapa?: string): string {
  if (!etapa) return 'Operação';
  const conhecidas = ETAPA_OPERACAO as Record<string, string>;
  return conhecidas[etapa] ?? etapa.charAt(0).toUpperCase() + etapa.slice(1);
}

export default function OperacoesTimeline({
  operacoes,
}: {
  operacoes: OperacaoApi[];
}) {
  if (!operacoes.length) {
    return (
      <p className="text-foreground/50 text-sm">
        Nenhuma operação registrada ainda.
      </p>
    );
  }

  const ordenadas = [...operacoes].sort((a, b) =>
    (a.ts ?? a.timestamp ?? '').localeCompare(b.ts ?? b.timestamp ?? ''),
  );

  return (
    <ol className="relative space-y-5 border-l border-foreground/15 pl-5">
      {ordenadas.map((op, i) => (
        <li key={op.id ?? `${op.ts ?? op.timestamp ?? ''}-${i}`} className="relative">
          <span className="absolute top-1 -left-[1.4rem] size-2.5 rounded-full bg-sky-500 ring-4 ring-background" />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-foreground text-sm font-semibold">
              {rotuloEtapa(op.etapa)}
            </span>
            {op.status && (
              <span className="text-foreground/40 text-xs">({op.status})</span>
            )}
            <span className="text-foreground/40 ml-auto text-xs">
              {formatDataHora(op.ts ?? op.timestamp)}
            </span>
          </div>
          {(op.detalhes ?? op.detalhe) && (
            <p className="text-foreground/70 mt-0.5 text-sm">
              {op.detalhes ?? op.detalhe}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
