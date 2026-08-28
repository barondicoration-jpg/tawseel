import { User, Role } from "../types";
import { logout } from "../store"; // clears token + cached user
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CalendarDays,
  FileSpreadsheet,
  Settings,
  LogOut,
  MapPin,
  DollarSign,
  Shield,
} from "lucide-react";

interface SidebarProps {
  user: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const NAV_ITEMS: Record<
  Role,
  { id: string; label: string; icon: React.ReactNode }[]
> = {
  admin: [
    {
      id: "dashboard",
      label: "لوحة التحكم",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "orders",
      label: "الأوردرات",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      id: "delegates",
      label: "المندوبين",
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: "collections",
      label: "التحصيلات",
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      id: "calendar",
      label: "التقويم",
      icon: <CalendarDays className="w-5 h-5" />,
    },
    { id: "zones", label: "المناطق", icon: <MapPin className="w-5 h-5" /> },
    {
      id: "excel",
      label: "تصدير إكسل",
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    {
      id: "users",
      label: "إدارة المستخدمين",
      icon: <Shield className="w-5 h-5" />,
    },
  ],
  supervisor: [
    {
      id: "dashboard",
      label: "لوحة التحكم",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "orders",
      label: "الأوردرات",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      id: "delegates",
      label: "المندوبين",
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: "collections",
      label: "التحصيلات",
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      id: "calendar",
      label: "التقويم",
      icon: <CalendarDays className="w-5 h-5" />,
    },
    { id: "zones", label: "المناطق", icon: <MapPin className="w-5 h-5" /> },
    {
      id: "excel",
      label: "تصدير إكسل",
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
  ],
  delegate: [
    {
      id: "dashboard",
      label: "لوحة التحكم",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "orders",
      label: "أوردراتي",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      id: "collections",
      label: "تحصيلاتي",
      icon: <DollarSign className="w-5 h-5" />,
    },
  ],
  viewer: [
    {
      id: "dashboard",
      label: "لوحة التحكم",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "orders",
      label: "الأوردرات",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      id: "collections",
      label: "التحصيلات",
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      id: "calendar",
      label: "التقويم",
      icon: <CalendarDays className="w-5 h-5" />,
    },
  ],
};

export default function Sidebar({
  user,
  currentPage,
  onNavigate,
  onLogout,
}: SidebarProps) {
  const items = NAV_ITEMS[user.role] || [];
  const roleLabels: Record<Role, string> = {
    admin: "مدير عام",
    supervisor: "مشرف",
    delegate: "مندوب",
    viewer: "مشاهد",
  };

  return (
    <aside className="h-full w-64 lg:w-64 bg-navy-900/98 backdrop-blur-xl border-l border-navy-600/40 flex flex-col shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-navy-600/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
            <Settings className="w-5 h-5 text-navy-950" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">نظام المندوبين</h2>
            <p className="text-slate-500 text-xs">إدارة وتحصيل</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-navy-600/40">
        <div className="bg-navy-800/50 rounded-xl p-3 border border-navy-600/30">
          <p className="text-white font-semibold text-sm">{user.displayName}</p>
          <p className="text-gold-400 text-xs mt-1">{roleLabels[user.role]}</p>
          {user.zone && (
            <p className="text-emerald-400 text-xs mt-0.5">📍 {user.zone}</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto overscroll-contain">
        <div className="space-y-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group ${
                currentPage === item.id
                  ? "bg-gold-500/15 text-gold-400 border border-gold-500/30 shadow-sm shadow-gold-500/10"
                  : "text-slate-400 hover:text-white hover:bg-navy-700/50 border border-transparent active:scale-[0.98]"
              }`}
            >
              <span
                className={
                  currentPage === item.id
                    ? "text-gold-400"
                    : "text-navy-600 group-hover:text-slate-300"
                }
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-navy-600/40">
        <button
          onClick={() => {
            logout();
            onLogout();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all active:scale-[0.98]"
        >
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
