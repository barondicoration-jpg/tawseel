import { useState, useEffect, useCallback } from "react";
import { User, Order, OrderStatus } from "../types";
import { ordersApi } from "../api/ordersApi";
import { usersApi } from "../api/usersApi";
import { zonesApi } from "../api/zonesApi";
import { getTodayISO } from "../store";
import {
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Truck,
  ClipboardList,
  Search,
  Navigation,
  MapPin,
} from "lucide-react";

interface OrdersProps {
  user: User;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "بانتظار التعيين",
  assigned: "تم التعيين",
  in_transit: "قيد التوصيل",
  delivered: "تم التوصيل",
  returned: "مرتجعة",
  partial: "تحصيل جزئي",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  assigned: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_transit: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  returned: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  partial: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

// Normalise API response: _id → id
function normaliseOrder(o: any): Order {
  return {
    ...o,
    id: o._id || o.id,
    delegateId: o.delegateId?._id || o.delegateId || null,
    delegate:
      o.delegateId && typeof o.delegateId === "object"
        ? { ...o.delegateId, id: o.delegateId._id }
        : null,
  };
}

export default function Orders({ user }: OrdersProps) {
  const today = getTodayISO();
  const [orders, setOrders] = useState<Order[]>([]);
  const [delegates, setDelegates] = useState<User[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [newOrder, setNewOrder] = useState({
    clientName: "",
    clientPhone: "",
    address: "",
    zone: "",
    locationLink: "",
    amount: 0,
    notes: "",
  });

  const canAdd = user.role === "admin" || user.role === "supervisor";
  const canAssign = user.role === "admin" || user.role === "supervisor";
  const canChangeStatus =
    user.role === "admin" ||
    user.role === "supervisor" ||
    user.role === "delegate";

  const loadOrders = useCallback(async () => {
    try {
      let data: any[];
      if (user.role === "delegate") {
        data = await ordersApi.getMyOrders();
      } else {
        data = await ordersApi.getAll({
          date: today,
          zone: filterZone || undefined,
          status: filterStatus || undefined,
          search: search || undefined,
        });
      }
      setOrders(data.map(normaliseOrder));
    } catch {
      setOrders([]);
    }
  }, [user.role, today, filterZone, filterStatus, search]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [, dels, zonesData] = await Promise.all([
          loadOrders(),
          usersApi.getDelegates(),
          zonesApi.getAll(),
        ]);
        setDelegates(dels.map((d: any) => ({ ...d, id: d._id || d.id })));
        setZones(zonesData.map((z: any) => z.name));
        if (zonesData.length > 0) {
          setNewOrder((n) => ({ ...n, zone: zonesData[0].name }));
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Re-fetch when filters change (non-delegate only)
  useEffect(() => {
    if (user.role !== "delegate") {
      loadOrders();
    }
  }, [filterZone, filterStatus, search, loadOrders]);

  const handleAdd = async () => {
    if (
      !newOrder.clientName ||
      !newOrder.clientPhone ||
      !newOrder.address ||
      !newOrder.zone
    )
      return;
    try {
      const created = await ordersApi.create({
        ...newOrder,
        amount: Number(newOrder.amount),
      });
      setOrders((prev) => [normaliseOrder(created), ...prev]);
      setNewOrder({
        clientName: "",
        clientPhone: "",
        address: "",
        zone: zones[0] || "",
        locationLink: "",
        amount: 0,
        notes: "",
      });
      setShowAdd(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "حدث خطأ أثناء الإضافة");
    }
  };

  const handleAssign = async (orderId: string, delegateId: string) => {
    try {
      const updated = await ordersApi.update(orderId, {
        delegateId: delegateId || null,
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? normaliseOrder(updated) : o)),
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "حدث خطأ");
    }
  };

  const handleStatusChange = async (
    orderId: string,
    status: OrderStatus,
    collected?: number,
  ) => {
    try {
      const payload: any = { status };
      if (collected !== undefined) payload.collected = collected;
      const updated = await ordersApi.update(orderId, payload);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? normaliseOrder(updated) : o)),
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "حدث خطأ");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من مسح هذا الأوردر؟")) return;
    try {
      await ordersApi.delete(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "حدث خطأ أثناء الحذف");
    }
  };

  // Local filter for delegate view (already filtered on server for admin/supervisor)
  const filtered =
    user.role === "delegate"
      ? orders.filter((o) => {
          if (
            search &&
            !o.clientName.includes(search) &&
            !o.clientPhone.includes(search) &&
            !o.address.includes(search)
          )
            return false;
          if (filterZone && o.zone !== filterZone) return false;
          if (filterStatus && o.status !== filterStatus) return false;
          return true;
        })
      : orders;

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
          <h1 className="text-3xl font-bold text-white">الأوردرات</h1>
          <p className="text-slate-400 mt-1">إدارة وتعيين الأوردرات</p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-gradient-to-l from-gold-500 to-gold-600 text-navy-950 font-bold px-5 py-2.5 rounded-xl hover:scale-105 transition-all shadow-lg shadow-gold-500/20"
          >
            <Plus className="w-5 h-5" />
            أوردر جديد
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-navy-800/80 backdrop-blur-xl rounded-2xl border border-gold-500/20 p-6 mb-6 animate-fade-in">
          <h3 className="text-gold-400 font-semibold mb-4">إضافة أوردر جديد</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              placeholder="اسم العميل"
              value={newOrder.clientName}
              onChange={(e) =>
                setNewOrder({ ...newOrder, clientName: e.target.value })
              }
              className="bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-3 text-white placeholder-navy-600 focus:outline-none focus:border-gold-500/50"
            />
            <input
              placeholder="رقم التليفون"
              value={newOrder.clientPhone}
              onChange={(e) =>
                setNewOrder({ ...newOrder, clientPhone: e.target.value })
              }
              className="bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-3 text-white placeholder-navy-600 focus:outline-none focus:border-gold-500/50"
            />
            <input
              placeholder="العنوان"
              value={newOrder.address}
              onChange={(e) =>
                setNewOrder({ ...newOrder, address: e.target.value })
              }
              className="bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-3 text-white placeholder-navy-600 focus:outline-none focus:border-gold-500/50"
            />
            <select
              value={newOrder.zone}
              onChange={(e) =>
                setNewOrder({ ...newOrder, zone: e.target.value })
              }
              className="bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50"
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="المبلغ"
              value={newOrder.amount || ""}
              onChange={(e) =>
                setNewOrder({ ...newOrder, amount: Number(e.target.value) })
              }
              className="bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-3 text-white placeholder-navy-600 focus:outline-none focus:border-gold-500/50"
            />
            <input
              placeholder="ملاحظات"
              value={newOrder.notes}
              onChange={(e) =>
                setNewOrder({ ...newOrder, notes: e.target.value })
              }
              className="bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-3 text-white placeholder-navy-600 focus:outline-none focus:border-gold-500/50"
            />
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
                <Navigation className="w-4 h-4" />
                رابط الموقع (Google Maps / Waze)
              </label>
              <div className="flex gap-2">
                <input
                  placeholder="https://maps.google.com/..."
                  value={newOrder.locationLink}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, locationLink: e.target.value })
                  }
                  dir="ltr"
                  className="flex-1 bg-navy-900/50 border border-emerald-500/20 rounded-xl px-4 py-3 text-white placeholder-navy-600 focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
                />
                {newOrder.locationLink && (
                  <a
                    href={newOrder.locationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl hover:bg-emerald-500/20 transition-all flex items-center gap-1 text-sm shrink-0"
                  >
                    <MapPin className="w-4 h-4" />
                    معاينة
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAdd}
              className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-6 py-2 rounded-xl hover:bg-emerald-500/30 transition-all font-medium"
            >
              حفظ
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-600" />
          <input
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-navy-800/50 border border-navy-600/30 rounded-xl pr-10 pl-4 py-2.5 text-white placeholder-navy-600 text-sm focus:outline-none focus:border-gold-500/50"
          />
        </div>
        <select
          value={filterZone}
          onChange={(e) => setFilterZone(e.target.value)}
          className="bg-navy-800/50 border border-navy-600/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50"
        >
          <option value="">كل المناطق</option>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-navy-800/50 border border-navy-600/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50"
        >
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.map((order) => {
          const delegate =
            delegates.find((d) => d.id === order.delegateId) ||
            order.delegate ||
            null;
          return (
            <div
              key={order.id}
              className="bg-navy-800/50 backdrop-blur-sm rounded-2xl border border-navy-600/30 p-5 hover:border-navy-600/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-gold-400 font-bold text-lg">
                      #{order.dailySeq}
                    </span>
                    <h3 className="text-white font-semibold">
                      {order.clientName}
                    </h3>
                    <span
                      className={`text-xs px-3 py-1 rounded-full border ${STATUS_COLORS[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
                    <span>📱 {order.clientPhone}</span>
                    <span>📍 {order.address}</span>
                    <span>🗺️ {order.zone}</span>
                    <span>💰 {order.amount.toLocaleString("ar-EG")} ج.م</span>
                    {order.collected > 0 && (
                      <span className="text-emerald-400">
                        ✅ تم تحصيل {order.collected.toLocaleString("ar-EG")}{" "}
                        ج.م
                      </span>
                    )}
                    {delegate && (
                      <span className="text-blue-400">
                        🚚 {delegate.displayName}
                      </span>
                    )}
                  </div>
                  {order.notes && (
                    <p className="text-slate-500 text-sm mt-1">
                      📝 {order.notes}
                    </p>
                  )}
                  {order.locationLink && (
                    <div className="mt-3">
                      <a
                        href={order.locationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-xl transition-all text-sm font-medium hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Navigation className="w-4 h-4" />
                        فتح الموقع على الخريطة
                        <MapPin className="w-3.5 h-3.5 animate-pulse" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {canAssign &&
                    (order.status === "pending" ||
                      order.status === "assigned") && (
                      <select
                        value={order.delegateId || ""}
                        onChange={(e) => handleAssign(order.id, e.target.value)}
                        className="bg-navy-900/50 border border-navy-600/30 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-gold-500/50"
                      >
                        <option value="">تعيين مندوب</option>
                        {delegates.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.displayName} {d.zone ? `(${d.zone})` : ""}
                          </option>
                        ))}
                      </select>
                    )}

                  {canChangeStatus && order.status === "assigned" && (
                    <button
                      onClick={() => handleStatusChange(order.id, "in_transit")}
                      className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs hover:bg-amber-500/20 transition-all"
                    >
                      <Truck className="w-4 h-4 inline ml-1" /> بدء
                    </button>
                  )}
                  {canChangeStatus && order.status === "in_transit" && (
                    <>
                      <button
                        onClick={() => {
                          const col = prompt(
                            "المبلغ المحصل:",
                            String(order.amount),
                          );
                          if (col !== null)
                            handleStatusChange(
                              order.id,
                              "delivered",
                              Number(col),
                            );
                        }}
                        className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-500/20 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4 inline ml-1" /> تم
                      </button>
                      <button
                        onClick={() => handleStatusChange(order.id, "returned")}
                        className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs hover:bg-rose-500/20 transition-all"
                      >
                        <XCircle className="w-4 h-4 inline ml-1" /> رجعت
                      </button>
                    </>
                  )}

                  {(user.role === "admin" || user.role === "supervisor") && (
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="bg-rose-500/5 text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد أوردرات</p>
          </div>
        )}
      </div>
    </div>
  );
}
