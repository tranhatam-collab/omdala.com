"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { label: "Homes", href: "/app/homes", icon: "🏠" },
  { label: "Devices", href: "/app/devices", icon: "🔌" },
  { label: "Scenes", href: "/app/scenes", icon: "🎬" },
  { label: "Automations", href: "/app/automations", icon: "⚡" },
  { label: "Activity", href: "/app/activity", icon: "📋" },
  { label: "Settings", href: "/app/settings", icon: "⚙️" },
];

export function AppSidebar({ homeId }: { homeId?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const navItems = homeId
    ? [
        { label: "Dashboard", href: `/app/homes/${homeId}`, icon: "🏠" },
        { label: "Scenes", href: `/app/homes/${homeId}/scenes`, icon: "🎬" },
        {
          label: "Automations",
          href: `/app/homes/${homeId}/automations`,
          icon: "⚡",
        },
        {
          label: "Activity",
          href: `/app/homes/${homeId}/activity`,
          icon: "📋",
        },
        { label: "All Homes", href: "/app/homes", icon: "◀" },
      ]
    : NAV_ITEMS;

  function handleLogout() {
    logout();
    toast.success("Logged out");
    router.push("/login");
  }

  return (
    <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-gray-800">
        <Link href="/app/homes" className="text-lg font-bold text-indigo-400">
          AI Omniverse
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.[0]?.toUpperCase() ??
              user?.email?.[0]?.toUpperCase() ??
              "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">
              {user?.name ?? "User"}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-sm text-gray-500 hover:text-red-400 transition-colors text-left px-1"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
