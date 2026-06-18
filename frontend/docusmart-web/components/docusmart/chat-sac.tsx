'use client';

import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/solid';
import React from 'react';

import {
  PERGUNTAS_SUGERIDAS,
  perguntarAgente,
} from '@/lib/docusmart/mock-api';
import { cn } from '@/lib/utils';

interface Mensagem {
  autor: 'usuario' | 'agente';
  texto: string;
  fonte?: string;
}

const SAUDACAO: Mensagem = {
  autor: 'agente',
  texto:
    'Olá! Sou o assistente do SAC. Pergunte sobre valores de orçamento, documentos faltantes ou operações de um sinistro.',
};

export default function ChatSac() {
  const [mensagens, setMensagens] = React.useState<Mensagem[]>([SAUDACAO]);
  const [input, setInput] = React.useState('');
  const [pensando, setPensando] = React.useState(false);
  const fimRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, pensando]);

  async function enviar(pergunta: string) {
    const texto = pergunta.trim();
    if (!texto || pensando) return;
    setMensagens((m) => [...m, { autor: 'usuario', texto }]);
    setInput('');
    setPensando(true);
    const r = await perguntarAgente(texto);
    setPensando(false);
    setMensagens((m) => [
      ...m,
      { autor: 'agente', texto: r.resposta, fonte: r.fonte },
    ]);
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-foreground flex items-center gap-2 text-xl font-semibold">
          <SparklesIcon className="size-5 text-indigo-500" />
          Assistente SAC
        </h1>
        <p className="text-foreground/60 mt-1 text-sm">
          Consultas em linguagem natural sobre os sinistros (protótipo, dados de
          seed).
        </p>
      </div>

      {/* mensagens */}
      <div className="bg-background inset-ring-foreground/10 flex-1 space-y-4 overflow-y-auto rounded-xl p-4 shadow-sm inset-ring">
        {mensagens.map((m, i) => (
          <div
            key={i}
            className={cn(
              'flex',
              m.autor === 'usuario' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                m.autor === 'usuario'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-foreground/5 text-foreground',
              )}
            >
              <p>{m.texto}</p>
              {m.fonte && m.fonte !== '—' && (
                <p className="mt-1.5 text-xs opacity-60">via {m.fonte}</p>
              )}
            </div>
          </div>
        ))}
        {pensando && (
          <div className="flex justify-start">
            <div className="bg-foreground/5 flex items-center gap-1 rounded-2xl px-4 py-3.5">
              <span className="bg-foreground/40 size-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
              <span className="bg-foreground/40 size-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
              <span className="bg-foreground/40 size-2 animate-bounce rounded-full" />
            </div>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      {/* sugestões */}
      {mensagens.length <= 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {PERGUNTAS_SUGERIDAS.map((p) => (
            <button
              key={p}
              onClick={() => enviar(p)}
              className="bg-foreground/5 text-foreground/70 hover:bg-foreground/10 rounded-full px-3 py-1.5 text-xs"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(input);
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre um sinistro…"
          className="bg-background text-foreground placeholder:text-foreground/40 outline-foreground/20 focus:outline-indigo-600 flex-1 rounded-full px-4 py-2.5 text-sm outline -outline-offset-1 focus:outline-2 focus:-outline-offset-2"
        />
        <button
          type="submit"
          disabled={pensando || !input.trim()}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
          aria-label="Enviar"
        >
          <PaperAirplaneIcon className="size-5" />
        </button>
      </form>
    </div>
  );
}
