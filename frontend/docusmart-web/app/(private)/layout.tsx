import AuthGuard from '@/components/docusmart/auth-guard';
import SidebarWithHeader from '@/components/dashboard/sidebar-with-header';

export default function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <SidebarWithHeader>{children}</SidebarWithHeader>
    </AuthGuard>
  );
}
