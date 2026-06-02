'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/wrappers/AuthProvider';

function LoginInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resolvedRedirect = searchParams.get('redirectTo') ?? '/subscription';
  const { user, isLoading: authLoading } = useAuth();
  const [error, setError] = useState('');
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Wait for the session to resolve before acting
    if (authLoading) return;
    // Only fire once — guards against re-running if auth state updates mid-flight
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    // Already signed in — skip OAuth and go straight to destination
    if (user) {
      router.replace(resolvedRedirect);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(resolvedRedirect)}`,
      },
    }).then(({ error }) => {
      if (error) setError(error.message);
    });
  }, [authLoading, user, router, resolvedRedirect]);

  if (error) {
    return (
      <div className="w-full min-h-screen bg-page flex items-center justify-center px-5">
        <div className="w-full max-w-[400px] text-center">
          <p className="text-[14px] text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-[14px] font-semibold text-gray-700 underline hover:text-gray-900"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-page flex items-center justify-center px-5">
      <p className="text-[14px] text-gray-400">Redirecting…</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-page flex items-center justify-center"><p className="text-[14px] text-gray-400">Redirecting…</p></div>}>
      <LoginInner />
    </Suspense>
  );
}
