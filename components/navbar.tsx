"use client";

// components/navbar.tsx
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Flame, Star, ChevronDown, LogOut, LayoutDashboard, BookOpen, Repeat } from "lucide-react";

interface NavbarProps {
  displayName: string;
  avatarUrl: string | null;
  streakCount: number;
  xp: number;
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Thư viện HSK", icon: BookOpen }, // TODO: đổi sang /library khi có trang riêng
  { href: "/learn/review", label: "Luyện tập SRS", icon: Repeat },
];

export default function Navbar({ displayName, avatarUrl, streakCount, xp }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh(); // xoá session khỏi Server Components / middleware cache
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <a href="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl leading-none">🀄</span>
          <span className="font-bold text-slate-800 hidden sm:inline">HSK Học Vui</span>
        </a>

        {/* Menu điều hướng nhanh */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </a>
          ))}
        </nav>

        {/* Streak + XP + Account menu */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 text-sm font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
            <Flame className="w-4 h-4" />
            {streakCount}
          </span>
          <span className="flex items-center gap-1 text-sm font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            <Star className="w-4 h-4" />
            {xp}
          </span>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-sm font-bold text-slate-500">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-800 truncate">{displayName}</p>
                </div>

                {/* Menu điều hướng thu gọn cho mobile, chỉ hiện dưới md */}
                <div className="md:hidden border-b border-slate-100">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </a>
                  ))}
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
