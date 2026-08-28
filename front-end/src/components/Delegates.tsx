import { useState, useEffect } from "react";
import { User } from "../types";
import { delegatesApi, DelegateProgressEntry } from "../api/delegatesApi";
import { zonesApi } from "../api/zonesApi";
import { usersApi } from "../api/usersApi";
import { MapPin, Truck, Clock } from "lucide-react";

interface DelegatesProps {
  user: User;
}

export default function Delegates({ user }: DelegatesProps) {
  const [progress, setProgress] = useState<DelegateProgressEntry[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [prog, zs] = await Promise.all([
          delegatesApi.getProgress(),
          zonesApi.getAll(),
        ]);
        setProgress(prog);
        setZones(zs.map((z) => z.name));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUpdateLocation = async (delegateId: string) => {
    const loc = prompt("الموقع الحالي:");
    if (!loc) return;
    try {
      await delegatesApi.updateDelegateLocation(delegateId, loc);
      setProgress((prev) =>
        prev.map((p) =>
          p.delegate.id === delegateId
            ? {
                ...p,
                currentLocation: loc,
                lastUpdate: new Date().toISOString(),
              }
            : p,
        ),
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "حدث خطأ");
    }
  };

  const handleUpdateZone = async (delegateId: string, zone: string) => {
    try {
      await usersApi.update(delegateId, { zone });
      setProgress((prev) =>
        prev.map((p) =>
          p.delegate.id === delegateId
            ? { ...p, delegate: { ...p.delegate, zone } }
            : p,
        ),
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "حدث خطأ");
    }
  };

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">المندوبين</h1>
        <p className="text-slate-400 mt-1">متابعة حالة المندوبين وتقدمهم</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {progress.map((entry) => {
          const { delegate: d, stats, currentLocation, lastUpdate } = entry;
          const pct =
            stats.totalOrders > 0
              ? (stats.delivered / stats.totalOrders) * 100
              : 0;

          return (
            <div
              key={d.id}
              className="bg-navy-800/50 backdrop-blur-sm rounded-2xl border border-navy-600/30 p-6 hover:border-gold-500/20 transition-all"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-600/20 flex items-center justify-center border border-gold-500/30 shadow-lg shadow-gold-500/5">
                  <span className="text-gold-400 font-bold text-xl">
                    {d.displayName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">
                    {d.displayName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <select
                      value={d.zone || ""}
                      onChange={(e) => handleUpdateZone(d.id, e.target.value)}
                      className="bg-transparent text-emerald-400 text-sm border-none focus:outline-none cursor-pointer"
                    >
                      <option value="">بدون منطقة</option>
                      {zones.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-gold-400 font-bold text-lg">
                    {stats.collected.toLocaleString("ar-EG")}
                  </p>
                  <p className="text-slate-500 text-xs">ج.م محصل</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">التقدم</span>
                  <span className="text-white font-medium">
                    {stats.delivered}/{stats.totalOrders} ({Math.round(pct)}%)
                  </span>
                </div>
                <div className="w-full bg-navy-700/50 rounded-full h-3">
                  <div
                    className="bg-gradient-to-l from-emerald-500 to-emerald-400 h-3 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-navy-900/50 rounded-xl p-2.5 text-center border border-navy-600/20">
                  <p className="text-blue-400 font-bold text-lg">
                    {stats.pending}
                  </p>
                  <p className="text-slate-500 text-[10px]">معين</p>
                </div>
                <div className="bg-navy-900/50 rounded-xl p-2.5 text-center border border-navy-600/20">
                  <p className="text-amber-400 font-bold text-lg">
                    {stats.inTransit}
                  </p>
                  <p className="text-slate-500 text-[10px]">في الطريق</p>
                </div>
                <div className="bg-navy-900/50 rounded-xl p-2.5 text-center border border-navy-600/20">
                  <p className="text-emerald-400 font-bold text-lg">
                    {stats.delivered}
                  </p>
                  <p className="text-slate-500 text-[10px]">تم</p>
                </div>
                <div className="bg-navy-900/50 rounded-xl p-2.5 text-center border border-navy-600/20">
                  <p className="text-rose-400 font-bold text-lg">
                    {stats.returned}
                  </p>
                  <p className="text-slate-500 text-[10px]">رجعت</p>
                </div>
              </div>

              {/* Current location */}
              <div className="flex items-center justify-between bg-navy-900/50 rounded-xl p-3 border border-navy-600/20">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400 text-sm">
                    {currentLocation || "لم يحدد موقع"}
                  </span>
                </div>
                <button
                  onClick={() => handleUpdateLocation(d.id)}
                  className="text-gold-400 text-xs hover:text-gold-300 transition-colors"
                >
                  تحديث
                </button>
              </div>
              {lastUpdate && (
                <p className="text-slate-600 text-xs mt-2 text-left flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  آخر تحديث: {new Date(lastUpdate).toLocaleTimeString("ar-EG")}
                </p>
              )}
            </div>
          );
        })}
        {progress.length === 0 && (
          <div className="col-span-2 text-center py-12 text-slate-500">
            <p>لا يوجد مندوبين مسجلين</p>
          </div>
        )}
      </div>
    </div>
  );
}
