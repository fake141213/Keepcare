
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type TopbarProps = {
  role: "USER" | "ADMIN";
};

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Items", href: "/items" },
  { label: "Categories", href: "/categories" },
];

export default function Topbar({ role }: TopbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = role === "ADMIN";

  const allNavItems = [
    ...navItems,
    ...(isAdmin ? [{ label: "Admin", href: "/admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="shrink-0 text-xl font-bold tracking-tight text-blue-700"
        >
          KeepCare
        </Link>

        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {allNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            My Account
            <span className="ml-2" aria-hidden="true">
              ▾
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
            >
              {isAdmin && (
                <Link
                  href="/admin"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                >
                  Admin Dashboard
                </Link>
              )}

              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100"
              >
                Profile
              </Link>

              <button
                type="button"
                role="menuitem"
                onClick={() => signOut({ redirectTo: "/" })}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
