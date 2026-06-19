"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/calendar", label: "달력", icon: "📅" },
  { href: "/log", label: "기록", icon: "✏️" },
  { href: "/partner", label: "파트너", icon: "💞" },
  { href: "/settings", label: "설정", icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-gray-100 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around">
        {items.map((it) => {
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${
                  active ? "text-brand-600" : "text-gray-400"
                }`}
              >
                <span className="text-lg leading-none">{it.icon}</span>
                <span className="font-medium">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
