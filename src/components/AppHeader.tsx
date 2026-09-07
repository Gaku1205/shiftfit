"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード" },
  { href: "/groups", label: "グループ" },
] as const;

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="print:hidden flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
      <Link href="/" className="font-semibold">
        ShiftFit
      </Link>
      <nav className="flex gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "rounded bg-primary px-3 py-1.5 text-sm text-white"
                  : "rounded px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
