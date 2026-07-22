/**
 * lib/srs/sm2-algorithm.ts
 *
 * Thuật toán SuperMemo-2 (SM-2) dùng cho tính năng Spaced Repetition (SRS).
 * Tham khảo công thức gốc: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 *
 * Ánh xạ 3 mức đánh giá UI -> quality score chuẩn SM-2 (thang 0-5):
 *   "Hard"  -> 3  (nhớ được nhưng khó khăn, không reset về đầu)
 *   "Good"  -> 4  (nhớ tốt, có chút do dự)
 *   "Easy"  -> 5  (nhớ ngay lập tức, không do dự)
 *
 * Nếu sau này muốn thêm nút "Quên hẳn" (Again), map q = 0-2 sẽ reset repetitions.
 */

export type SRSQuality = "Hard" | "Good" | "Easy";

export interface SRSState {
  interval: number; // số ngày tới lần ôn tiếp theo
  repetition: number; // số lần ôn liên tiếp trả lời đúng (q >= 3)
  easeFactor: number; // hệ số dễ (EF), tối thiểu 1.3
}

export interface SRSResult extends SRSState {
  quality: number; // quality score 0-5 đã dùng để tính
  nextReviewDate: string; // ISO date string (YYYY-MM-DD)
}

const QUALITY_MAP: Record<SRSQuality, number> = {
  Hard: 3,
  Good: 4,
  Easy: 5,
};

const MIN_EASE_FACTOR = 1.3;

/**
 * Tính trạng thái SRS mới dựa trên trạng thái hiện tại + lựa chọn của người dùng.
 *
 * @param current   Trạng thái hiện tại { interval, repetition, easeFactor }
 * @param quality   "Hard" | "Good" | "Easy"
 * @param today     (tuỳ chọn) mốc ngày hiện tại, mặc định = new Date(), truyền vào để test dễ hơn
 */
export function calculateSM2(
  current: SRSState,
  quality: SRSQuality,
  today: Date = new Date()
): SRSResult {
  const q = QUALITY_MAP[quality];

  let { interval, repetition, easeFactor } = current;

  // Bước 1: Cập nhật Ease Factor theo công thức gốc SM-2
  // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  let newEaseFactor =
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEaseFactor < MIN_EASE_FACTOR) newEaseFactor = MIN_EASE_FACTOR;

  // Bước 2: Cập nhật repetition + interval
  let newRepetition: number;
  let newInterval: number;

  if (q < 3) {
    // Trả lời không đạt (nếu sau này có nút "Quên") -> học lại từ đầu
    newRepetition = 0;
    newInterval = 1;
  } else {
    newRepetition = repetition + 1;

    if (newRepetition === 1) {
      newInterval = 1;
    } else if (newRepetition === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  // Bước 3: Tính ngày ôn tập tiếp theo
  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + newInterval);
  const nextReviewDate = nextDate.toISOString().split("T")[0];

  return {
    interval: newInterval,
    repetition: newRepetition,
    easeFactor: Number(newEaseFactor.toFixed(2)),
    quality: q,
    nextReviewDate,
  };
}

/**
 * Trạng thái khởi tạo cho một từ vựng mới chưa từng học.
 */
export function getInitialSRSState(): SRSState {
  return {
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
  };
}

/* ------------------------------------------------------------------ */
/* Ví dụ / test nhanh (có thể xoá khi tích hợp thực tế)                 */
/* ------------------------------------------------------------------ */
// const state0 = getInitialSRSState();
// const r1 = calculateSM2(state0, "Good");        // repetition=1, interval=1
// const r2 = calculateSM2(r1, "Good");             // repetition=2, interval=6
// const r3 = calculateSM2(r2, "Easy");             // repetition=3, interval=interval*EF
