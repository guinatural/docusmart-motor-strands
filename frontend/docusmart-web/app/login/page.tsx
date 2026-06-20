'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

import Logo from '@/components/docusmart/logo';
import Button from '@/components/ui/button';
import InputWithLabel from '@/components/ui/input';
import { APP_ROUTES } from '@/constants/app-routes';
import { entrar } from '@/lib/docusmart/auth';

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = React.useState('');
  const [senha, setSenha] = React.useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    entrar(usuario.trim() || 'Analista');
    router.replace(APP_ROUTES.PRIVATE.PAINEL);
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="bg-background inset-ring-foreground/10 mt-8 rounded-2xl p-6 shadow-sm inset-ring sm:p-8">
          <h1 className="text-foreground text-lg font-semibold">
            Área do analista
          </h1>
          <p className="text-foreground/60 mt-1 text-sm">
            Entre para acessar o painel de sinistros.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <InputWithLabel
              id="usuario"
              label="Usuário"
              placeholder="analista"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
            <InputWithLabel
              id="senha"
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <Button type="submit" size="lg" className="w-full">
              Entrar
            </Button>
          </form>

          <p className="text-foreground/40 mt-4 text-center text-xs">
            Acesso de demonstração — qualquer usuário e senha funcionam.
          </p>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link
            href={APP_ROUTES.PUBLIC.HOME}
            className="text-foreground/60 hover:text-foreground"
          >
            ← Voltar ao envio de documentos
          </Link>
        </p>
      </div>
    </div>
  );
}
