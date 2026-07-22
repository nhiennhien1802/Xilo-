"use client";

// components/HanziWriter.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import HanziWriterLib from "hanzi-writer";
import { RotateCcw, PenLine, X } from "lucide-react";

interface HanziWriterProps {
  character: string; // Chữ Hán cần vẽ, VD: "你"
  width?: number; // mặc định 200
  height?: number; // mặc định 200
  strokeColor?: string; // màu nét vẽ khi animate, mặc định slate-800
}

type Mode = "idle" | "animating" | "quiz";

export default function HanziWriter({
  character,
  width = 200,
  height = 200,
  strokeColor = "#1e293b",
}: HanziWriterProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null); // instance của thư viện hanzi-writer
  const [mode, setMode] = useState<Mode>("idle");
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Khởi tạo (hoặc khởi tạo lại khi character đổi)
  useEffect(() => {
    if (!targetRef.current) return;

    // Xoá instance cũ nếu có, tránh chồng SVG khi character thay đổi
    targetRef.current.innerHTML = "";
    setIsReady(false);
    setQuizResult(null);
    setMode("idle");

    const writer = HanziWriterLib.create(targetRef.current, character, {
      width,
      height,
      padding: 12,
      strokeColor,
      radicalColor: "#0ea5e9", // làm nổi bật bộ thủ nếu dữ liệu hỗ trợ
      showOutline: true,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 200,
      // Bật dòng dưới nếu tự host dữ liệu qua hanzi-writer-data thay vì CDN:
      // charDataLoader: (char, onLoad) => {
      //   import(`hanzi-writer-data/${char}.json`).then(onLoad);
      // },
      onLoadCharDataSuccess: () => setIsReady(true),
      onLoadCharDataError: () => setIsReady(false),
    });

    writerRef.current = writer;

    return () => {
      writerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, width, height, strokeColor]);

  const handleReplay = useCallback(() => {
    if (!writerRef.current) return;
    setMode("animating");
    writerRef.current.hideCharacter({ duration: 0 });
    writerRef.current.animateCharacter({
      onComplete: () => setMode("idle"),
    });
  }, []);

  const handleStartQuiz = useCallback(() => {
    if (!writerRef.current) return;
    setMode("quiz");
    setQuizResult(null);
    writerRef.current.quiz({
      onCorrectStroke: () => {
        // có thể thêm hiệu ứng nhỏ mỗi nét đúng nếu muốn
      },
      onMistake: () => {
        setQuizResult("wrong");
        setTimeout(() => setQuizResult(null), 600);
      },
      onComplete: () => {
        setQuizResult("correct");
        setMode("idle");
      },
    });
  }, []);

  const handleExitQuiz = useCallback(() => {
    if (!writerRef.current) return;
    writerRef.current.cancelQuiz();
    writerRef.current.hideCharacter({ duration: 0 });
    setMode("idle");
    setQuizResult(null);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={targetRef}
        style={{ width, height }}
        className="border border-slate-200 rounded-xl bg-white relative"
      >
        {!isReady && (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            Đang tải nét vẽ...
          </span>
        )}
      </div>

      {/* Thông báo kết quả quiz */}
      {quizResult && (
        <span
          className={`text-sm font-medium ${
            quizResult === "correct" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {quizResult === "correct" ? "Chính xác! 🎉" : "Sai nét, thử lại nhé"}
        </span>
      )}

      <div className="flex gap-2">
        {mode !== "quiz" ? (
          <>
            <button
              onClick={handleReplay}
              disabled={!isReady || mode === "animating"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Phát lại nét vẽ
            </button>
            <button
              onClick={handleStartQuiz}
              disabled={!isReady}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <PenLine className="w-4 h-4" />
              Tập viết
            </button>
          </>
        ) : (
          <button
            onClick={handleExitQuiz}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            Thoát tập viết
          </button>
        )}
      </div>
    </div>
  );
}
