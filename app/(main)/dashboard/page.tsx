// app/(main)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { Flame, Trophy, BookOpen, ArrowRight } from "lucide-react";

// Mỗi cấp HSK có 1 tông màu pastel riêng, lặp lại theo chu kỳ 4 màu
const LEVEL_THEMES = [
  { bg: "bg-coral-light", bar: "bg-coral", text: "text-coral-dark" },
  { bg: "bg-mint-light", bar: "bg-mint", text: "text-mint-dark" },
  { bg: "bg-honey-light", bar: "bg-honey", text: "text-honey-dark" },
  { bg: "bg-lavender-light", bar: "bg-lavender", text: "text-lavender-dark" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dashboard = await getDashboardData(user.id);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      {/* Header: thông tin người dùng, có blob trang trí phía sau */}
      <div className="relative overflow-hidden bg-white rounded-4xl border-2 border-lavender-light p-6">
        <div className="blob-decoration w-40 h-40 bg-honey-light -top-10 -right-10" />
        <div className="blob-decoration w-28 h-28 bg-mint-light -bottom-8 -left-8" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-lavender ring-4 ring-lavender-light overflow-hidden flex items-center justify-center text-2xl font-extrabold text-white shrink-0">
            {dashboard.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dashboard.avatarUrl} alt={dashboard.displayName} className="w-full h-full object-cover" />
            ) : (
              dashboard.displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-plum">
              Chào {dashboard.displayName}! 👋
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-sm font-extrabold text-honey-dark bg-honey-light px-3 py-1 rounded-full">
                <Flame className="w-4 h-4 fill-honey-dark" />
                {dashboard.streakCount} ngày streak
              </span>
              <span className="flex items-center gap-1 text-sm font-extrabold text-mint-dark bg-mint-light px-3 py-1 rounded-full">
                <Trophy className="w-4 h-4 fill-mint-dark" />
                {dashboard.xp} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nút ôn tập ngay - lọc theo SRS */}
      <a
        href="/learn/review"
        className="group flex items-center justify-between px-6 py-5 rounded-4xl bg-coral hover:bg-coral-dark text-white shadow-lg shadow-coral-light transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-white/25 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </span>
          <div>
            <p className="font-display font-bold text-lg">Ôn tập ngay hôm nay</p>
            <p className="text-sm text-white/85">
              {dashboard.dueTodayCount > 0
                ? `${dashboard.dueTodayCount} từ đến hạn ôn tập`
                : "Không có từ nào đến hạn — học từ mới nhé!"}
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </a>

      {/* Danh sách cấp độ HSK 1-6 */}
      <div className="space-y-3">
        <h2 className="font-display text-sm font-bold text-plum/60 uppercase tracking-wide px-1">
          Cấp độ HSK
        </h2>
        {dashboard.levelProgress.map((lvl, i) => {
          const theme = LEVEL_THEMES[i % LEVEL_THEMES.length];
          const hasData = lvl.totalWords > 0;
          return (
            <a
              key={lvl.level}
              href={hasData ? `/learn/hsk${lvl.level}` : "#"}
              className={`block p-4 rounded-3xl border-2 transition-all ${
                hasData
                  ? `${theme.bg} border-transparent hover:scale-[1.01] hover:shadow-md cursor-pointer`
                  : "border-dashed border-plum/10 bg-white opacity-60 pointer-events-none"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`font-display font-bold ${hasData ? theme.text : "text-plum/40"}`}>
                  HSK {lvl.level}
                </span>
                <span className={`text-xs font-bold ${hasData ? theme.text : "text-plum/30"}`}>
                  {hasData ? `${lvl.masteredWords}/${lvl.totalWords} từ (${lvl.percent}%)` : "Chưa có dữ liệu"}
                </span>
              </div>
              <div className="h-2.5 bg-white/70 rounded-full overflow-hidden">
                <div
                  className={`h-full ${theme.bar} rounded-full transition-all duration-500`}
                  style={{ width: `${lvl.percent}%` }}
                />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
