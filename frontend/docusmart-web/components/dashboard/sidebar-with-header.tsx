'use client';

import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  ChatBubbleLeftRightIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

import Logo from '@/components/docusmart/logo';
import { APP_ROUTES } from '@/constants/app-routes';
import { sair, usuarioAtual } from '@/lib/docusmart/auth';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Painel', href: APP_ROUTES.PRIVATE.PAINEL, icon: Squares2X2Icon },
  {
    name: 'Assistente SAC',
    href: APP_ROUTES.PRIVATE.ASSISTENTE,
    icon: ChatBubbleLeftRightIcon,
  },
];

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <ul role="list" className="-mx-2 space-y-1">
      {navigation.map((item) => {
        const isCurrent =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.name}>
            <Link
              href={item.href}
              className={cn(
                isCurrent
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white',
                'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
              )}
            >
              <item.icon aria-hidden="true" className="size-6 shrink-0" />
              {item.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function SidebarWithHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [nome, setNome] = React.useState('Analista');
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    const u = usuarioAtual();
    if (u) setNome(u);
  }, []);

  function logout() {
    sair();
    router.replace(APP_ROUTES.PUBLIC.LOGIN);
  }

  return (
    <React.Fragment>
      {/* mobile sidebar */}
      <Dialog
        open={sidebarOpen}
        onClose={setSidebarOpen}
        className="relative z-50 lg:hidden"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />
        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
          >
            <div className="absolute top-0 left-full flex w-16 justify-center pt-5">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="-m-2.5 p-2.5"
              >
                <span className="sr-only">Fechar menu</span>
                <XMarkIcon aria-hidden="true" className="size-6 text-white" />
              </button>
            </div>
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 ring-1 ring-white/10">
              <div className="flex h-16 shrink-0 items-center">
                <Logo onDark />
              </div>
              <nav className="flex flex-1 flex-col">
                <NavLinks pathname={pathname} />
              </nav>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* desktop sidebar */}
      <div className="hidden bg-gray-900 ring-1 ring-white/10 lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Logo onDark />
          </div>
          <nav className="flex flex-1 flex-col">
            <NavLinks pathname={pathname} />
          </nav>
        </div>
      </div>

      {/* main content */}
      <div className="lg:pl-72">
        <div className="bg-background border-foreground/10 sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b px-4 shadow-xs sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-foreground/60 hover:text-foreground -m-2.5 p-2.5 lg:hidden"
          >
            <span className="sr-only">Abrir menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>

          <div className="flex flex-1 items-center justify-end gap-x-3">
            <Link
              href={APP_ROUTES.PUBLIC.HOME}
              className="text-foreground/60 hover:text-foreground text-sm font-medium"
            >
              Ver página pública
            </Link>
            <div className="bg-foreground/10 h-6 w-px" />
            <div className="flex items-center gap-2">
              <UserCircleIcon className="text-foreground/40 size-8" />
              <div className="hidden sm:block">
                <p className="text-foreground text-sm font-semibold">{nome}</p>
                <p className="text-foreground/50 text-xs">
                  Analista de sinistros
                </p>
              </div>
            </div>
            <div className="bg-foreground/10 h-6 w-px" />
            <button
              type="button"
              onClick={logout}
              title="Sair"
              className="text-foreground/60 hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
            >
              <ArrowRightStartOnRectangleIcon className="size-5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        <main className="py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </React.Fragment>
  );
}
