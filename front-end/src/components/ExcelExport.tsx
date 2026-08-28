import { useState } from "react";
import { ordersApi } from "../api/ordersApi";
import { usersApi } from "../api/usersApi";
import { getTodayISO } from "../store";
import { Order, User } from "../types";
import { Download, FileSpreadsheet } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار التعيين",
  assigned: "تم التعيين",
  in_transit: "قيد التوصيل",
  delivered: "تم التوصيل",
  returned: "مرتجعة",
  partial: "تحصيل جزئي",
};

export default function ExcelExport() {
  const today = getTodayISO();
  const [date, setDate] = useState(today);
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<{
    orders: Order[];
    delegates: User[];
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const loadPreview = async (d: string) => {
    setLoadingPreview(true);
    try {
      const [orders, delegates] = await Promise.all([
        ordersApi.getAll({ date: d }),
        usersApi.getDelegates(),
      ]);
      setPreview({
        orders: orders.map((o: any) => ({
          ...o,
          id: o._id || o.id,
          delegateId: o.delegateId?._id || o.delegateId,
        })),
        delegates: delegates.map((u: any) => ({ ...u, id: u._id || u.id })),
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDateChange = (d: string) => {
    setDate(d);
    setPreview(null);
  };

  const handlePreview = () => loadPreview(date);

  const handleExport = async () => {
    setExporting(true);
    try {
      const [orders, delegates] = preview
        ? [preview.orders, preview.delegates]
        : await Promise.all([
            ordersApi
              .getAll({ date })
              .then((os) =>
                os.map((o: any) => ({
                  ...o,
                  id: o._id || o.id,
                  delegateId: o.delegateId?._id || o.delegateId,
                })),
              ),
            usersApi
              .getDelegates()
              .then((us) => us.map((u: any) => ({ ...u, id: u._id || u.id }))),
          ]);

      const XLSX = await import("xlsx");
      const wsData = [
        [
          "رقم",
          "اسم العميل",
          "رقم التليفون",
          "العنوان",
          "المنطقة",
          "رابط الموقع",
          "المبلغ",
          "المحصل",
          "الحالة",
          "المندوب",
          "ملاحظات",
          "وقت الإنشاء",
        ],
        ...orders.map((o: Order, i: number) => [
          i + 1,
          o.clientName,
          o.clientPhone,
          o.address,
          o.zone,
          o.locationLink || "",
          o.amount,
          o.collected,
          STATUS_LABELS[o.status] || o.status,
          delegates.find((d: User) => d.id === o.delegateId)?.displayName || "",
          o.notes,
          new Date(o.createdAt).toLocaleString("ar-EG"),
        ]),
      ];

      wsData.push([]);
      wsData.push(["ملخص اليوم"]);
      wsData.push(["إجمالي الأوردرات", orders.length]);
      wsData.push([
        "تم التوصيل",
        orders.filter((o: Order) => o.status === "delivered").length,
      ]);
      wsData.push([
        "مرتجعة",
        orders.filter((o: Order) => o.status === "returned").length,
      ]);
      wsData.push([
        "إجمالي المبلغ",
        orders.reduce((s: number, o: Order) => s + o.amount, 0),
      ]);
      wsData.push([
        "إجمالي المحصل",
        orders
          .filter(
            (o: Order) => o.status === "delivered" || o.status === "partial",
          )
          .reduce((s: number, o: Order) => s + o.collected, 0),
      ]);

      wsData.push([]);
      wsData.push(["تحصيلات المندوبين"]);
      wsData.push([
        "المندوب",
        "المنطقة",
        "عدد الأوردرات",
        "تم التوصيل",
        "مرتجعة",
        "المحصل",
      ]);
      delegates.forEach((d: User) => {
        const dOrders = orders.filter((o: Order) => o.delegateId === d.id);
        const dDelivered = dOrders.filter(
          (o: Order) => o.status === "delivered" || o.status === "partial",
        );
        const dReturned = dOrders.filter((o: Order) => o.status === "returned");
        const dCollected = dDelivered.reduce(
          (s: number, o: Order) => s + o.collected,
          0,
        );
        wsData.push([
          d.displayName,
          d.zone || "",
          dOrders.length,
          dDelivered.length,
          dReturned.length,
          dCollected,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 40 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "الأوردرات");
      XLSX.writeFile(wb, `أوردرات_${date}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء التصدير");
    } finally {
      setExporting(false);
    }
  };

  const orders = preview?.orders || [];
  const delegates = preview?.delegates || [];
  const delivered = orders.filter((o) => o.status === "delivered");
  const returned = orders.filter((o) => o.status === "returned");

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">تصدير إكسل</h1>
          <p className="text-slate-400 mt-1">
            تصدير بيانات الأوردرات في ملف إكسل
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-navy-800/50 border border-navy-600/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/50"
          />
          <button
            onClick={handlePreview}
            disabled={loadingPreview}
            className="bg-navy-700/80 border border-navy-600/30 text-slate-300 px-4 py-2.5 rounded-xl text-sm hover:bg-navy-700 transition-all disabled:opacity-50"
          >
            {loadingPreview ? "جاري التحميل..." : "معاينة"}
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="bg-navy-800/50 backdrop-blur-sm rounded-2xl border border-navy-600/30 p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-semibold">
              معاينة البيانات - {date}
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-navy-900/50 rounded-xl p-4 border border-navy-600/20 text-center">
              <p className="text-2xl font-bold text-white">{orders.length}</p>
              <p className="text-slate-500 text-xs">إجمالي</p>
            </div>
            <div className="bg-navy-900/50 rounded-xl p-4 border border-emerald-500/20 text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {delivered.length}
              </p>
              <p className="text-slate-500 text-xs">تم التوصيل</p>
            </div>
            <div className="bg-navy-900/50 rounded-xl p-4 border border-rose-500/20 text-center">
              <p className="text-2xl font-bold text-rose-400">
                {returned.length}
              </p>
              <p className="text-slate-500 text-xs">مرتجعة</p>
            </div>
            <div className="bg-navy-900/50 rounded-xl p-4 border border-gold-500/20 text-center">
              <p className="text-2xl font-bold text-gold-400">
                {delivered
                  .reduce((s, o) => s + o.collected, 0)
                  .toLocaleString("ar-EG")}
              </p>
              <p className="text-slate-500 text-xs">المحصل (ج.م)</p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[40vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="bg-navy-800 border-b border-navy-600/30">
                  <th className="text-right text-slate-400 py-2 px-3">#</th>
                  <th className="text-right text-slate-400 py-2 px-3">
                    العميل
                  </th>
                  <th className="text-right text-slate-400 py-2 px-3">
                    المنطقة
                  </th>
                  <th className="text-right text-slate-400 py-2 px-3">
                    المبلغ
                  </th>
                  <th className="text-right text-slate-400 py-2 px-3">
                    الحالة
                  </th>
                  <th className="text-right text-slate-400 py-2 px-3">
                    المندوب
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={o.id} className="border-b border-navy-600/10">
                    <td className="py-2 px-3 text-gold-400 font-medium">
                      {i + 1}
                    </td>
                    <td className="py-2 px-3 text-white">{o.clientName}</td>
                    <td className="py-2 px-3 text-emerald-400">{o.zone}</td>
                    <td className="py-2 px-3 text-white">
                      {o.amount.toLocaleString("ar-EG")}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          o.status === "delivered"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : o.status === "returned"
                              ? "bg-rose-500/10 text-rose-400"
                              : "bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {delegates.find((d) => d.id === o.delegateId)
                        ?.displayName || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!preview && (
        <div className="bg-navy-800/50 backdrop-blur-sm rounded-2xl border border-navy-600/30 p-12 mb-6 text-center">
          <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">
            اضغط "معاينة" لتحميل بيانات اليوم المختار
          </p>
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-2 bg-gradient-to-l from-emerald-500 to-emerald-600 text-white font-bold px-8 py-3 rounded-xl hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {exporting ? (
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
        ) : (
          <Download className="w-5 h-5" />
        )}
        {exporting ? "جاري التصدير..." : "تصدير ملف إكسل"}
      </button>
    </div>
  );
}
