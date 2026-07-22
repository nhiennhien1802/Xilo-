"use client";

// app/(main)/learn/review/page.tsx
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Flashcard, { HSKWord } from "@/components/flashcard";

export default function ReviewPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [words, setWords] = useState<HSKWord[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "done">("loading");

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }
      setUserId(user.id);

      const today = new Date().toISOString().split("T")[0];

      // Lấy các từ đến hạn ôn tập hôm nay: join flashcards_srs -> hsk_words
      const { data, error } = await supabase
        .from("flashcards_srs")
        .select(
          "word_id, next_review_date, hsk_words!inner(id, word, pinyin, meaning_vi, radical, word_type, example_sentence, example_pinyin, example_meaning_vi, audio_url)"
        )
        .eq("user_id", user.id)
        .lte("next_review_date", today)
        .order("next_review_date", { ascending: true })
        .limit(20);

      if (error) {
        console.error("Lỗi tải từ cần ôn:", error);
        setStatus("empty");
        return;
      }

      const dueWords = (data ?? []).map((row: any) => row.hsk_words as HSKWord);

      if (dueWords.length === 0) {
        setStatus("empty");
        return;
      }

      setWords(dueWords);
      setStatus("ready");
    }

    load();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Đang tải danh sách ôn tập...
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-lg font-semibold text-slate-700">
          🎉 Không có từ nào đến hạn ôn tập hôm nay!
        </p>
        <a
          href="/dashboard"
          className="inline-block mt-2 px-5 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700"
        >
          Về Dashboard
        </a>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-2xl font-bold text-emerald-600">🎉 Ôn tập xong!</p>
        <p className="text-slate-500">Bạn đã ôn lại {words.length} từ hôm nay.</p>
        <a
          href="/dashboard"
          className="inline-block mt-4 px-5 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700"
        >
          Về Dashboard
        </a>
      </div>
    );
  }

  const currentWord = words[cardIndex];

  return (
    <div className="py-8 px-4">
      <div className="max-w-md mx-auto mb-6 text-sm text-slate-500 text-center">
        Đang ôn tập {cardIndex + 1}/{words.length}
      </div>
      <Flashcard
        key={currentWord.id}
        word={currentWord}
        userId={userId!}
        onNext={() => {
          if (cardIndex + 1 < words.length) {
            setCardIndex((i) => i + 1);
          } else {
            setStatus("done");
          }
        }}
      />
    </div>
  );
}
