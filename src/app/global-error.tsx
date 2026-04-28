'use client';

import { useEffect } from 'react';
import { routing } from '@/libs/I18nRouting';

export default function GlobalError(props: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(props.error);
  }, [props.error]);

  return (
    <html lang={routing.defaultLocale}>
      <body className="p-6">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-600">
          Please go back and try again.
        </p>
      </body>
    </html>
  );
}
