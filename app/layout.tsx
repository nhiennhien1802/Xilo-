import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HSK Học Vui — Học tiếng Trung mỗi ngày",
  description: "Ứng dụng học từ vựng HSK với Flashcard, SRS và trò chơi ôn tập",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
