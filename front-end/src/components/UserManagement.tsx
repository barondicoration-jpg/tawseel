import { useState, useEffect } from "react";
import { User, Role } from "../types";
import { usersApi } from "../api/usersApi";
import { zonesApi } from "../api/zonesApi";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";

const ROLE_LABELS: Record<Role, string> = {
  admin: "مدير عام",
  supervisor: "مشرف",
  delegate: "مندوب",
  viewer: "مشاهد",
};

const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-gold-500/10 text-gold-400 border-gold-500/20",
  supervisor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  delegate: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  viewer: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

// Normalise API user
function normalise(u: any): User {
  return { ...u, id: u._id || u.id };
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {},
  );
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    displayName: "",
    role: "delegate" as Role,
    zone: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [us, zs] = await Promise.all([
          usersApi.getAll(),
          zonesApi.getAll(),
        ]);
        setUsers(us.map(normalise));
        setZones(zs.map((z) => z.name));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleAdd = async () => {
    if (!newUser.username || !newUser.password || !newUser.displayName) return;
    setSaving(true);
    try {
      const created = await usersApi.create({
        ...newUser,
        zone: newUser.role === "delegate" ? newUser.zone : undefined,
      });
      setUsers((prev) => [...prev, normalise(created)]);
      setNewUser({
        username: "",
        password: "",
        displayName: "",
        role: "delegate",
        zone: "",
      });
      setShowAdd(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "حدث خطأ أثناء الإضافة");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من مسح هذا المستخدم؟")) return;
    try {
      await usersApi.delete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "حدث خطأ أثناء الحذف");
    }
  };

  const handleUpdateZone = async (id: string, zone: string) => {
    try {
      const updated = await usersApi.update(id, { zone });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? normalise(updated) : u)),
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "حدث خطأ");
    }
  };

  const togglePassword = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">إدارة المستخدمين</h1>
          <p className="text-slate-400 mt-1">
            إضافة وتعديل المستخدمين والصلاحيات
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-gradient-to-l from-gold-500 to-gold-600 text-navy-950 font-bold px-5 py-2.5 rounded-xl hover:scale-105 transition-all shadow-lg shadow-gold-500/20"
        >
          <Plus className="w-5 h-5" />
          مستخدم جديد
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-navy-800/80 backdrop-blur-xl rounded-2xl border border-gold-500/20 p-6 mb-6 animate-fade-in">
          <h3 className="text-gold-400 font-semibold mb-4">
            إضافة مستخدم جديد
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">
                الاسم المعروض
              </label>
              <input
                placeholder="مثال: مندوب ٤"
                value={newUser.displayName}
                onChange={(e) =>
                  setNewUser({ ...newUser, displayName: e.target.value })
                }
                className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-3 text-white placeholder-navy-600 focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">
                اسم المستخدم
              </label>
              <input
                placeholder="username"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
                className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-3 text-white placeholder-navy-600 focus:outline-none focus:border-gold-500/50"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">
                كلمة السر
              </label>
              <input
                type="password"
                placeholder="••••"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-3 text-white placeholder-navy-600 focus:outline-none focus:border-gold-500/50"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">
                الصلاحية
              </label>
              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value as Role })
                }
                className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50"
              >
                <option value="supervisor">مشرف</option>
                <option value="delegate">مندوب</option>
                <option value="viewer">مشاهد</option>
              </select>
            </div>
            {newUser.role === "delegate" && (
              <div>
                <label className="block text-slate-400 text-sm mb-1">
                  المنطقة
                </label>
                <select
                  value={newUser.zone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, zone: e.target.value })
                  }
                  className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50"
                >
                  <option value="">بدون منطقة</option>
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAdd}
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

      {/* Users table */}
      <div className="bg-navy-800/50 backdrop-blur-sm rounded-2xl border border-navy-600/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-600/30 bg-navy-800/80">
                <th className="text-right text-slate-400 text-sm py-4 px-5">
                  الاسم المعروض
                </th>
                <th className="text-right text-slate-400 text-sm py-4 px-5">
                  اسم المستخدم
                </th>
                <th className="text-right text-slate-400 text-sm py-4 px-5">
                  الصلاحية
                </th>
                <th className="text-right text-slate-400 text-sm py-4 px-5">
                  المنطقة
                </th>
                <th className="text-right text-slate-400 text-sm py-4 px-5">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-navy-600/10 hover:bg-navy-700/20 transition-colors"
                >
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${ROLE_COLORS[u.role]}`}
                      >
                        <span className="font-bold text-sm">
                          {u.displayName.charAt(0)}
                        </span>
                      </div>
                      <span className="text-white font-medium">
                        {u.displayName}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className="text-slate-400 font-mono text-sm"
                      dir="ltr"
                    >
                      {u.username}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`text-xs px-3 py-1 rounded-full border ${ROLE_COLORS[u.role]}`}
                    >
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    {u.role === "delegate" ? (
                      <select
                        value={u.zone || ""}
                        onChange={(e) => handleUpdateZone(u.id, e.target.value)}
                        className="bg-navy-900/50 border border-navy-600/30 rounded-lg px-3 py-1 text-emerald-400 text-sm focus:outline-none"
                      >
                        <option value="">بدون</option>
                        {zones.map((z) => (
                          <option key={z} value={z}>
                            {z}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    {u.role !== "admin" && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-rose-400/50 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
