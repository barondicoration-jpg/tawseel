import { useState, useEffect } from "react";
import { zonesApi, ZoneDoc } from "../api/zonesApi";
import { usersApi } from "../api/usersApi";
import { ordersApi } from "../api/ordersApi";
import { getTodayISO } from "../store";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { User, Order } from "../types";

export default function Zones() {
  const today = getTodayISO();
  const [zones, setZones] = useState<ZoneDoc[]>([]);
  const [delegates, setDelegates] = useState<User[]>([]);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneDesc, setNewZoneDesc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [zs, dels, orders] = await Promise.all([
          zonesApi.getAll(),
          usersApi.getDelegates(),
          ordersApi.getAll({ date: today }),
        ]);
        setZones(zs);
        setDelegates(dels.map((d: any) => ({ ...d, id: d._id || d.id })));
        setTodayOrders(
          orders.map((o: any) => ({
            ...o,
            id: o._id || o.id,
            delegateId: o.delegateId?._id || o.delegateId,
          })),
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [today]);

  const handleAddZone = async () => {
    if (!newZoneName.trim()) return;
    setSaving(true);
    try {
      const zone = await zonesApi.create(
        newZoneName.trim(),
        newZoneDesc.trim(),
      );
      setZones((prev) => [...prev, zone]);
      setNewZoneName("");
      setNewZoneDesc("");
      setShowAdd(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "حدث خطأ أثناء الإضافة");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المنطقة؟")) return;
    try {
      await zonesApi.delete(id);
      setZones((prev) => prev.filter((z) => z._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "حدث خطأ أثناء الحذف");
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">المناطق</h1>
          <p className="text-slate-400 mt-1">توزيع المندوبين على المناطق</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-gradient-to-l from-emerald-500 to-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          منطقة جديدة
        </button>
      </div>

      {/* Add zone form */}
      {showAdd && (
        <div className="bg-navy-800/80 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-6 mb-6 animate-fade-in">
          <h3 className="text-emerald-400 font-semibold mb-4">
            إضافة منطقة جديدة
          </h3>
          <div className="flex gap-4">
            <input
              placeholder="اسم المنطقة"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              className="flex-1 bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-3 text-white placeholder-navy-600 focus:outline-none focus:border-emerald-500/50"
            />
            <input
              placeholder="وصف (اختياري)"
              value={newZoneDesc}
              onChange={(e) => setNewZoneDesc(e.target.value)}
              className="flex-1 bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-3 text-white placeholder-navy-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddZone}
              disabled={saving}
              className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-6 py-2 rounded-xl hover:bg-emerald-500/30 transition-all font-medium disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="bg-navy-700/50 text-slate-400 border border-navy-600/30 px-6 py-2 rounded-xl hover:bg-navy-700/80 transition-all"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {zones.map((zone) => {
          const zoneDelegates = delegates.filter((d) => d.zone === zone.name);
          const zoneOrders = todayOrders.filter((o) => o.zone === zone.name);
          const zoneDelivered = zoneOrders.filter(
            (o) => o.status === "delivered",
          ).length;
          const zoneReturned = zoneOrders.filter(
            (o) => o.status === "returned",
          ).length;
          const zoneCollected = zoneOrders
            .filter((o) => o.status === "delivered" || o.status === "partial")
            .reduce((s, o) => s + o.collected, 0);

          return (
            <div
              key={zone._id}
              className="bg-navy-800/50 backdrop-blur-sm rounded-2xl border border-navy-600/30 p-6 hover:border-emerald-500/20 transition-all"
            >
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <MapPin className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      {zone.name}
                    </h3>
                    <p className="text-slate-500 text-sm">
                      {zoneDelegates.length} مندوب • {zoneOrders.length} أوردر
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteZone(zone._id)}
                  className="text-rose-400/40 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Delegates in zone */}
              <div className="space-y-2 mb-4">
                {zoneDelegates.map((d) => (
                  <div
                    key={d.id}
                    className="bg-navy-900/50 rounded-xl p-3 border border-navy-600/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
                        <span className="text-gold-400 font-bold text-xs">
                          {d.displayName.charAt(0)}
                        </span>
                      </div>
                      <span className="text-white text-sm">
                        {d.displayName}
                      </span>
                    </div>
                    <span className="text-emerald-400 text-xs">
                      {zoneOrders.filter((o) => o.delegateId === d.id).length}{" "}
                      أوردر
                    </span>
                  </div>
                ))}
                {zoneDelegates.length === 0 && (
                  <p className="text-slate-600 text-sm text-center py-2">
                    لا يوجد مندوبين
                  </p>
                )}
              </div>

              {/* Zone stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-navy-900/50 rounded-xl p-2.5 text-center border border-navy-600/20">
                  <p className="text-emerald-400 font-bold">{zoneDelivered}</p>
                  <p className="text-slate-500 text-[10px]">تم</p>
                </div>
                <div className="bg-navy-900/50 rounded-xl p-2.5 text-center border border-navy-600/20">
                  <p className="text-rose-400 font-bold">{zoneReturned}</p>
                  <p className="text-slate-500 text-[10px]">رجعت</p>
                </div>
                <div className="bg-navy-900/50 rounded-xl p-2.5 text-center border border-navy-600/20">
                  <p className="text-gold-400 font-bold">
                    {zoneCollected.toLocaleString("ar-EG")}
                  </p>
                  <p className="text-slate-500 text-[10px]">تحصيل</p>
                </div>
              </div>
            </div>
          );
        })}
        {zones.length === 0 && (
          <div className="col-span-2 text-center py-12 text-slate-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد مناطق مضافة</p>
          </div>
        )}
      </div>
    </div>
  );
}
