'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

import { APP_ROUTES } from '@/constants/app-routes';
import { usuarioAtual } from '@/lib/docusmart/auth';

/** Gate da área do analista: redireciona para /login se não houver sessão. */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = React.useState(false);

  React.useEffect(() => {
    if (usuarioAtual()) setOk(true);
    else router.replace(APP_ROUTES.PUBLIC.LOGIN);
  }, [router]);

  if (!ok) return null;
  return <>{children}</>;
}
