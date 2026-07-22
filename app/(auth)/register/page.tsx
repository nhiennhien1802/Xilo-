"use client";

// app/(auth)/register/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    // 1. Tạo user trong auth.users
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }, // lưu tạm vào user_metadata
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setIsLoading(false);
      setErrorMsg(
        error.message === "User already registered"
          ? "Email này đã được đăng ký."
          : error.message
      );
      return;
    }

    // 2. Tạo dòng profile tương ứng trong bảng public.profiles
    //    (Cách bền vững hơn: dùng Postgres trigger on auth.users insert để
    //    tự tạo profile — nên cân nhắc thêm khi lên production.)
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        display_name: displayName || email.split("@")[0],
        username: email.split("@")[0],
      });
      if (profileError) {
        console.error("Lỗi tạo profile:", profileError);
      }
    }

    setIsLoading(false);

    // Nếu project bật "Confirm email" -> chưa có session ngay, cần xác nhận qua mail
    if (!data.session) {
      setSuccessMsg("Đăng ký thành công! Kiểm tra email để xác nhận tài khoản nhé.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-800">Tạo tài khoản</h1>
          <p className="text-sm text-slate-500">Bắt đầu học HSK ngay hôm nay</p>
        </div>

        {errorMsg && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            {successMsg}
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Tên hiển thị</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="ban@email.com"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Mật khẩu</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium disabled:opacity-50"
            >
              {isLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <a href="/login" className="text-sky-600 font-medium hover:underline">
            Đăng nhập
          </a>
        </p>
      </div>
    </div>
  );
}
