import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <div className="text-8xl mb-4">⚡</div>
        <h1 className="text-4xl font-bold text-slate-800 mb-2">404</h1>
        <p className="text-slate-500 mb-6">Trang không tồn tại</p>
        <Link href="/stations" className="btn-primary">Về trang chủ →</Link>
      </div>
    </div>
  );
}
