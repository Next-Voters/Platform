"use client";

import { useState } from "react";
import type { FC, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import Header from "@/components/common/header";
import Footer from "@/components/common/footer";
import { usePathname } from "next/navigation";

interface RootProps {
  children: ReactNode;
}

// Routes where the footer should not appear
const NO_FOOTER_PATTERNS = ["/chat", "/subscription", "/pricing"];

// Routes where the global header should not appear. Used on dedicated
// ad-traffic landings so paid-traffic visitors land on a clean page with no
// site-nav distractions.
const NO_HEADER_PATTERNS = ["/local/sf", "/local/nyc", "/subscription/sf", "/subscription/nyc"];

const Root: FC<RootProps> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const pathname = usePathname();
  const showFooter =
    pathname !== "/" &&
    !NO_FOOTER_PATTERNS.some((p) => pathname.startsWith(p));
  const showHeader = !NO_HEADER_PATTERNS.some((p) => pathname.startsWith(p));

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <main className="flex min-h-0 flex-1 flex-col">
          {showHeader && <Header />}
          {children}
        </main>
        {showFooter && <Footer />}
      </div>
    </QueryClientProvider>
  );
};

export default Root;
