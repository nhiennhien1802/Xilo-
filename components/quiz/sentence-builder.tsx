"use client";

// components/quiz/sentence-builder.tsx
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Volume2, CheckCircle2, XCircle } from "lucide-react";
import { awardXP } from "@/lib/xp/award-xp";

interface SentenceBuilderProps {
  /** Câu tiếng Trung đã được TÁCH SẴN thành từng từ/cụm từ, đúng thứ tự.
   *  VD: ["我", "喜欢", "学习", "中文"]
   *  Lưu ý: tiếng Trung không có khoảng trắng tự nhiên nên cần tách từ sẵn
   *  từ nguồn dữ liệu (DB) thay vì split(" ") trên câu gốc. */
  sentenceWords: string[];
  pinyin: string;
  meaningVi: string;
  audioUrl?: string;
  userId: string;
  xpReward?: number; // mặc định 10
  onComplete?: (isCorrect: boolean) => void;
}

// Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function SentenceBuilder({
  sentenceWords,
  pinyin,
  meaningVi,
  audioUrl,
  userId,
  xpReward = 10,
  onComplete,
}: SentenceBuilderProps) {
  // Mỗi mảnh ghép có id riêng để xử lý trường hợp câu có từ trùng nhau
  const tiles = useMemo(
    () =>
      shuffleArray(
        sentenceWords.map((w, idx) => ({ id: `${idx}-${w}`, word: w, originalIndex: idx }))
      ),
    [sentenceWords]
  );

  const [availableTiles, setAvailableTiles] = useState(tiles);
  const [selectedTiles, setSelectedTiles] = useState<typeof tiles>([]);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const selectTile = (tile: (typeof tiles)[number]) => {
    if (result === "correct") return; // đã đúng thì khoá lại
    setSelectedTiles((prev) => [...prev, tile]);
    setAvailableTiles((prev) => prev.filter((t) => t.id !== tile.id));
    setResult(null);
  };

  const removeTile = (tile: (typeof tiles)[number]) => {
    if (result === "correct") return;
    setSelectedTiles((prev) => prev.filter((t) => t.id !== tile.id));
    setAvailableTiles((prev) => [...prev, tile]);
    setResult(null);
  };

  const playFullSentenceAudio = useCallback(() => {
    if (audioUrl) {
      new Audio(audioUrl).play().catch(() => fallbackTTS());
    } else {
      fallbackTTS();
    }
  }, [audioUrl, sentenceWords]);

  const fallbackTTS = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(sentenceWords.join(""));
    utterance.lang = "zh-CN";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const handleCheck = async () => {
    const isCorrect = selectedTiles.every(
      (tile, idx) => tile.originalIndex === idx
    ) && selectedTiles.length === sentenceWords.length;

    setResult(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      playFullSentenceAudio();
      setIsChecking(true);
      try {
        await awardXP({ userId, amount: xpReward, reason: "sentence-builder" });
      } catch (err) {
        console.error("Lỗi cộng XP:", err);
      } finally {
        setIsChecking(false);
      }
      onComplete?.(true);
    } else {
      onComplete?.(false);
      // tự xoá trạng thái "sai" sau 1s để người dùng thử lại, không reset lựa chọn
      setTimeout(() => setResult(null), 1000);
    }
  };

  const handleReset = () => {
    setAvailableTiles(tiles);
    setSelectedTiles([]);
    setResult(null);
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-5">
      <div className="text-center space-y-1">
        <p className="text-sm text-slate-500">Sắp xếp thành câu đúng:</p>
        <p className="text-slate-700 font-medium">{meaningVi}</p>
      </div>

      {/* Khu vực câu đang ghép */}
      <div
        className={`min-h-[64px] flex flex-wrap gap-2 p-3 rounded-xl border-2 transition-colors ${
          result === "correct"
            ? "border-emerald-400 bg-emerald-50"
            : result === "wrong"
            ? "border-red-400 bg-red-50"
            : "border-dashed border-slate-300 bg-slate-50"
        }`}
      >
        {selectedTiles.length === 0 && (
          <span className="text-sm text-slate-400 italic">
            Bấm chọn từ bên dưới theo đúng thứ tự...
          </span>
        )}
        {selectedTiles.map((tile) => (
          <motion.button
            key={tile.id}
            layout
            onClick={() => removeTile(tile)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-300 shadow-sm text-lg font-medium hover:bg-slate-100"
          >
            {tile.word}
          </motion.button>
        ))}
      </div>

      {/* Kho từ để chọn */}
      <div className="flex flex-wrap gap-2 justify-center">
        {availableTiles.map((tile) => (
          <motion.button
            key={tile.id}
            layout
            onClick={() => selectTile(tile)}
            className="px-3 py-2 rounded-lg bg-sky-50 border border-sky-200 text-lg font-medium text-sky-800 hover:bg-sky-100"
          >
            {tile.word}
          </motion.button>
        ))}
      </div>

      {/* Kết quả */}
      {result && (
        <div
          className={`flex items-center justify-center gap-2 text-sm font-medium ${
            result === "correct" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {result === "correct" ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Chính xác! +{xpReward} XP
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" /> Chưa đúng, thử lại nhé
            </>
          )}
        </div>
      )}

      {result === "correct" && (
        <p className="text-center text-xs text-slate-400">{pinyin}</p>
      )}

      {/* Nút hành động */}
      <div className="flex justify-center gap-3">
        <button
          onClick={handleReset}
          disabled={result === "correct"}
          className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium disabled:opacity-40"
        >
          Làm lại
        </button>
        <button
          onClick={handleCheck}
          disabled={
            selectedTiles.length !== sentenceWords.length ||
            result === "correct" ||
            isChecking
          }
          className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium disabled:opacity-40"
        >
          Kiểm tra
        </button>
      </div>
    </div>
  );
}
