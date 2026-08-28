import { useState, useEffect } from "react";
import { User } from "../types";
import { dashboardApi, DelegateCollection } from "../api/dashboardApi";
import { ordersApi } from "../api/ordersApi";
import { getTodayISO } from "../store";
import { DollarSign, TrendingUp, Users } from "lucide-react";

interface CollectionsProps {
  user: User;
}

export default function Collections({ user }: CollectionsProps) {
  const today = getTodayISO();
  const [date, setDate] = useState(today);
  const [collections, setCollections] = useState<DelegateCollection[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Summary totals
  const totalCollected = collections.reduce((s, c) => s + c.totalCollected, 0);
  const totalAmount = collections.reduce((s, c) => s + c.totalAmount, 0);
  const remaining = totalAmount - totalCollected;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (user.role === "delegate") {
          const orders = await ordersApi.getAll({ delegateId: user.id, date });
          setMyOrders(orders.map((o: any) => ({ ...o, id: o._id || o.id })));
        } else {
          const data = await dashboardApi.getCollections(date);
          setCollections(data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [date, user.id, user.role]);

  const myDelivered = myOrders.filter(
    (o) => o.status === "delivered" || o.status === "partial",
  );
  const myCollected = myDelivered.reduce((s, o) => s + o.collected, 0);
  const myTotal = myOrders.reduce((s, o) => s + o.amount, 0);
  const myRemaining = myTotal - myCollected;

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-24">
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
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">التحصيلات</h1>
          <p className="text-slate-400 mt-1">متابعة التحصيلات المالية</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-navy-800/50 border border-navy-600/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-500/10 backdrop-blur-sm rounded-2xl border border-emerald-500/20 p-6 text-center">
          <DollarSign className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-emerald-400 mb-1">
            {(user.role === "delegate"
              ? myCollected
              : totalCollected
            ).toLocaleString("ar-EG")}
          </p>
          <p className="text-slate-400 text-sm">المحصل فعليًا (ج.م)</p>
        </div>
        <div className="bg-blue-500/10 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-6 text-center">
          <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-blue-400 mb-1">
            {(user.role === "delegate" ? myTotal : totalAmount).toLocaleString(
              "ar-EG",
            )}
          </p>
          <p className="text-slate-400 text-sm">إجمالي المبلغ (ج.م)</p>
        </div>
        <div className="bg-amber-500/10 backdrop-blur-sm rounded-2xl border border-amber-500/20 p-6 text-center">
          <DollarSign className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-amber-400 mb-1">
            {(user.role === "delegate"
              ? myRemaining
              : remaining
            ).toLocaleString("ar-EG")}
          </p>
          <p className="text-slate-400 text-sm">المتبقي (ج.م)</p>
        </div>
      </div>

      {/* Admin / Supervisor view */}
      {(user.role === "admin" || user.role === "supervisor") && (
        <div className="bg-navy-800/50 backdrop-blur-sm rounded-2xl border border-navy-600/30 p-6">
          <div className="flex items-center gap-3 mb-5">
            <Users className="w-5 h-5 text-gold-400" />
            <h3 className="text-white font-semibold text-lg">
              تحصيلات كل مندوب
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-600/30">
                  <th className="text-right text-slate-400 text-sm py-3 px-4">
                    المندوب
                  </th>
                  <th className="text-right text-slate-400 text-sm py-3 px-4">
                    المنطقة
                  </th>
                  <th className="text-right text-slate-400 text-sm py-3 px-4">
                    أوردرات
                  </th>
                  <th className="text-right text-slate-400 text-sm py-3 px-4">
                    تم التوصيل
                  </th>
                  <th className="text-right text-slate-400 text-sm py-3 px-4">
                    مرتجعة
                  </th>
                  <th className="text-right text-slate-400 text-sm py-3 px-4">
                    المبلغ الكلي
                  </th>
                  <th className="text-right text-slate-400 text-sm py-3 px-4">
                    المحصل
                  </th>
                </tr>
              </thead>
              <tbody>
                {collections.map((col) => (
                  <tr
                    key={col.delegate.id}
                    className="border-b border-navy-600/10 hover:bg-navy-700/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
                          <span className="text-gold-400 font-bold text-xs">
                            {col.delegate.displayName.charAt(0)}
                          </span>
                        </div>
                        <span className="text-white font-medium text-sm">
                          {col.delegate.displayName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-emerald-400 text-sm">
                      {col.delegate.zone || "—"}
                    </td>
                    <td className="py-3 px-4 text-white text-sm">
                      {col.totalOrders}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 text-sm">
                      {col.delivered}
                    </td>
                    <td className="py-3 px-4 text-rose-400 text-sm">
                      {col.returned}
                    </td>
                    <td className="py-3 px-4 text-blue-400 text-sm font-medium">
                      {col.totalAmount.toLocaleString("ar-EG")}
                    </td>
                    <td className="py-3 px-4 text-gold-400 text-sm font-bold">
                      {col.totalCollected.toLocaleString("ar-EG")}
                    </td>
                  </tr>
                ))}
                {collections.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      لا توجد بيانات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delegate self view */}
      {user.role === "delegate" && (
        <div className="bg-navy-800/50 backdrop-blur-sm rounded-2xl border border-navy-600/30 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">
            تفاصيل تحصيلاتي
          </h3>
          <div className="space-y-3">
            {myDelivered.map((o) => (
              <div
                key={o.id}
                className="bg-navy-900/50 rounded-xl p-3 border border-navy-600/20 flex items-center justify-between"
              >
                <div>
                  <span className="text-gold-400 font-bold text-sm">
                    #{o.dailySeq}
                  </span>
                  <span className="text-white text-sm mr-2">
                    {o.clientName}
                  </span>
                </div>
                <span className="text-emerald-400 font-bold">
                  {o.collected.toLocaleString("ar-EG")} ج.م
                </span>
              </div>
            ))}
            {myDelivered.length === 0 && (
              <p className="text-slate-500 text-center py-4">لا توجد تحصيلات</p>
            )}
            <div className="bg-gold-500/10 rounded-xl p-4 border border-gold-500/20 text-center mt-4">
              <p className="text-gold-400 font-bold text-xl">
                {myCollected.toLocaleString("ar-EG")} ج.م
              </p>
              <p className="text-slate-400 text-sm">إجمالي تحصيلاتي</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
