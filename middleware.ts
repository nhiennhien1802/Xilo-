// middleware.ts (đặt ở thư mục gốc dự án, ngang hàng package.json)
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Áp dụng middleware cho mọi route TRỪ:
     * - file tĩnh (_next/static, _next/image)
     * - favicon, ảnh...
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
