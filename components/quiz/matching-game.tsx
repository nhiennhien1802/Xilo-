"use client";

// components/quiz/matching-game.tsx
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Timer, XCircle } from "lucide-react";
import { awardXP } from "@/lib/xp/award-xp";

export interface MatchingPair {
  id: number; // word_id
  hanzi: string;
  meaning: string; // hoặc pinyin, tuỳ bạn truyền vào
}

interface MatchingGameProps {
  pairs: MatchingPair[]; // khuyến nghị 5-8 cặp mỗi lượt để không rối
  userId: string;
  xpReward?: number; // XP thưởng khi hoàn thành, mặc định 15
  onComplete?: (stats: { timeElapsedSec: number; wrongAttempts: number }) => void;
}

interface CardItem {
  key: string; // unique key trong UI, VD: "hanzi-3" | "meaning-3"
  pairId: number;
  label: string;
  side: "hanzi" | "meaning";
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function MatchingGame({
  pairs,
  userId,
  xpReward = 15,
  onComplete,
}: MatchingGameProps) {
  const hanziCards = useMemo(
    () =>
      shuffleArray(
        pairs.map((p) => ({ key: `hanzi-${p.id}`, pairId: p.id, label: p.hanzi, side: "hanzi" as const }))
      ),
    [pairs]
  );
  const meaningCards = useMemo(
    () =>
      shuffleArray(
        pairs.map((p) => ({ key: `meaning-${p.id}`, pairId: p.id, label: p.meaning, side: "meaning" as const }))
      ),
    [pairs]
  );

  const [matchedIds, setMatchedIds] = useState<Set<number>>(new Set());
  const [selectedHanzi, setSelectedHanzi] = useState<CardItem | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<CardItem | null>(null);
  const [shakeIds, setShakeIds] = useState<Set<string>>(new Set());
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const hasAwardedRef = useRef(false);

  // Đếm thời gian
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  const handleSelect = (card: CardItem) => {
    if (matchedIds.has(card.pairId)) return;

    if (card.side === "hanzi") {
      setSelectedHanzi(card);
    } else {
      setSelectedMeaning(card);
    }
  };

  // Kiểm tra khi đã chọn đủ 1 bên hanzi + 1 bên meaning
  useEffect(() => {
    if (!selectedHanzi || !selectedMeaning) return;

    if (selectedHanzi.pairId === selectedMeaning.pairId) {
      // Đúng cặp
      setMatchedIds((prev) => new Set(prev).add(selectedHanzi.pairId));
      setSelectedHanzi(null);
      setSelectedMeaning(null);
    } else {
      // Sai cặp: rung + đỏ 2 thẻ trong 500ms, tăng bộ đếm sai
      setWrongAttempts((prev) => prev + 1);
      const wrongKeys = new Set([selectedHanzi.key, selectedMeaning.key]);
      setShakeIds(wrongKeys);
      const timeout = setTimeout(() => {
        setShakeIds(new Set());
        setSelectedHanzi(null);
        setSelectedMeaning(null);
      }, 500);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHanzi, selectedMeaning]);

  // Hoàn thành khi nối đủ tất cả cặp
  useEffect(() => {
    if (matchedIds.size === pairs.length && pairs.length > 0 && !hasAwardedRef.current) {
      hasAwardedRef.current = true;
      setIsFinished(true);
      const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);

      awardXP({ userId, amount: xpReward, reason: "matching-game" }).catch((err) =>
        console.error("Lỗi cộng XP:", err)
      );

      onComplete?.({ timeElapsedSec: finalTime, wrongAttempts });
    }
  }, [matchedIds, pairs.length, userId, xpReward, wrongAttempts, onComplete]);

  const cardClass = useCallback(
    (card: CardItem) => {
      const isMatched = matchedIds.has(card.pairId);
      const isSelected =
        selectedHanzi?.key === card.key || selectedMeaning?.key === card.key;
      const isShaking = shakeIds.has(card.key);

      if (isMatched) return "opacity-0 pointer-events-none scale-90";
      if (isShaking) return "bg-red-100 border-red-400 text-red-700";
      if (isSelected) return "bg-sky-100 border-sky-400 text-sky-800";
      return "bg-white border-slate-200 hover:bg-slate-50 text-slate-700";
    },
    [matchedIds, selectedHanzi, selectedMeaning, shakeIds]
  );

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
      {/* Thanh trạng thái: thời gian + số lần sai */}
      <div className="flex justify-center gap-6 text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          <Timer className="w-4 h-4" /> {timeElapsed}s
        </span>
        <span className="flex items-center gap-1.5">
          <XCircle className="w-4 h-4" /> {wrongAttempts} lần sai
        </span>
      </div>

      {isFinished ? (
        <div className="text-center py-6 space-y-1">
          <p className="text-lg font-semibold text-emerald-600">Hoàn thành! 🎉</p>
          <p className="text-sm text-slate-500">
            Thời gian: {timeElapsed}s · Sai: {wrongAttempts} lần · +{xpReward} XP
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            {hanziCards.map((card) => (
              <motion.button
                key={card.key}
                animate={shakeIds.has(card.key) ? { x: [0, -6, 6, -6, 6, 0] } : {}}
                transition={{ duration: 0.4 }}
                onClick={() => handleSelect(card)}
                className={`px-4 py-3 rounded-xl border-2 text-2xl font-semibold transition-colors ${cardClass(
                  card
                )}`}
              >
                {card.label}
              </motion.button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {meaningCards.map((card) => (
              <motion.button
                key={card.key}
                animate={shakeIds.has(card.key) ? { x: [0, -6, 6, -6, 6, 0] } : {}}
                transition={{ duration: 0.4 }}
                onClick={() => handleSelect(card)}
                className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${cardClass(
                  card
                )}`}
              >
                {card.label}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
