'use client';

import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  DocumentIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

import Button from '@/components/ui/button';
import InputWithLabel from '@/components/ui/input';
import { APP_ROUTES } from '@/constants/app-routes';
import DatePicker from '@/components/docusmart/date-picker';
import StatusBadge from '@/components/docusmart/status-badge';
import { TIPO_SINISTRO } from '@/lib/docusmart/constants';
import { criarSinistro, type IntakeResultado } from '@/lib/docusmart/mock-api';
import type { TipoSinistro } from '@/lib/docusmart/types';
import { notifyError } from '@/lib/ui/notifications';
import { cn } from '@/lib/utils';

export default function UploadForm() {
  const [numeroApolice, setNumeroApolice] = React.useState('');
  const [tipoSinistro, setTipoSinistro] = React.useState<TipoSinistro>('colisao');
  const [dataSinistro, setDataSinistro] = React.useState('');
  const [local, setLocal] = React.useState('');
  const [contato, setContato] = React.useState('');
  const [terceiros, setTerceiros] = React.useState(false);
  const [arquivos, setArquivos] = React.useState<string[]>([]);
  const [enviando, setEnviando] = React.useState(false);
  const [resultado, setResultado] = React.useState<IntakeResultado | null>(null);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const nomes = Array.from(e.target.files ?? []).map((f) => f.name);
    setArquivos((prev) => Array.from(new Set([...prev, ...nomes])));
    e.target.value = '';
  }

  function removerArquivo(nome: string) {
    setArquivos((prev) => prev.filter((a) => a !== nome));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const r = await criarSinistro({
      numero_apolice: numeroApolice,
      tipo_sinistro: tipoSinistro,
      data_sinistro: dataSinistro,
      local,
      terceiros_envolvidos: terceiros,
      contato,
      arquivos,
    });
    setEnviando(false);
    if (!r.ok) {
      notifyError(r.erro ?? 'Não foi possível registrar o sinistro.');
      return;
    }
    setResultado(r);
  }

  // ── Tela de protocolo gerado ───────────────────────────────────────────────
  if (resultado?.ok && resultado.numero_sinistro) {
    return (
      <div className="bg-background inset-ring-foreground/10 rounded-2xl p-8 shadow-sm inset-ring">
        <div className="flex flex-col items-center text-center">
          <CheckCircleIcon className="size-12 text-emerald-500" />
          <h2 className="text-foreground mt-4 text-xl font-semibold">
            Pacote recebido!
          </h2>
          <p className="text-foreground/60 mt-1 text-sm">
            Guarde o número de protocolo para acompanhar o andamento.
          </p>

          <div className="border-foreground/10 mt-6 w-full rounded-xl border border-dashed p-5">
            <p className="text-foreground/50 text-xs tracking-wide uppercase">
              Protocolo do sinistro
            </p>
            <p className="text-foreground mt-1 font-mono text-2xl font-semibold">
              {resultado.numero_sinistro}
            </p>
            <div className="mt-3">
              <StatusBadge status={resultado.status ?? 'EM_PROCESSAMENTO'} />
            </div>
          </div>

          <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href={`${APP_ROUTES.PUBLIC.ACOMPANHAR}?n=${resultado.numero_sinistro}`}
            >
              <Button className="w-full sm:w-auto">Acompanhar sinistro</Button>
            </Link>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setResultado(null);
                setArquivos([]);
                setNumeroApolice('');
                setDataSinistro('');
                setLocal('');
                setContato('');
              }}
            >
              Enviar outro
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulário de intake ───────────────────────────────────────────────────
  return (
    <form
      onSubmit={onSubmit}
      className="bg-background inset-ring-foreground/10 space-y-5 rounded-2xl p-6 shadow-sm inset-ring sm:p-8"
    >
      <InputWithLabel
        id="numero_apolice"
        label="Número da apólice"
        placeholder="AP-2024-5567"
        value={numeroApolice}
        onChange={(e) => setNumeroApolice(e.target.value)}
        required
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="tipo_sinistro"
            className="text-foreground block text-sm/6 font-medium"
          >
            Tipo de sinistro
          </label>
          <select
            id="tipo_sinistro"
            value={tipoSinistro}
            onChange={(e) => setTipoSinistro(e.target.value as TipoSinistro)}
            className="bg-background text-foreground outline-foreground/20 focus:outline-indigo-600 mt-2 block h-10 w-full rounded-md px-3 text-sm outline -outline-offset-1 focus:outline-2 focus:-outline-offset-2"
          >
            {Object.entries(TIPO_SINISTRO).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <DatePicker
          id="data_sinistro"
          label="Data do sinistro"
          value={dataSinistro}
          onChange={setDataSinistro}
        />
      </div>

      <InputWithLabel
        id="local"
        label="Local do ocorrido"
        placeholder="Av. Paulista, 1000 - São Paulo-SP"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        required
      />

      <InputWithLabel
        id="contato"
        label="E-mail para contato"
        type="email"
        placeholder="voce@email.com"
        value={contato}
        onChange={(e) => setContato(e.target.value)}
        required
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={terceiros}
          onChange={(e) => setTerceiros(e.target.checked)}
          className="size-4 rounded border-foreground/30 text-indigo-600 focus:ring-indigo-600"
        />
        <span className="text-foreground/80">
          Houve terceiros envolvidos no sinistro
        </span>
      </label>

      {/* upload de arquivos */}
      <div>
        <span className="text-foreground block text-sm/6 font-medium">
          Documentos do pacote
        </span>
        <label
          htmlFor="arquivos"
          className="border-foreground/20 hover:border-indigo-500 mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors"
        >
          <ArrowUpTrayIcon className="text-foreground/40 size-7" />
          <span className="text-foreground/70 mt-2 text-sm">
            Clique para anexar (CNH, CRLV, orçamento, BO…)
          </span>
          <span className="text-foreground/40 mt-1 text-xs">
            PDF ou imagem — protótipo, os arquivos não são enviados
          </span>
          <input
            id="arquivos"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={onPickFiles}
            className="hidden"
          />
        </label>

        {arquivos.length > 0 && (
          <ul className="mt-3 space-y-2">
            {arquivos.map((nome) => (
              <li
                key={nome}
                className="bg-foreground/5 flex items-center justify-between rounded-md px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <DocumentIcon className="text-foreground/40 size-4 shrink-0" />
                  <span className="truncate">{nome}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removerArquivo(nome)}
                  className="text-foreground/40 hover:text-foreground"
                  aria-label={`Remover ${nome}`}
                >
                  <XMarkIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={enviando}
        className={cn('w-full', enviando && 'opacity-70')}
      >
        {enviando ? 'Registrando…' : 'Registrar sinistro'}
      </Button>

      <p className="text-foreground/50 text-center text-xs">
        Apólices de teste: AP-2024-5567 · AP-2024-7702 · AP-2025-1180
      </p>
    </form>
  );
}
