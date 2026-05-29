"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setMessage("");
    setError("");
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("注册成功！请查看邮箱确认链接，然后登录 ✨");
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
      }
    }

    setLoading(false);
  };

  return (
    <div className="mobile-frame flex min-h-dvh flex-col items-center justify-center px-8">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">✨</div>
        <h1 className="text-3xl font-bold text-text-primary">LifeLog</h1>
        <p className="mt-1 text-sm text-text-secondary">记录每一天，更好地了解自己</p>
      </div>

      {/* 表单卡片 */}
      <div className="card-y2k glass w-full">
        <h2 className="mb-5 text-center text-lg font-semibold text-text-primary">
          {isSignUp ? "创建账号" : "欢迎回来"}
        </h2>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-text-secondary">邮箱</label>
          <input
            type="email"
            className="w-full rounded-xl border border-white/50 bg-white/60 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-pink-light focus:outline-none"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-5">
          <label className="mb-1 block text-xs font-medium text-text-secondary">密码</label>
          <input
            type="password"
            className="w-full rounded-xl border border-white/50 bg-white/60 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-pink-light focus:outline-none"
            placeholder="至少6位字符"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="mb-3 text-center text-xs text-red-400">{error}</p>
        )}
        {message && (
          <p className="mb-3 text-center text-xs text-mint-light">{message}</p>
        )}

        <button
          type="button"
          className="w-full rounded-full bg-gradient-to-r from-pink-light to-lavender-light py-3 text-sm font-semibold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          disabled={loading || !email || !password}
          onClick={handleAuth}
        >
          {loading ? "处理中..." : isSignUp ? "注册" : "登录"}
        </button>

        <p className="mt-4 text-center text-xs text-text-secondary">
          {isSignUp ? "已有账号？" : "没有账号？"}
          <button
            type="button"
            className="ml-1 text-pink-deep underline"
            onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
          >
            {isSignUp ? "去登录" : "去注册"}
          </button>
        </p>
      </div>

      {/* 底部装饰 */}
      <p className="mt-8 text-center text-xs text-text-secondary/50">
        你的数据安全加密存储在云端 🌟
      </p>
    </div>
  );
}