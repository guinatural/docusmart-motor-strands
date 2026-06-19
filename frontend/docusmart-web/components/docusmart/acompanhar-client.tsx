'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'next/navigation';
import React from 'react';

import StatusBadge from '@/components/docusmart/status-badge';
import Timeline from '@/components/docusmart/timeline';
import Button from '@/components/ui/button';
import InputWithLabel from '@/components/ui/input';
import { TIPO_SINISTRO } from '@/lib/docusmart/constants';
import { formatData } from '@/lib/docusmart/format';
import { obterSinistro, type SinistroDetalhe } from '@/lib/docusmart/mock-api';

export default function AcompanharClient() {
  const params = useSearchParams();
  const [numero, setNumero] = React.useState(params.get('n') ?? '');
  const [buscando, setBuscando] = React.useState(false);
  const [detalhe, setDetalhe] = React.useState<SinistroDetalhe | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  const buscar = React.useCallback(async (n: string) => {
    const alvo = n.trim().toUpperCase();
    if (!alvo) return;
    setBuscando(true);
    setErro(null);
    const r = await obterSinistro(alvo);
    setBuscando(false);
    if (!r) {
      setDetalhe(null);
      setErro(`Nenhum sinistro encontrado para "${alvo}".`);
      return;
    }
    setDetalhe(r);
  }, []);

  // auto-busca quando chega com ?n= na URL (vindo do upload)
  React.useEffect(() => {
    const n = params.get('n');
    if (n) buscar(n);
  }, [params, buscar]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">
        Acompanhar sinistro
      </h1>
      <p className="text-foreground/60 mt-1 text-sm">
        Informe o número de protocolo que você recebeu ao enviar os documentos.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          buscar(numero);
        }}
        className="mt-6 flex items-end gap-3"
      >
        <div className="flex-1">
          <InputWithLabel
            id="protocolo"
            label="Protocolo"
            placeholder="SIN-2026-00123"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={buscando} className="h-10 px-4">
          <MagnifyingGlassIcon className="mr-1.5 size-4" />
          {buscando ? 'Buscando…' : 'Buscar'}
        </Button>
      </form>

      {erro && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}

      {detalhe && (
        <div className="bg-background inset-ring-foreground/10 mt-8 rounded-2xl p-6 shadow-sm inset-ring">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-foreground font-mono text-lg font-semibold">
                {detalhe.sinistro.numero_sinistro}
              </p>
              <p className="text-foreground/60 text-sm">
                {TIPO_SINISTRO[detalhe.sinistro.tipo_sinistro]} ·{' '}
                {formatData(detalhe.sinistro.data_sinistro)}
              </p>
            </div>
            <StatusBadge status={detalhe.sinistro.status} />
          </div>

          {detalhe.sinistro.documentos_faltantes.length > 0 && (
            <div className="mt-4 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              <strong>Documentos pendentes:</strong>{' '}
              {detalhe.sinistro.documentos_faltantes.join(', ')}. Reenvie para
              dar andamento.
            </div>
          )}

          <h2 className="text-foreground mt-6 mb-4 text-sm font-semibold">
            Andamento
          </h2>
          <Timeline operacoes={detalhe.operacoes} />
        </div>
      )}
    </div>
  );
}
