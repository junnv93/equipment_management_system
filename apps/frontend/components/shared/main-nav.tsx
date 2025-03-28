"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface MainNavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
}

export function MainNav() {
  const pathname = usePathname();

  const navItems: MainNavItem[] = [
    {
      title: "대시보드",
      href: "/dashboard",
    },
    {
      title: "장비 목록",
      href: "/dashboard/equipment",
    },
    {
      title: "대여/반출",
      href: "/dashboard/rentals",
    },
    {
      title: "교정 관리",
      href: "/dashboard/calibrations",
    },
    {
      title: "보고서",
      href: "/dashboard/reports",
    },
  ];

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
} 