'use client';

import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/20/solid';
import React from 'react';

import { formatData } from '@/lib/docusmart/format';
import { cn } from '@/lib/utils';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function toISO(ano: number, mes: number, dia: number): string {
  const mm = String(mes + 1).padStart(2, '0');
  const dd = String(dia).padStart(2, '0');
  return `${ano}-${mm}-${dd}`;
}

export default function DatePicker({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string; // ISO yyyy-mm-dd
  onChange: (iso: string) => void;
}) {
  const hoje = new Date();
  const inicial = value ? value.split('-').map(Number) : null;

  const [view, setView] = React.useState(() => ({
    ano: inicial ? inicial[0] : hoje.getFullYear(),
    mes: inicial ? inicial[1] - 1 : hoje.getMonth(),
  }));

  const primeiroDiaSemana = new Date(view.ano, view.mes, 1).getDay();
  const diasNoMes = new Date(view.ano, view.mes + 1, 0).getDate();

  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  function navegar(delta: number) {
    setView((v) => {
      const novo = v.mes + delta;
      if (novo < 0) return { ano: v.ano - 1, mes: 11 };
      if (novo > 11) return { ano: v.ano + 1, mes: 0 };
      return { ...v, mes: novo };
    });
  }

  return (
    <div>
      <label htmlFor={id} className="text-foreground block text-sm/6 font-medium">
        {label}
      </label>
      <Popover className="relative mt-2">
        <PopoverButton
          id={id}
          className={cn(
            'bg-background text-foreground outline-foreground/20 focus:outline-indigo-600',
            'flex h-10 w-full items-center justify-between rounded-md px-3 text-left text-sm outline -outline-offset-1 focus:outline-2 focus:-outline-offset-2',
          )}
        >
          <span className={cn(!value && 'text-foreground/40')}>
            {value ? formatData(value) : 'dd/mm/aaaa'}
          </span>
          <CalendarDaysIcon className="text-foreground/40 size-5" />
        </PopoverButton>

        <PopoverPanel
          transition
          className="bg-background outline-foreground/10 absolute z-20 mt-2 w-72 rounded-xl p-3 shadow-lg outline transition data-closed:scale-95 data-closed:opacity-0"
        >
          {({ close }) => (
            <>
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => navegar(-1)}
                  className="text-foreground/60 hover:bg-foreground/5 rounded-md p-1"
                  aria-label="Mês anterior"
                >
                  <ChevronLeftIcon className="size-5" />
                </button>
                <span className="text-foreground text-sm font-semibold">
                  {MESES[view.mes]} {view.ano}
                </span>
                <button
                  type="button"
                  onClick={() => navegar(1)}
                  className="text-foreground/60 hover:bg-foreground/5 rounded-md p-1"
                  aria-label="Próximo mês"
                >
                  <ChevronRightIcon className="size-5" />
                </button>
              </div>

              <div className="text-foreground/40 mt-3 grid grid-cols-7 gap-1 text-center text-xs">
                {DIAS.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1">
                {celulas.map((dia, i) => {
                  if (dia === null) return <span key={i} />;
                  const iso = toISO(view.ano, view.mes, dia);
                  const selecionado = iso === value;
                  const ehHoje =
                    dia === hoje.getDate() &&
                    view.mes === hoje.getMonth() &&
                    view.ano === hoje.getFullYear();
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onChange(iso);
                        close();
                      }}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-md text-sm',
                        selecionado
                          ? 'bg-indigo-600 font-semibold text-white'
                          : 'text-foreground/80 hover:bg-foreground/10',
                        !selecionado && ehHoje && 'text-indigo-500 font-semibold',
                      )}
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </PopoverPanel>
      </Popover>
    </div>
  );
}
