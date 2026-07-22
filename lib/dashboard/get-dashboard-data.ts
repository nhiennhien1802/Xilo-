// lib/dashboard/get-dashboard-data.ts
import { createClient } from "@/lib/supabase/server";

export interface HSKLevelProgress {
  level: number;
  totalWords: number;
  masteredWords: number;
  percent: number;
}

export interface DashboardData {
  displayName: string;
  avatarUrl: string | null;
  streakCount: number;
  xp: number;
  levelProgress: HSKLevelProgress[];
  dueTodayCount: number;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // 1. Thông tin profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, streak_count, xp")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  // 2. Tổng số từ mỗi cấp HSK (1-6)
  const { data: allWords, error: wordsError } = await supabase
    .from("hsk_words")
    .select("id, hsk_level");

  if (wordsError) throw wordsError;

  // 3. Các từ user đã "mastered", kèm cấp độ tương ứng
  const { data: masteredRows, error: masteredError } = await supabase
    .from("user_progress")
    .select("word_id, status, hsk_words!inner(hsk_level)")
    .eq("user_id", userId)
    .eq("status", "mastered");

  if (masteredError) throw masteredError;

  // 4. Số từ đến hạn ôn tập hôm nay (next_review_date <= hôm nay)
  const { count: dueTodayCount, error: dueError } = await supabase
    .from("flashcards_srs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .lte("next_review_date", today);

  if (dueError) throw dueError;

  // 5. Gộp dữ liệu thành tiến độ theo từng cấp HSK 1-6
  const levelProgress: HSKLevelProgress[] = Array.from({ length: 6 }, (_, i) => {
    const level = i + 1;
    const totalWords = allWords.filter((w) => w.hsk_level === level).length;
    const masteredWords = masteredRows.filter(
      // @ts-expect-error - kiểu trả về join của Supabase JS chưa infer chính xác 100%
      (r) => r.hsk_words?.hsk_level === level
    ).length;
    const percent = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;

    return { level, totalWords, masteredWords, percent };
  });

  return {
    displayName: profile.display_name ?? "Học viên",
    avatarUrl: profile.avatar_url ?? null,
    streakCount: profile.streak_count ?? 0,
    xp: profile.xp ?? 0,
    levelProgress,
    dueTodayCount: dueTodayCount ?? 0,
  };
}
