import { TIPO_SINISTRO } from '@/lib/docusmart/constants';
import type { SinistroApi } from '@/lib/docusmart/api';

// Cores por status (hex direto, usado no SVG e nas legendas)
const COR_STATUS: Record<string, string> = {
  APROVADO: '#10b981',
  EM_ANALISE: '#f59e0b',
  PENDENTE_DOCUMENTACAO: '#f97316',
  EM_PROCESSAMENTO: '#3b82f6',
  NEGADO: '#ef4444',
  ENCERRADO: '#94a3b8',
};
const LABEL_STATUS: Record<string, string> = {
  APROVADO: 'Aprovado',
  EM_ANALISE: 'Em análise',
  PENDENTE_DOCUMENTACAO: 'Pendente de doc.',
  EM_PROCESSAMENTO: 'Em processamento',
  NEGADO: 'Negado',
  ENCERRADO: 'Encerrado',
};

function Card({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background inset-ring-foreground/10 rounded-xl p-5 shadow-sm inset-ring">
      <h3 className="text-foreground/70 mb-4 text-sm font-semibold">{titulo}</h3>
      {children}
    </div>
  );
}

function Donut({ data, total }: { data: { cor: string; valor: number }[]; total: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative size-36 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="12" className="stroke-foreground/10" />
        {data
          .filter((d) => d.valor > 0)
          .map((d, i) => {
            const len = total ? (d.valor / total) * c : 0;
            const el = (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={d.cor}
                strokeWidth="12"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-acc}
              />
            );
            acc += len;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-foreground text-2xl font-semibold">{total}</span>
        <span className="text-foreground/50 text-xs">sinistros</span>
      </div>
    </div>
  );
}

export default function PainelGraficos({ sinistros }: { sinistros: SinistroApi[] }) {
  const total = sinistros.length;

  // distribuição por status
  const porStatus = new Map<string, number>();
  for (const s of sinistros) {
    const k = s.status ?? 'EM_PROCESSAMENTO';
    porStatus.set(k, (porStatus.get(k) ?? 0) + 1);
  }
  const statusData = [...porStatus.entries()]
    .map(([status, valor]) => ({
      status,
      valor,
      cor: COR_STATUS[status] ?? '#94a3b8',
      label: LABEL_STATUS[status] ?? status,
    }))
    .sort((a, b) => b.valor - a.valor);

  // distribuição por tipo
  const porTipo = new Map<string, number>();
  for (const s of sinistros) {
    const t = s.dados_formulario?.tipo_sinistro ?? 'outro';
    porTipo.set(t, (porTipo.get(t) ?? 0) + 1);
  }
  const tipoData = [...porTipo.entries()]
    .map(([tipo, valor]) => ({
      label: TIPO_SINISTRO[tipo as keyof typeof TIPO_SINISTRO] ?? tipo,
      valor,
    }))
    .sort((a, b) => b.valor - a.valor);
  const maxTipo = Math.max(1, ...tipoData.map((t) => t.valor));

  // taxa de automação (resolvidos sem análise humana)
  const emAnalise = porStatus.get('EM_ANALISE') ?? 0;
  const taxaAuto = total ? Math.round(((total - emAnalise) / total) * 100) : 0;

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card titulo="Distribuição por status">
        <div className="flex items-center gap-5">
          <Donut data={statusData} total={total} />
          <ul className="min-w-0 flex-1 space-y-1.5">
            {statusData.map((d) => (
              <li key={d.status} className="flex items-center gap-2 text-sm">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.cor }} />
                <span className="text-foreground/70 truncate">{d.label}</span>
                <span className="text-foreground ml-auto font-medium">{d.valor}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card titulo="Por tipo de sinistro">
        {tipoData.length === 0 ? (
          <p className="text-foreground/40 text-sm">Sem dados.</p>
        ) : (
          <ul className="space-y-3">
            {tipoData.map((t) => (
              <li key={t.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-foreground/70">{t.label}</span>
                  <span className="text-foreground font-medium">{t.valor}</span>
                </div>
                <div className="bg-foreground/10 h-2 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${(t.valor / maxTipo) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card titulo="Taxa de automação">
        <div className="flex h-full flex-col justify-center">
          <p className="text-foreground text-4xl font-semibold">{taxaAuto}%</p>
          <p className="text-foreground/60 mt-1 text-sm">
            decididos sem análise humana
          </p>
          <p className="text-foreground/40 mt-3 text-xs">
            {emAnalise} {emAnalise === 1 ? 'sinistro aguarda' : 'sinistros aguardam'} revisão do analista
          </p>
        </div>
      </Card>
    </div>
  );
}
