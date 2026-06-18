import Link from 'next/link';

import Logo from '@/components/docusmart/logo';
import { APP_ROUTES } from '@/constants/app-routes';

export default function Error() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-6 py-24">
      <Logo />
      <h1 className="text-foreground mt-8 text-4xl font-semibold tracking-tight text-pretty sm:text-5xl">
        Algo deu errado.
      </h1>
      <p className="text-foreground/60 mt-6 text-lg font-medium text-pretty">
        Aconteceu um imprevisto, mas está tudo bem. Você pode voltar ao início.
      </p>
      <div className="mt-10">
        <Link
          href={APP_ROUTES.PUBLIC.HOME}
          className="text-sm/7 font-semibold text-indigo-600 hover:text-indigo-500"
        >
          <span aria-hidden="true">&larr;</span> Voltar ao início
        </Link>
      </div>
    </main>
  );
}
