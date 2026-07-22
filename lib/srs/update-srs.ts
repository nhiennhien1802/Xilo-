// lib/srs/update-srs.ts
import { createClient } from "@/lib/supabase/client";
import { calculateSM2, getInitialSRSState, SRSQuality } from "@/lib/srs/sm2-algorithm";

interface UpdateSRSParams {
  userId: string;
  wordId: number;
  quality: SRSQuality;
}

/**
 * Cập nhật (hoặc tạo mới) bản ghi flashcards_srs cho 1 từ vựng sau khi
 * người dùng bấm nút đánh giá "Khó / Tốt / Dễ".
 * Đồng thời cập nhật thống kê đúng/sai trong user_progress.
 */
export async function updateSRSAfterReview({
  userId,
  wordId,
  quality,
}: UpdateSRSParams) {
  const supabase = createClient();

  // 1. Lấy trạng thái SRS hiện tại (nếu chưa có -> dùng trạng thái khởi tạo)
  const { data: existing, error: fetchError } = await supabase
    .from("flashcards_srs")
    .select("interval_days, repetitions, ease_factor")
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const currentState = existing
    ? {
        interval: existing.interval_days,
        repetition: existing.repetitions,
        easeFactor: Number(existing.ease_factor),
      }
    : getInitialSRSState();

  // 2. Tính trạng thái mới bằng thuật toán SM-2
  const result = calculateSM2(currentState, quality);

  // 3. Upsert vào bảng flashcards_srs
  const { error: upsertError } = await supabase.from("flashcards_srs").upsert(
    {
      user_id: userId,
      word_id: wordId,
      interval_days: result.interval,
      repetitions: result.repetition,
      ease_factor: result.easeFactor,
      next_review_date: result.nextReviewDate,
      last_grade: quality.toLowerCase(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,word_id" }
  );

  if (upsertError) throw upsertError;

  // 4. Lấy số liệu đúng/sai hiện tại trong user_progress để tăng dần chính xác
  const { data: progressRow, error: progressFetchError } = await supabase
    .from("user_progress")
    .select("times_correct, times_wrong")
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .maybeSingle();

  if (progressFetchError) throw progressFetchError;

  const isCorrect = quality === "Good" || quality === "Easy";
  const newStatus =
    result.repetition >= 3 ? "mastered" : result.repetition >= 1 ? "learning" : "new";

  const { error: progressError } = await supabase.from("user_progress").upsert(
    {
      user_id: userId,
      word_id: wordId,
      status: newStatus,
      last_reviewed_at: new Date().toISOString(),
      times_correct: (progressRow?.times_correct ?? 0) + (isCorrect ? 1 : 0),
      times_wrong: (progressRow?.times_wrong ?? 0) + (isCorrect ? 0 : 1),
      ...(newStatus === "mastered" ? { mastered_at: new Date().toISOString() } : {}),
    },
    { onConflict: "user_id,word_id" }
  );

  if (progressError) throw progressError;

  return result; // trả về để component hiển thị "Ôn lại sau X ngày" nếu cần
}
