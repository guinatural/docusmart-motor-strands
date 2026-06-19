import SidebarWithHeader from '@/components/dashboard/sidebar-with-header';

// Sem autenticação (protótipo): usuário fixo simulando o analista interno.
const MOCK_USER = {
  nome: 'Escola da Nuvem · Grupo 5',
  papel: 'Analista de sinistros',
};

export default function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <SidebarWithHeader user={MOCK_USER}>{children}</SidebarWithHeader>;
}
