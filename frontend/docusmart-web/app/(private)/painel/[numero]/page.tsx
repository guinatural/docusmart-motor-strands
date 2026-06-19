import { notFound } from 'next/navigation';

import SinistroDetalheView from '@/components/docusmart/sinistro-detalhe';
import { obterSinistro } from '@/lib/docusmart/mock-api';

export default async function SinistroPage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  const detalhe = await obterSinistro(decodeURIComponent(numero));
  if (!detalhe) notFound();
  return <SinistroDetalheView detalhe={detalhe} />;
}
