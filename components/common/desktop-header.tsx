"use client";

import React from "react";
import { usePathname } from "next/navigation";
import headerItems from "@/data/header";
import AuthButtons from "./components/auth-buttons";

const DesktopHeader: React.FC = () => {
  const pathname = usePathname();

  return (
    <>
      <header className="w-full fixed top-0 left-0 right-0 z-40 bg-background/70 backdrop-blur-xl border-b border-gray-200/40">
        <div className="max-w-[1200px] mx-auto px-6 h-[72px] flex items-center justify-between">
          {/* Left: Logo + Nav pill */}
          <div className="flex items-center gap-5">
            <a
              href="/"
              className="text-[18px] font-bold text-gray-900 tracking-tight shrink-0 hover:opacity-70 transition-opacity"
            >
              NV
            </a>

            <nav aria-label="Main navigation">
              <ul className="flex items-center border border-gray-200/60 rounded-full px-1 py-1 gap-0.5 bg-white/50">
                {headerItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={[
                          "block px-4 py-1.5 text-[14px] font-medium rounded-full transition-colors",
                          isActive
                            ? "text-gray-900 bg-gray-100"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
                        ].join(" ")}
                      >
                        {item.name}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Right: Auth */}
          <div className="flex items-center gap-5 shrink-0">
            <AuthButtons variant="desktop" />
          </div>
        </div>
      </header>
      {/* Spacer to offset fixed header */}
      <div className="h-[72px]" />
    </>
  );
};

export default DesktopHeader;
