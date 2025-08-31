'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function useNavigationLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleEnd = () => setIsLoading(false);

    // Simular loading ao mudar de rota
    handleStart();
    const timeout = setTimeout(handleEnd, 500);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return { isLoading };
} 