import { useState, useMemo, useEffect, useCallback } from "react";
import { ordersApi } from "../api/ordersApi";
import { zonesApi } from "../api/zonesApi";
import { Order, OrderStatus } from "../types";
import {
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Navigation,
} from "lucide-react";

const MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];
const DAYS = ["سبت", "أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "بانتظار",
  assigned: "معين",
  in_transit: "قيد التوصيل",
  delivered: "تم",
  returned: "رجعت",
  partial: "جزئي",
};

function normalise(o: any): Order {
  return {
    ...o,
    id: o._id || o.id,
    delegateId: o.delegateId?._id || o.delegateId,
  };
}

export default function CalendarView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterZone, setFilterZone] = useState("");
  const [zones, setZones] = useState<string[]>([]);
  const [orderCountByDate, setOrderCountByDate] = useState<
    Record<string, number>
  >({});
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [loadingSelected, setLoadingSelected] = useState(false);

  // Load zones on mount
  useEffect(() => {
    zonesApi
      .getAll()
      .then((zs) => setZones(zs.map((z) => z.name)))
      .catch(() => {});
  }, []);

  // Load order counts for visible month
  useEffect(() => {
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // Fetch all orders in this month (no date filter returns all, so fetch month-by-month)
    // We use a simple approach: fetch all and count by date client-side
    // For large datasets this should be a dedicated endpoint, but for now it works.
    ordersApi
      .getAll()
      .then((orders) => {
        const counts: Record<string, number> = {};
        orders.forEach((o: any) => {
          const d = o.date || (o.createdAt || "").slice(0, 10);
          if (d >= from && d <= to) {
            counts[d] = (counts[d] || 0) + 1;
          }
        });
        setOrderCountByDate(counts);
      })
      .catch(() => {});
  }, [year, month]);

  // Load orders for selected date
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSelected(true);
    ordersApi
      .getAll({ date: selectedDate, zone: filterZone || undefined })
      .then((orders) => setSelectedOrders(orders.map(normalise)))
      .catch(() => setSelectedOrders([]))
      .finally(() => setLoadingSelected(false));
  }, [selectedDate, filterZone]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 1) % 7; // Sat=0
    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);
    return days;
  }, [year, month]);

  const dateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">التقويم</h1>
        <p className="text-slate-400 mt-1">عرض الأوردرات حسب اليوم</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="xl:col-span-2 bg-navy-800/50 backdrop-blur-sm rounded-2xl border border-navy-600/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl bg-navy-700/50 text-slate-400 hover:text-gold-400 hover:bg-navy-700 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <h2 className="text-white font-bold text-xl">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl bg-navy-700/50 text-slate-400 hover:text-gold-400 hover:bg-navy-700 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Year quick nav */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {Array.from({ length: 6 }, (_, i) => year - 2 + i).map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${y === year ? "bg-gold-500/20 text-gold-400 border border-gold-500/30" : "text-slate-500 hover:text-slate-300"}`}
              >
                {y}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-slate-500 text-xs font-medium py-2"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={i} />;
              const ds = dateStr(day);
              const count = orderCountByDate[ds] || 0;
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDate;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(ds)}
                  className={`relative rounded-xl p-2 text-center transition-all hover:scale-105 ${
                    isSelected
                      ? "bg-gold-500/20 border border-gold-500/40 text-gold-400"
                      : isToday
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        : "bg-navy-700/30 border border-transparent text-slate-400 hover:border-navy-600/50"
                  }`}
                >
                  <span className="text-sm font-medium">{day}</span>
                  {count > 0 && (
                    <span
                      className={`absolute -top-1 -left-1 w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${isSelected ? "bg-gold-500 text-navy-950" : "bg-blue-500/80 text-white"}`}
                    >
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day orders */}
        <div className="bg-navy-800/50 backdrop-blur-sm rounded-2xl border border-navy-600/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">
              {selectedDate
                ? new Date(selectedDate + "T00:00").toLocaleDateString(
                    "ar-EG",
                    { weekday: "long", day: "numeric", month: "long" },
                  )
                : "اختر يومًا"}
            </h3>
            {selectedDate && (
              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                className="bg-navy-900/50 border border-navy-600/30 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
              >
                <option value="">كل المناطق</option>
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedDate && (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {loadingSelected ? (
                <div className="flex justify-center py-8">
                  <svg
                    className="animate-spin w-6 h-6 text-gold-400"
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
              ) : (
                <>
                  {selectedOrders.length > 0 && (
                    <div className="bg-navy-900/50 rounded-xl p-3 border border-navy-600/20 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">الإجمالي</span>
                        <span className="text-white font-bold">
                          {selectedOrders.length} أوردر
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-emerald-400">تم التوصيل</span>
                        <span className="text-emerald-400 font-bold">
                          {
                            selectedOrders.filter(
                              (o) => o.status === "delivered",
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-rose-400">مرتجعة</span>
                        <span className="text-rose-400 font-bold">
                          {
                            selectedOrders.filter(
                              (o) => o.status === "returned",
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedOrders.map((o) => (
                    <div
                      key={o.id}
                      className="bg-navy-900/50 rounded-xl p-3 border border-navy-600/20"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gold-400 font-bold text-sm">
                          #{o.dailySeq}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            o.status === "delivered"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : o.status === "returned"
                                ? "bg-rose-500/10 text-rose-400"
                                : "bg-slate-500/10 text-slate-400"
                          }`}
                        >
                          {STATUS_LABELS[o.status]}
                        </span>
                      </div>
                      <p className="text-white text-sm font-medium">
                        {o.clientName}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {o.address} • {o.zone}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {o.amount.toLocaleString("ar-EG")} ج.م
                      </p>
                      {o.locationLink && (
                        <a
                          href={o.locationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 text-xs mt-1 hover:text-emerald-300 transition-colors"
                        >
                          <Navigation className="w-3 h-3" />
                          فتح الموقع
                        </a>
                      )}
                    </div>
                  ))}
                  {selectedOrders.length === 0 && (
                    <p className="text-slate-500 text-center py-8">
                      لا توجد أوردرات في هذا اليوم
                    </p>
                  )}
                </>
              )}
            </div>
          )}
          {!selectedDate && (
            <div className="text-center py-12 text-slate-500">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>اختر يومًا من التقويم</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
