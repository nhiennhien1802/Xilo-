"use client";

// app/(main)/learn/hsk1/page.tsx
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Flashcard, { HSKWord } from "@/components/flashcard";
import SentenceBuilder from "@/components/quiz/sentence-builder";
import MatchingGame, { MatchingPair } from "@/components/quiz/matching-game";

/** Các giai đoạn học trong 1 buổi: học thẻ -> xếp câu -> nối từ -> xong */
type Stage = "loading" | "flashcards" | "sentence" | "matching" | "done";

interface WordRow {
  id: number;
  word: string;
  pinyin: string;
  meaning_vi: string;
  radical: string | null;
  word_type: string | null;
  example_sentence: string | null;
  example_sentence_words: string[] | null;
  example_pinyin: string | null;
  example_meaning_vi: string | null;
  audio_url: string | null;
}

export default function HSK1LearnPage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [words, setWords] = useState<WordRow[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Lấy user hiện tại + danh sách từ HSK1 cần học hôm nay
  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Chưa đăng nhập -> điều hướng về trang login
        window.location.href = "/login";
        return;
      }
      setUserId(user.id);

      // Lấy các từ HSK1 đến hạn ôn hôm nay (join với flashcards_srs),
      // ở đây đơn giản hoá: lấy toàn bộ từ HSK1 làm ví dụ minh hoạ.
      // Thực tế nên lọc theo next_review_date <= hôm nay + ưu tiên từ "new".
      const { data, error } = await supabase
        .from("hsk_words")
        .select(
          "id, word, pinyin, meaning_vi, radical, word_type, example_sentence, example_sentence_words, example_pinyin, example_meaning_vi, audio_url"
        )
        .eq("hsk_level", 1)
        .order("id")
        .limit(10); // giới hạn 10 từ/buổi học để không quá tải

      if (error) {
        console.error("Lỗi tải từ vựng:", error);
        return;
      }

      setWords(data as WordRow[]);
      setStage("flashcards");
    }

    load();
  }, []);

  if (stage === "loading" || !userId) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Đang tải bài học...
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        Không có từ vựng nào để học hôm nay. Quay lại sau nhé!
      </div>
    );
  }

  // ---- GIAI ĐOẠN 1: Học Flashcard (bao gồm cả HanziWriter bên trong) ----
  if (stage === "flashcards") {
    const currentWord = words[cardIndex];
    return (
      <div className="py-8 px-4">
        <ProgressBar current={cardIndex + 1} total={words.length} label="Học từ vựng" />
        <Flashcard
          key={currentWord.id} // đổi key để reset flip state khi sang thẻ mới
          word={currentWord as HSKWord}
          userId={userId}
          onNext={() => {
            if (cardIndex + 1 < words.length) {
              setCardIndex((i) => i + 1);
            } else {
              setStage("sentence"); // học hết thẻ -> sang bài tập xếp câu
            }
          }}
        />
      </div>
    );
  }

  // ---- GIAI ĐOẠN 2: Bài tập Xếp câu, lần lượt qua các từ có example_sentence_words ----
  if (stage === "sentence") {
    const wordsWithSentence = words.filter(
      (w) => w.example_sentence_words && w.example_sentence_words.length > 0
    );
    const current = wordsWithSentence[sentenceIndex];

    if (!current) {
      // không có từ nào đủ dữ liệu câu ví dụ -> bỏ qua giai đoạn này
      setStage("matching");
      return null;
    }

    return (
      <div className="py-8 px-4">
        <ProgressBar
          current={sentenceIndex + 1}
          total={wordsWithSentence.length}
          label="Xếp câu"
        />
        <SentenceBuilder
          key={current.id}
          sentenceWords={current.example_sentence_words!}
          pinyin={current.example_pinyin ?? ""}
          meaningVi={current.example_meaning_vi ?? ""}
          audioUrl={current.audio_url ?? undefined}
          userId={userId}
          onComplete={(isCorrect) => {
            if (!isCorrect) return; // chỉ chuyển tiếp khi làm đúng
            if (sentenceIndex + 1 < wordsWithSentence.length) {
              setSentenceIndex((i) => i + 1);
            } else {
              setStage("matching");
            }
          }}
        />
      </div>
    );
  }

  // ---- GIAI ĐOẠN 3: Bài tập Nối từ, dùng toàn bộ 10 từ vừa học ----
  if (stage === "matching") {
    const pairs: MatchingPair[] = words.map((w) => ({
      id: w.id,
      hanzi: w.word,
      meaning: w.meaning_vi,
    }));

    return (
      <div className="py-8 px-4">
        <h2 className="text-center text-lg font-semibold text-slate-700 mb-6">
          Nối Hán tự với nghĩa
        </h2>
        <MatchingGame
          pairs={pairs}
          userId={userId}
          onComplete={() => setStage("done")}
        />
      </div>
    );
  }

  // ---- HOÀN THÀNH BUỔI HỌC ----
  return (
    <div className="text-center py-16 space-y-3">
      <p className="text-2xl font-bold text-emerald-600">🎉 Hoàn thành buổi học!</p>
      <p className="text-slate-500">Bạn đã học {words.length} từ vựng HSK 1 hôm nay.</p>
      <a
        href="/dashboard"
        className="inline-block mt-4 px-5 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700"
      >
        Về Dashboard
      </a>
    </div>
  );
}

function ProgressBar({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  const percent = Math.round((current / total) * 100);
  return (
    <div className="max-w-md mx-auto mb-6">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{label}</span>
        <span>
          {current}/{total}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-sky-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
