"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";

const navItems = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/scan", label: "Scan" },
  { href: "/app/history", label: "History" },
  { href: "/app/settings", label: "Settings" },
];

export const AppNav = () => {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/app" className="font-semibold text-slate-100">
          DNSweeper
        </Link>
        <nav>
          <ul className="flex items-center gap-3 text-sm">
            {navItems.map((item) => {
              const isActive =
                item.href === "/app"
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`rounded-md px-3 py-2 transition ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <SignOutButton />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
