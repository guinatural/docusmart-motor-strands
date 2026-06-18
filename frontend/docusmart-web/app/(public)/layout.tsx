import Link from 'next/link';

import Logo from '@/components/docusmart/logo';
import { APP_ROUTES } from '@/constants/app-routes';

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-foreground/10 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href={APP_ROUTES.PUBLIC.HOME}>
            <Logo />
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href={APP_ROUTES.PUBLIC.ACOMPANHAR}
              className="text-foreground/70 hover:text-foreground"
            >
              Acompanhar
            </Link>
            <Link
              href={APP_ROUTES.PRIVATE.PAINEL}
              className="rounded-md bg-sky-600 px-3 py-1.5 text-white hover:bg-sky-500"
            >
              Área do analista
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-foreground/10 text-foreground/50 border-t px-4 py-6 text-center text-xs">
        DocuSmart Intelligence — projeto educacional (Hack2Hire 2026). Dados
        fictícios.
      </footer>
    </div>
  );
}
