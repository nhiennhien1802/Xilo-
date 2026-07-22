"use client";

// components/flashcard.tsx
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, RotateCcw } from "lucide-react";
import { updateSRSAfterReview } from "@/lib/srs/update-srs";
import type { SRSQuality } from "@/lib/srs/sm2-algorithm";
import HanziWriter from "@/components/HanziWriter";
import { PenSquare } from "lucide-react";

export interface HSKWord {
  id: number;
  word: string; // Chữ Hán, VD: 你好
  pinyin: string; // VD: nǐ hǎo
  meaning_vi: string; // Nghĩa tiếng Việt
  radical?: string; // Bộ thủ
  word_type?: string; // Từ loại: danh từ, động từ...
  example_sentence?: string;
  example_pinyin?: string;
  example_meaning_vi?: string;
  audio_url?: string;
}

interface FlashcardProps {
  word: HSKWord;
  userId: string;
  onNext?: () => void; // gọi sau khi đánh giá xong, để chuyển sang thẻ tiếp theo
}

export default function Flashcard({ word, userId, onNext }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showHanzi, setShowHanzi] = useState(false);

  const handleFlip = () => setIsFlipped((prev) => !prev);

  const playAudio = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // không cho sự kiện lật thẻ kích hoạt theo
      if (word.audio_url) {
        const audio = new Audio(word.audio_url);
        audio.play().catch(() => {
          // fallback về Web Speech API nếu file audio lỗi/không tồn tại
          speakWithTTS(word.word);
        });
      } else {
        speakWithTTS(word.word);
      }
    },
    [word]
  );

  const speakWithTTS = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const handleGrade = async (quality: SRSQuality, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    try {
      const result = await updateSRSAfterReview({ userId, wordId: word.id, quality });
      setFeedback(`Ôn lại sau ${result.interval} ngày`);
      setTimeout(() => {
        setFeedback(null);
        setIsFlipped(false);
        onNext?.();
      }, 700);
    } catch (err) {
      console.error("Lỗi cập nhật SRS:", err);
      setFeedback("Có lỗi khi lưu, thử lại nhé");
      setTimeout(() => setFeedback(null), 1500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      {/* Vùng thẻ - perspective để tạo hiệu ứng 3D */}
      <div
        className="relative w-full h-80 [perspective:1200px] cursor-pointer select-none"
        onClick={handleFlip}
      >
        <motion.div
          className="relative w-full h-full [transform-style:preserve-3d]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* MẶT TRƯỚC */}
          <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl bg-white shadow-lg border border-slate-200 flex flex-col items-center justify-center gap-3 p-6">
            <button
              onClick={playAudio}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
              aria-label="Phát âm"
            >
              <Volume2 className="w-5 h-5 text-slate-600" />
            </button>

            {word.radical && (
              <span className="text-xs text-slate-400 tracking-wide">
                Bộ thủ: {word.radical}
              </span>
            )}

            <span className="text-7xl font-bold text-slate-800 leading-none">
              {word.word}
            </span>
            <span className="text-xl text-sky-600 font-medium">{word.pinyin}</span>

            <span className="absolute bottom-4 text-xs text-slate-400">
              Chạm để xem nghĩa
            </span>
          </div>

          {/* MẶT SAU */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl bg-slate-800 text-white shadow-lg flex flex-col items-center justify-center gap-4 p-6">
            {word.word_type && (
              <span className="text-xs uppercase tracking-wide text-sky-300 bg-sky-900/40 px-2 py-1 rounded">
                {word.word_type}
              </span>
            )}

            <span className="text-2xl font-semibold text-center">
              {word.meaning_vi}
            </span>

            {word.example_sentence && (
              <div className="text-center border-t border-slate-600 pt-3 mt-1 space-y-1">
                <p className="text-lg">{word.example_sentence}</p>
                {word.example_pinyin && (
                  <p className="text-sky-300 text-sm">{word.example_pinyin}</p>
                )}
                {word.example_meaning_vi && (
                  <p className="text-slate-300 text-sm italic">
                    {word.example_meaning_vi}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHanzi((prev) => !prev);
              }}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors mt-1"
            >
              <PenSquare className="w-3.5 h-3.5" />
              {showHanzi ? "Ẩn nét vẽ" : "Xem nét vẽ chữ Hán"}
            </button>

            {showHanzi && (
              <div onClick={(e) => e.stopPropagation()}>
                <HanziWriter character={word.word} width={160} height={160} strokeColor="#f8fafc" />
              </div>
            )}

            <span className="absolute bottom-4 text-xs text-slate-400 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Chạm để quay lại
            </span>
          </div>
        </motion.div>
      </div>

      {/* Thông báo phản hồi nhanh (VD: "Ôn lại sau 6 ngày") */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-slate-500"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3 nút đánh giá SRS - chỉ hiện khi đã lật sang mặt nghĩa */}
      {isFlipped && (
        <div className="grid grid-cols-3 gap-3 w-full">
          <button
            disabled={isSaving}
            onClick={(e) => handleGrade("Hard", e)}
            className="py-3 rounded-xl bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            Khó
          </button>
          <button
            disabled={isSaving}
            onClick={(e) => handleGrade("Good", e)}
            className="py-3 rounded-xl bg-amber-100 text-amber-700 font-medium hover:bg-amber-200 transition-colors disabled:opacity-50"
          >
            Tốt
          </button>
          <button
            disabled={isSaving}
            onClick={(e) => handleGrade("Easy", e)}
            className="py-3 rounded-xl bg-emerald-100 text-emerald-700 font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50"
          >
            Dễ
          </button>
        </div>
      )}
    </div>
  );
}
