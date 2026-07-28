"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clienti", label: "Clienti", icon: Users },
  { href: "/appuntamenti", label: "Appuntamenti", icon: CalendarDays },
  { href: "/promemoria", label: "Promemoria", icon: Bell },
  { href: "/funnel", label: "Funnel loyalty", icon: Sparkles },
  { href: "/impostazioni", label: "Impostazioni", icon: Settings },
];

type StaffSidebarProps = {
  staffName: string;
  groupName: string;
  roleLabel: string;
};

export function StaffSidebar({ staffName, groupName, roleLabel }: StaffSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
              active
                ? "bg-white/10 text-white"
                : "text-sidebar-muted hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight">Fidelio</p>
          <p className="text-xs text-muted">{groupName}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-border p-2"
          aria-label="Apri menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Chiudi menu"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar text-sidebar-foreground shadow-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <p className="font-display text-xl font-semibold">Fidelio</p>
              <button type="button" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            <SidebarFooter
              staffName={staffName}
              roleLabel={roleLabel}
              onLogout={logout}
            />
          </aside>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-display text-2xl font-semibold tracking-tight">Fidelio</p>
          <p className="mt-1 text-xs text-sidebar-muted">{groupName}</p>
        </div>
        {nav}
        <SidebarFooter
          staffName={staffName}
          roleLabel={roleLabel}
          onLogout={logout}
        />
      </aside>
    </>
  );
}

function SidebarFooter({
  staffName,
  roleLabel,
  onLogout,
}: {
  staffName: string;
  roleLabel: string;
  onLogout: () => void;
}) {
  return (
    <div className="border-t border-white/10 p-4">
      <p className="text-sm font-medium text-white">{staffName}</p>
      <p className="text-xs text-sidebar-muted">{roleLabel}</p>
      <button
        type="button"
        onClick={onLogout}
        className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-sidebar-muted hover:bg-white/5 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Esci
      </button>
    </div>
  );
}
