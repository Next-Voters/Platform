"use client";

import React from "react";
import { usePathname } from "next/navigation";
import headerItems from "@/data/header";
import AuthButtons from "./components/auth-buttons";

const DesktopHeader: React.FC = () => {
  const pathname = usePathname();

  return (
    <header className="w-full sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-gray-200/40">
      <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <a
          href="/"
          className="text-[17px] font-bold text-gray-900 tracking-tight shrink-0 hover:opacity-70 transition-opacity"
        >
          NV
        </a>

        {/* Center nav */}
        <nav aria-label="Main navigation" className="flex-1 flex justify-center">
          <ul className="flex items-center gap-0.5">
            {headerItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={[
                      "relative px-3 py-1.5 text-[13.5px] font-medium rounded-md transition-colors min-h-[36px] flex items-center",
                      isActive
                        ? "text-gray-900"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50",
                    ].join(" ")}
                  >
                    {item.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-brand rounded-full" />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right: auth */}
        <div className="flex items-center gap-3 shrink-0">
          <AuthButtons variant="desktop" />
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;
