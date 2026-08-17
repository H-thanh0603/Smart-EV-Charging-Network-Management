"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BoltMark } from "@/components/ui/Icon";

function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/auth/verify/confirm?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        setStatus(d.success ? "ok" : "error");
        setMsg(d.message || d.error || "");
      });
  }, [token]);

  async function resend() {
    if (!email) return;
    setResending(true);
    const res = await fetch("/api/auth/verify/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const d = await res.json();
    setResending(false);
    if (d.demoVerifyUrl) {
      const t = d.demoVerifyUrl.split("token=")[1] || "";
      if (t) router.push(`/verify-email?token=${encodeURIComponent(t)}`);
    } else {
      setMsg(d.message || d.error || "");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md text-center">
        <div className="inline-flex w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl items-center justify-center text-white shadow-lg mb-4">
          <BoltMark className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold">Xác minh email</h1>

        {status === "ok" && (
          <>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{msg}</p>
            <Link href="/login" className="btn-primary inline-block mt-6">Đăng nhập ngay</Link>
          </>
        )}

        {status === "error" && (
          <>
            <p className="mt-2 text-sm text-red-600">{msg}</p>
            {email && (
              <button onClick={resend} disabled={resending} className="btn-primary w-full mt-6">
                {resending ? "Đang gửi..." : "Gửi lại link xác minh"}
              </button>
            )}
            <Link href="/login" className="block mt-4 text-sm text-emerald-600 hover:underline">Quay lại đăng nhập</Link>
          </>
        )}

        {status === "idle" && !token && (
          <>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Chúng tôi đã gửi link xác minh tới email {email ? <b>{email}</b> : "của bạn"}. Kiểm tra hộp thư (và thư rác).
            </p>
            <button onClick={resend} disabled={resending || !email} className="btn-primary w-full mt-6">
              {resending ? "Đang gửi..." : "Gửi lại link xác minh"}
            </button>
            <Link href="/login" className="block mt-4 text-sm text-emerald-600 hover:underline">Quay lại đăng nhập</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">...</div>}>
      <VerifyContent />
    </Suspense>
  );
}