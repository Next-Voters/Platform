"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import headerItems from "@/data/header";
import AuthButtons from "./components/auth-buttons";
import { Menu, X } from "lucide-react";

const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="w-full fixed top-0 left-0 right-0 z-40 pt-[env(safe-area-inset-top)] bg-background/70 backdrop-blur-xl border-b border-gray-200/40">
        <div className="px-4 h-[72px] flex justify-between items-center">
          <a
            href="/"
            className="text-[18px] font-bold text-gray-900 tracking-tight hover:opacity-70 transition-opacity"
          >
            NV
          </a>

          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
          >
            {isOpen ? (
              <X className="w-5 h-5 text-gray-700" />
            ) : (
              <Menu className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>
      </header>

      {/* Spacer to offset fixed header */}
      <div className="h-[72px]" />

      {/* Slide-down drawer overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />
          <nav
            className="fixed top-[72px] left-0 right-0 z-40 bg-background/70 backdrop-blur-xl border-b border-gray-200/40 shadow-lg"
            aria-label="Mobile navigation"
          >
            <ul className="flex flex-col py-2">
              {headerItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className={[
                        "flex items-center justify-between px-5 py-3.5 text-[15px] font-medium transition-colors touch-manipulation min-h-[48px]",
                        isActive
                          ? "text-red-500"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                      ].join(" ")}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      )}
                    </a>
                  </li>
                );
              })}
              <li className="border-t border-gray-200 mt-1 pt-1">
                <div className="px-5 py-3 min-h-[52px] flex items-center">
                  <AuthButtons variant="mobile" />
                </div>
              </li>
            </ul>
          </nav>
        </>
      )}
    </>
  );
};

export default MobileHeader;
