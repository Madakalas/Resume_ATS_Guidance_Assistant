'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function EditorPage() {
  const router = useRouter();
  const store = useStore();

  useEffect(() => {
    // Get first resume
    const firstResume = store.resumes[0];
    if (firstResume) {
      router.push(`/editor/${firstResume.id}`);
    } else {
      router.push('/my-resumes');
    }
  }, [router, store]);

  return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
}
