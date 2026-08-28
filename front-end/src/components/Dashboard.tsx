import { useState, useEffect } from "react";
import { User } from "../types";
import {
  dashboardApi,
  DashboardStats,
  DelegateCollection,
} from "../api/dashboardApi";
import { getTodayISO } from "../store";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  DollarSign,
  TrendingUp,
  Truck,
} from "lucide-react";

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const today = getTodayISO();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [collections, setCollections] = useState<DelegateCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [s, c] = await Promise.all([
          dashboardApi.getStats(today),
          dashboardApi.getCollections(today),
        ]);
        setStats(s);
        setCollections(c);
      } catch {
        setError("تعذّر تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [today]);

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin w-10 h-10 text-gold-400"
            viewBox="0 0 24 24"
          >
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
          <span className="text-slate-400 text-sm">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-24">
        <p className="text-rose-400">{error}</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "أوردرات اليوم",
      value: stats?.totalToday ?? 0,
      icon: <ClipboardList className="w-6 h-6" />,
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      text: "text-blue-400",
    },
    {
      label: "تم التوصيل",
      value: stats?.delivered ?? 0,
      icon: <CheckCircle2 className="w-6 h-6" />,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
    },
    {
      label: "مرتجعة",
      value: stats?.returned ?? 0,
      icon: <XCircle className="w-6 h-6" />,
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      text: "text-rose-400",
    },
    {
      label: "إجمالي التحصيل",
      value: (stats?.totalCollected ?? 0).toLocaleString("ar-EG"),
      icon: <DollarSign className="w-6 h-6" />,
      bg: "bg-gold-500/10",
      border: "border-gold-500/20",
      text: "text-gold-400",
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">لوحة التحكم</h1>
        <p className="text-slate-400 mt-1">نظرة عامة على أداء اليوم</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className={`${stat.bg} backdrop-blur-sm rounded-2xl border ${stat.border} p-5 transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={stat.text}>{stat.icon}</span>
              <TrendingUp className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-navy-800/50 backdrop-blur-sm rounded-2xl border border-navy-600/30 p-5">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="w-5 h-5 text-amber-400" />
            <h3 className="text-white font-semibold">قيد التوصيل</h3>
          </div>
          <p className="text-3xl font-bold text-amber-400">
            {stats?.inTransit ?? 0}
          </p>
          <p className="text-slate-400 text-sm mt-1">أوردرات في الطريق</p>
        </div>
        <div className="bg-navy-800/50 backdrop-blur-sm rounded-2xl border border-navy-600/30 p-5">
          <div className="flex items-center gap-3 mb-4">
            <ClipboardList className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">بانتظار التعيين</h3>
          </div>
          <p className="text-3xl font-bold text-purple-400">
            {stats?.pending ?? 0}
          </p>
          <p className="text-slate-400 text-sm mt-1">أوردرات لم يتم تعيينها</p>
        </div>
      </div>

      {/* Delegate Collections — admin / supervisor */}
      {(user.role === "admin" || user.role === "supervisor") &&
        collections.length > 0 && (
          <div className="bg-navy-800/50 backdrop-blur-sm rounded-2xl border border-navy-600/30 p-6">
            <div className="flex items-center gap-3 mb-5">
              <DollarSign className="w-5 h-5 text-gold-400" />
              <h3 className="text-white font-semibold text-lg">
                تحصيلات المندوبين اليوم
              </h3>
            </div>
            <div className="space-y-3">
              {collections.map((col) => {
                const pct =
                  col.totalOrders > 0
                    ? (col.delivered / col.totalOrders) * 100
                    : 0;
                return (
                  <div
                    key={col.delegate.id}
                    className="bg-navy-900/50 rounded-xl p-4 border border-navy-600/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/20 flex items-center justify-center border border-gold-500/30">
                          <span className="text-gold-400 font-bold text-sm">
                            {col.delegate.displayName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {col.delegate.displayName}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {col.delegate.zone || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-gold-400 font-bold">
                          {col.totalCollected.toLocaleString("ar-EG")} ج.م
                        </p>
                        <p className="text-slate-500 text-xs">
                          {col.delivered}/{col.totalOrders} تم
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-navy-700/50 rounded-full h-2">
                      <div
                        className="bg-gradient-to-l from-gold-500 to-gold-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Delegate self view */}
      {user.role === "delegate" && (
        <div className="bg-navy-800/50 backdrop-blur-sm rounded-2xl border border-navy-600/30 p-6">
          <div className="flex items-center gap-3 mb-5">
            <DollarSign className="w-5 h-5 text-gold-400" />
            <h3 className="text-white font-semibold text-lg">تحصيلاتي اليوم</h3>
          </div>
          <div className="bg-navy-900/50 rounded-xl p-6 border border-gold-500/20 text-center">
            <p className="text-4xl font-bold text-gold-400 mb-2">
              {(
                collections.find((c) => c.delegate.id === user.id)
                  ?.totalCollected ?? 0
              ).toLocaleString("ar-EG")}{" "}
              ج.م
            </p>
            <p className="text-slate-400">إجمالي التحصيل اليوم</p>
          </div>
        </div>
      )}
    </div>
  );
}
