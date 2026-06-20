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
import CopyButton from '@/components/docusmart/copy-button';
import DatePicker from '@/components/docusmart/date-picker';
import StatusBadge from '@/components/docusmart/status-badge';
import { TIPO_SINISTRO } from '@/lib/docusmart/constants';
import {
  criarSinistroApi,
  uploadPacote,
  type IntakeResposta,
} from '@/lib/docusmart/api';
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
  const [arquivos, setArquivos] = React.useState<File[]>([]);
  const [arrastando, setArrastando] = React.useState(false);
  const [enviando, setEnviando] = React.useState(false);
  const [resultado, setResultado] = React.useState<IntakeResposta | null>(null);

  function adicionar(novos: File[]) {
    setArquivos((prev) => {
      const nomes = new Set(prev.map((f) => f.name));
      return [...prev, ...novos.filter((f) => !nomes.has(f.name))];
    });
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    adicionar(Array.from(e.target.files ?? []));
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setArrastando(false);
    adicionar(Array.from(e.dataTransfer.files ?? []));
  }

  function removerArquivo(nome: string) {
    setArquivos((prev) => prev.filter((a) => a.name !== nome));
  }

  function formatTamanho(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (arquivos.length === 0) {
      notifyError('Anexe ao menos um documento do pacote.');
      return;
    }
    setEnviando(true);
    try {
      // 1) Upload real dos arquivos pro S3 (presigned URL via API Gateway)
      const keys = await uploadPacote(arquivos);

      // 2) Intake: cria o sinistro e dispara o pipeline
      const r = await criarSinistroApi(
        {
          numero_apolice: numeroApolice,
          tipo_sinistro: tipoSinistro,
          data_sinistro: dataSinistro,
          local,
          terceiros_envolvidos: terceiros,
          contato,
        },
        keys,
      );
      setResultado(r);
    } catch (err) {
      notifyError(
        err instanceof Error ? err.message : 'Falha no envio dos documentos.',
      );
    } finally {
      setEnviando(false);
    }
  }

  // ── Tela de protocolo gerado ───────────────────────────────────────────────
  if (resultado?.sinistro_id) {
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
            <div className="mt-1 flex items-center justify-center gap-1">
              <p className="text-foreground font-mono text-lg font-semibold break-all">
                {resultado.sinistro_id}
              </p>
              <CopyButton value={resultado.sinistro_id} label="" />
            </div>
            <div className="mt-3">
              <StatusBadge status={resultado.status} />
            </div>
          </div>

          <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href={`${APP_ROUTES.PUBLIC.ACOMPANHAR}?n=${resultado.sinistro_id}`}
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
        placeholder="AP-2026-MFL-00123"
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
            className="bg-background text-foreground outline-foreground/20 focus:outline-sky-600 mt-2 block h-10 w-full rounded-md px-3 text-sm outline -outline-offset-1 focus:outline-2 focus:-outline-offset-2"
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
          className="size-4 rounded border-foreground/30 text-sky-600 focus:ring-sky-600"
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
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={onDrop}
          className={cn(
            'mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors',
            arrastando
              ? 'border-sky-500 bg-sky-500/5'
              : 'border-foreground/20 hover:border-sky-500',
          )}
        >
          <ArrowUpTrayIcon className="text-foreground/40 size-7" />
          <span className="text-foreground/70 mt-2 text-sm">
            {arrastando
              ? 'Solte os arquivos aqui'
              : 'Arraste e solte ou clique para anexar (CNH, CRLV, orçamento, BO…)'}
          </span>
          <span className="text-foreground/40 mt-1 text-xs">
            PDF ou imagem — enviados com segurança para o S3
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
            {arquivos.map((arquivo) => (
              <li
                key={arquivo.name}
                className="bg-foreground/5 flex items-center justify-between rounded-md px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <DocumentIcon className="text-foreground/40 size-4 shrink-0" />
                  <span className="truncate">{arquivo.name}</span>
                  <span className="text-foreground/40 shrink-0 text-xs">
                    {formatTamanho(arquivo.size)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removerArquivo(arquivo.name)}
                  className="text-foreground/40 hover:text-foreground"
                  aria-label={`Remover ${arquivo.name}`}
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
        {enviando ? 'Enviando documentos…' : 'Registrar sinistro'}
      </Button>

      <p className="text-foreground/50 text-center text-xs">
        Seus documentos são processados automaticamente após o envio.
      </p>
    </form>
  );
}
