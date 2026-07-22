// app/(main)/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware đã chặn, đây là lớp bảo vệ thứ 2 (defense in depth)
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, streak_count, xp")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        displayName={profile?.display_name ?? user.email?.split("@")[0] ?? "Học viên"}
        avatarUrl={profile?.avatar_url ?? null}
        streakCount={profile?.streak_count ?? 0}
        xp={profile?.xp ?? 0}
      />
      <main>{children}</main>
    </div>
  );
}
