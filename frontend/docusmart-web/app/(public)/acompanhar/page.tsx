import { Suspense } from 'react';

import AcompanharClient from '@/components/docusmart/acompanhar-client';

export default function AcompanharPage() {
  return (
    <Suspense fallback={null}>
      <AcompanharClient />
    </Suspense>
  );
}
