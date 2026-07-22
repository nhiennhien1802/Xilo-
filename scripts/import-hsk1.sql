-- scripts/import-hsk1.sql
--
-- CÁCH DÙNG:
-- 1. Mở Supabase Dashboard -> SQL Editor -> New query
-- 2. Dán TOÀN BỘ nội dung file này vào
-- 3. Bấm "Run"
--
-- Script dùng jsonb_to_recordset() để "bung" mảng JSON thành các dòng,
-- sau đó insert vào hsk_words. Đã xử lý ON CONFLICT để chạy lại nhiều lần
-- không bị trùng dữ liệu (yêu cầu unique constraint bên dưới).

-- Bước 0 (chỉ chạy 1 lần): đảm bảo không insert trùng chữ Hán cùng cấp độ
-- Lưu ý: PostgreSQL không hỗ trợ "ADD CONSTRAINT IF NOT EXISTS" nên dùng
-- khối DO + exception để chạy an toàn kể cả khi constraint đã tồn tại.
do $$
begin
  alter table public.hsk_words
    add constraint hsk_words_word_level_unique unique (word, hsk_level);
exception
  when duplicate_object then null; -- constraint đã tồn tại, bỏ qua
end $$;

-- Bước 1: Insert dữ liệu
-- Dán nguyên nội dung file data/hsk1_data.json vào vị trí $$...$$ bên dưới
with source as (
  select * from jsonb_to_recordset($$
  [
    {"word":"你好","pinyin":"nǐ hǎo","meaning":"Xin chào","word_type":"Cụm từ chào hỏi","radical":"亻(Nhân đứng) + 女(Nữ) + 子(Tử)","example_chinese":"你好，很高兴认识你。","example_chinese_words":["你好","，","很","高兴","认识","你","。"],"example_pinyin":"Nǐ hǎo, hěn gāoxìng rènshi nǐ.","example_vietnamese":"Xin chào, rất vui được gặp bạn.","hsk_level":1}
  ]
  $$::jsonb) as x(
    word text,
    pinyin text,
    meaning text,
    word_type text,
    radical text,
    example_chinese text,
    example_chinese_words jsonb,
    example_pinyin text,
    example_vietnamese text,
    hsk_level int
  )
)
insert into public.hsk_words (
  word, pinyin, meaning_vi, word_type, radical,
  example_sentence, example_sentence_words, example_pinyin,
  example_meaning_vi, hsk_level
)
select
  word, pinyin, meaning, word_type, radical,
  example_chinese, example_chinese_words, example_pinyin,
  example_vietnamese, hsk_level
from source
on conflict (word, hsk_level) do nothing;

-- Bước 2: Kiểm tra kết quả
select id, word, pinyin, meaning_vi, hsk_level
from public.hsk_words
where hsk_level = 1
order by id;

-- ⚠️ LƯU Ý: ví dụ trên chỉ có 1 từ mẫu để minh hoạ cú pháp.
-- Cách làm nhanh nhất trong thực tế: mở file data/hsk1_data.json,
-- copy toàn bộ mảng 18 từ, dán đè vào phần $$...$$ ở trên rồi Run.
-- Nếu ngại thao tác SQL, dùng script Node.js (scripts/import-hsk1.mjs)
-- sẽ tự động đọc file JSON, không cần copy-paste thủ công.
