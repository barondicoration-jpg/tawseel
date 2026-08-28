import { useState } from "react";
import { authApi } from "../api/authApi";
import { setToken, setAuth } from "../store";
import { User } from "../types";
import { Lock, UserIcon, Eye, EyeOff } from "lucide-react";

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await authApi.login(username.trim(), password);
      setToken(token);
      setAuth(user);
      onLogin(user);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "اسم المستخدم أو كلمة السر غير صحيحة";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-navy-950" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_rgba(240,192,64,0.05)_0%,_transparent_50%)]" />

      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-navy-800 border border-gold-500/30 mb-4 shadow-lg shadow-gold-500/10">
            <Lock className="w-10 h-10 text-gold-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            نظام إدارة المندوبين
          </h1>
          <p className="text-navy-600 text-sm">سجّل دخولك للمتابعة</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-navy-800/80 backdrop-blur-xl rounded-2xl border border-navy-600/50 p-8 shadow-2xl"
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                اسم المستخدم
              </label>
              <div className="relative">
                <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-600" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl pr-11 pl-4 py-3 text-white placeholder-navy-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all"
                  placeholder="أدخل اسم المستخدم"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                كلمة السر
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-600" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl pr-11 pl-11 py-3 text-white placeholder-navy-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all"
                  placeholder="أدخل كلمة السر"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-600 hover:text-gold-400 transition-colors"
                >
                  {showPass ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-400 text-sm text-center animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full mt-6 bg-gradient-to-l from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-navy-950 font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-gold-500/20 hover:shadow-gold-400/30 hover:scale-[1.02]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                جاري التحقق...
              </span>
            ) : (
              "تسجيل الدخول"
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-navy-600 text-xs">
          نظام إدارة المندوبين والتحصيلات v2.0
        </p>
      </div>
    </div>
  );
}
