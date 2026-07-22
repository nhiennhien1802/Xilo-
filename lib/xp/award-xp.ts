// lib/xp/award-xp.ts
import { createClient } from "@/lib/supabase/client";

interface AwardXPParams {
  userId: string;
  amount: number; // số XP cộng thêm (số dương)
  reason?: string; // VD: "sentence-builder" | "matching-game", để log/debug nếu cần
}

/**
 * Cộng dồn XP cho user vào bảng profiles.
 * Đọc giá trị hiện tại rồi ghi đè +amount (Supabase JS chưa hỗ trợ increment
 * nguyên tử qua .update() nên cần đọc-rồi-ghi; nếu muốn atomic 100% nên tạo
 * Postgres function `increment_xp(user_id, amount)` và gọi qua supabase.rpc()).
 */
export async function awardXP({ userId, amount, reason }: AwardXPParams) {
  const supabase = createClient();

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("xp")
    .eq("id", userId)
    .single();

  if (fetchError) throw fetchError;

  const newXP = (profile?.xp ?? 0) + amount;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ xp: newXP, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (updateError) throw updateError;

  if (reason && process.env.NODE_ENV === "development") {
    console.log(`[XP] +${amount} (${reason}) -> tổng: ${newXP}`);
  }

  return newXP;
}
