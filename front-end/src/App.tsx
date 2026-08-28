import { useState, useEffect, useCallback } from "react";
import { User } from "./types";
import { getAuth, getToken, setAuth, logout } from "./store";
import { authApi } from "./api/authApi";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Orders from "./components/Orders";
import Delegates from "./components/Delegates";
import CalendarView from "./components/CalendarView";
import Collections from "./components/Collections";
import ExcelExport from "./components/ExcelExport";
import UserManagement from "./components/UserManagement";
import Zones from "./components/Zones";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  DollarSign,
  Menu,
  X,
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // On mount: if we have a cached user + token, verify with /me
  useEffect(() => {
    const init = async () => {
      const token = getToken();
      const cached = getAuth();
      if (token && cached) {
        try {
          const fresh = await authApi.getMe();
          setAuth(fresh);
          setUser(fresh);
        } catch {
          logout();
        }
      }
      setAuthChecking(false);
    };
    init();
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setPage("dashboard");
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setPage("dashboard");
  };

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleNavigate = useCallback((p: string) => {
    setPage(p);
    setSidebarOpen(false);
  }, []);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <svg
          className="animate-spin w-12 h-12 text-gold-400"
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

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard user={user} />;
      case "orders":
        return <Orders user={user} />;
      case "delegates":
        return <Delegates user={user} />;
      case "calendar":
        return <CalendarView />;
      case "collections":
        return <Collections user={user} />;
      case "excel":
        return <ExcelExport />;
      case "users":
        return <UserManagement />;
      case "zones":
        return <Zones />;
      default:
        return <Dashboard user={user} />;
    }
  };

  const mobileNavItems = [
    {
      id: "dashboard",
      label: "الرئيسية",
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
  ];

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold-500/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/3 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse,_rgba(10,25,47,0.5)_0%,_transparent_70%)]" />
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 right-4 z-[70] lg:hidden bg-navy-800/90 backdrop-blur-xl border border-gold-500/30 rounded-2xl p-3 text-gold-400 shadow-lg shadow-gold-500/10 active:scale-95 transition-all"
        aria-label="فتح القائمة"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-[80] lg:hidden transition-opacity duration-300 ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeSidebar}
        />
        <div
          className={`absolute right-0 top-0 h-full w-[280px] transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <button
            onClick={closeSidebar}
            className="absolute top-4 left-4 z-10 bg-navy-800/80 backdrop-blur-sm border border-navy-600/30 rounded-xl p-2 text-slate-400 hover:text-rose-400 transition-colors"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
          <Sidebar
            user={user}
            currentPage={page}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed right-0 top-0 h-screen z-50">
        <Sidebar
          user={user}
          currentPage={page}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      </div>

      {/* Main content */}
      <main className="lg:mr-64 min-h-screen relative z-10 pb-20 lg:pb-0">
        <div className="p-4 pt-16 lg:p-8 lg:pt-8 max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden">
        <div className="bg-navy-900/95 backdrop-blur-xl border-t border-navy-600/40 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-around px-2 py-2">
            {mobileNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  page === item.id
                    ? "text-gold-400"
                    : "text-slate-500 active:text-slate-300"
                }`}
              >
                <span className={page === item.id ? "scale-110" : ""}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-slate-500 active:text-slate-300 transition-all"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium">المزيد</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
