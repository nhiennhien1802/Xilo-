-- migration: add_example_sentence_words.sql
alter table public.hsk_words
  add column if not exists example_sentence_words jsonb;

comment on column public.hsk_words.example_sentence_words is
  'Mảng các từ/cụm từ đã tách sẵn của example_sentence, dùng cho bài tập Xếp câu. VD: ["我","喜欢","学习"]';
