/**
 * scripts/import-hsk1.mjs
 *
 * Import file data/hsk1_data.json vào bảng public.hsk_words trên Supabase.
 *
 * Cài đặt trước khi chạy:
 *   npm install @supabase/supabase-js
 *
 * Chạy: node scripts/import-hsk1.mjs
 *
 * Yêu cầu biến môi trường (đặt trong .env.local hoặc export trực tiếp):
 *   SUPABASE_URL              -> URL project Supabase
 *   SUPABASE_SERVICE_ROLE_KEY -> Service Role Key (KHÔNG dùng anon key,
 *                                 vì RLS chặn insert từ client thường)
 *
 * ⚠️ Service Role Key có toàn quyền, TUYỆT ĐỐI không commit lên Git hay
 * dùng ở phía client (browser). Script này chỉ chạy 1 lần ở local/CI.
 */

import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "❌ Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong biến môi trường."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // 1. Đọc file JSON dữ liệu mẫu
  const jsonPath = path.join(__dirname, "..", "data", "hsk1_data.json");
  const raw = await readFile(jsonPath, "utf-8");
  const rawWords = JSON.parse(raw);

  console.log(`📖 Đọc được ${rawWords.length} từ từ ${jsonPath}`);

  // 2. Map tên trường trong JSON -> tên cột thực tế trong bảng hsk_words
  //    (JSON dùng "meaning", "example_chinese"... nhưng schema DB dùng
  //    "meaning_vi", "example_sentence"... nên cần chuyển đổi ở đây)
  const rows = rawWords.map((w) => ({
    word: w.word,
    pinyin: w.pinyin,
    meaning_vi: w.meaning,
    word_type: w.word_type,
    radical: w.radical,
    example_sentence: w.example_chinese,
    example_sentence_words: w.example_chinese_words ?? null,
    example_pinyin: w.example_pinyin,
    example_meaning_vi: w.example_vietnamese,
    hsk_level: w.hsk_level,
  }));

  // 3. Kiểm tra trùng lặp (word + hsk_level) đã tồn tại trong DB chưa
  //    để tránh insert lặp khi chạy script nhiều lần
  const { data: existingWords, error: fetchError } = await supabase
    .from("hsk_words")
    .select("word")
    .eq("hsk_level", 1);

  if (fetchError) {
    console.error("❌ Lỗi khi kiểm tra dữ liệu hiện có:", fetchError.message);
    process.exit(1);
  }

  const existingSet = new Set(existingWords.map((r) => r.word));
  const newRows = rows.filter((r) => !existingSet.has(r.word));
  const skippedCount = rows.length - newRows.length;

  if (skippedCount > 0) {
    console.log(`⏭️  Bỏ qua ${skippedCount} từ đã tồn tại (tránh trùng lặp).`);
  }

  if (newRows.length === 0) {
    console.log("✅ Không có từ mới cần import.");
    return;
  }

  // 4. Insert dữ liệu mới
  const { data: inserted, error: insertError } = await supabase
    .from("hsk_words")
    .insert(newRows)
    .select("id, word");

  if (insertError) {
    console.error("❌ Lỗi khi insert dữ liệu:", insertError.message);
    process.exit(1);
  }

  console.log(`✅ Đã import thành công ${inserted.length} từ vựng HSK 1:`);
  inserted.forEach((r) => console.log(`   - [${r.id}] ${r.word}`));
}

main().catch((err) => {
  console.error("❌ Lỗi không xác định:", err);
  process.exit(1);
});
