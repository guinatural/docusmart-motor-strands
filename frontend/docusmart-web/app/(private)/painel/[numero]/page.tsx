import SinistroDetalhe from '@/components/docusmart/sinistro-detalhe';

export default async function SinistroPage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  return <SinistroDetalhe id={decodeURIComponent(numero)} />;
}
