"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, FileText, Home, Image as ImageIcon, Inbox, Layers, Rocket, Settings, Users,
} from "lucide-react";
import { cx } from "./primitives";

const ICONS = {
  home: Home, kit: FileText, offers: Layers, studio: ImageIcon,
  launch: Rocket, landings: Activity, leads: Inbox, settings: Settings, clients: Users,
} as const;

export type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  /** Motivo por el que está bloqueada; si lo hay, no se puede pulsar. */
  blockedBecause?: string;
  badge?: string;
};

export function Nav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active =
          pathname === item.href ||
          (item.href !== "/app" && pathname.startsWith(item.href + "/"));

        if (item.blockedBecause) {
          return (
            <span
              key={item.href}
              title={item.blockedBecause}
              aria-disabled
              className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-os-faint"
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
              active
                ? "bg-os-sunken font-medium text-os-text"
                : "text-os-muted hover:bg-os-sunken hover:text-os-text",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.badge ? (
              <span className="os-num rounded bg-os-border px-1.5 text-[11px] text-os-muted">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
