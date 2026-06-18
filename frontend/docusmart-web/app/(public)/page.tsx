import {
  BoltIcon,
  DocumentMagnifyingGlassIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

import UploadForm from '@/components/docusmart/upload-form';

const destaques = [
  {
    icon: BoltIcon,
    titulo: 'Triagem automática',
    texto: 'Classificação e extração dos documentos em minutos, não horas.',
  },
  {
    icon: DocumentMagnifyingGlassIcon,
    titulo: 'Acompanhe pelo protocolo',
    texto: 'Você recebe um número de sinistro e acompanha o andamento online.',
  },
  {
    icon: ShieldCheckIcon,
    titulo: 'Auditoria completa',
    texto: 'Cada etapa do processamento fica registrada de ponta a ponta.',
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
        {/* coluna de apresentação */}
        <div className="flex flex-col justify-center">
          <span className="text-indigo-500 text-sm font-semibold tracking-wide uppercase">
            DocuSmart Seguros
          </span>
          <h1 className="text-foreground mt-3 text-3xl font-semibold tracking-tight text-pretty sm:text-4xl">
            Abra seu sinistro enviando os documentos
          </h1>
          <p className="text-foreground/60 mt-4 text-lg">
            Envie o pacote do seu sinistro de seguro auto. Nosso processamento
            inteligente classifica, extrai os dados e abre seu protocolo
            automaticamente.
          </p>

          <ul className="mt-8 space-y-4">
            {destaques.map((d) => (
              <li key={d.titulo} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10">
                  <d.icon className="size-5 text-indigo-500" />
                </span>
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    {d.titulo}
                  </p>
                  <p className="text-foreground/60 text-sm">{d.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* coluna do formulário */}
        <div>
          <UploadForm />
        </div>
      </div>
    </div>
  );
}
