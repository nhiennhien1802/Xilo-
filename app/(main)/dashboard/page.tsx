// app/(main)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { Flame, Trophy, BookOpen } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware đã chặn trường hợp này, nhưng kiểm tra lại cho chắc (defense in depth)
  if (!user) redirect("/login");

  const dashboard = await getDashboardData(user.id);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      {/* Header: thông tin người dùng */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xl font-bold text-slate-500">
          {dashboard.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dashboard.avatarUrl} alt={dashboard.displayName} className="w-full h-full object-cover" />
          ) : (
            dashboard.displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{dashboard.displayName}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              {dashboard.streakCount} ngày streak
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              {dashboard.xp} XP
            </span>
          </div>
        </div>
      </div>

      {/* Nút ôn tập ngay - lọc theo SRS */}
      <a
        href="/learn/review"
        className="flex items-center justify-between px-5 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5" />
          <div>
            <p className="font-semibold">Ôn tập ngay hôm nay</p>
            <p className="text-xs text-slate-300">
              {dashboard.dueTodayCount > 0
                ? `${dashboard.dueTodayCount} từ đến hạn ôn tập`
                : "Không có từ nào đến hạn — học từ mới nhé!"}
            </p>
          </div>
        </div>
        <span className="text-sm font-medium">→</span>
      </a>

      {/* Danh sách cấp độ HSK 1-6 */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Cấp độ HSK
        </h2>
        {dashboard.levelProgress.map((lvl) => (
          <a
            key={lvl.level}
            href={lvl.totalWords > 0 ? `/learn/hsk${lvl.level}` : "#"}
            className={`block p-4 rounded-xl border transition-colors ${
              lvl.totalWords > 0
                ? "border-slate-200 bg-white hover:bg-slate-50"
                : "border-slate-100 bg-slate-50 pointer-events-none opacity-60"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-slate-700">HSK {lvl.level}</span>
              <span className="text-xs text-slate-400">
                {lvl.totalWords > 0
                  ? `${lvl.masteredWords}/${lvl.totalWords} từ (${lvl.percent}%)`
                  : "Chưa có dữ liệu"}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-500"
                style={{ width: `${lvl.percent}%` }}
              />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
