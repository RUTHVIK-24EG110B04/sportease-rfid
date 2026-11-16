import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Dumbbell,
  Home,
  LandPlot,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Trophy,
  UserRound,
  Users,
  BarChart3,
  Package,
  Layers,
  QrCode,
  X,
  Nfc,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { api } from "./api";

const studentNav = [
  { to: "/app/dashboard", label: "Dashboard", icon: Home },
  { to: "/app/sports", label: "Sports", icon: Trophy },
  { to: "/app/equipment", label: "Equipment", icon: Dumbbell },
  { to: "/app/grounds", label: "Grounds", icon: LandPlot },
  { to: "/app/bookings", label: "My Bookings", icon: CalendarDays },
  { to: "/app/scan", label: "RFID / QR Pass", icon: Nfc },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/profile", label: "Profile", icon: UserRound },
];

const adminNav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/sports", label: "Sports", icon: Trophy },
  { to: "/admin/equipment", label: "Equipment", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Layers },
  { to: "/admin/grounds", label: "Grounds & Courts", icon: LandPlot },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { to: "/admin/issue", label: "RFID Desk", icon: Nfc },
  { to: "/admin/messages", label: "WhatsApp & Alerts", icon: MessageCircle },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function Layout({ mode }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const items = mode === "admin" ? adminNav : studentNav;
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState(null);

  useEffect(() => {
    setOpen(false);
    setHits(null);
  }, [loc.pathname]);

  useEffect(() => {
    function loadBell() {
      api("/api/notifications")
        .then((rows) => setUnread(rows.filter((n) => !n.is_read).length))
        .catch(() => {});
    }
    loadBell();
    const t = setInterval(loadBell, 8000);
    return () => clearInterval(t);
  }, [loc.pathname]);

  useEffect(() => {
    if (!q.trim()) {
      setHits(null);
      return;
    }
    const t = setTimeout(() => {
      api(`/api/search?q=${encodeURIComponent(q)}`)
        .then(setHits)
        .catch(() => {});
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const mobile = useMemo(
    () =>
      mode === "admin"
        ? [adminNav[0], adminNav[6], adminNav[7], adminNav[8], adminNav[1]]
        : [studentNav[0], studentNav[4], studentNav[5], studentNav[6], studentNav[7]],
    [mode]
  );

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col overflow-hidden bg-navy-950 text-white md:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-accent font-black">S</div>
          <div className="min-w-0">
            <p className="font-extrabold tracking-tight">SportEase</p>
            <p className="truncate text-xs text-emerald-300">
              {mode === "admin" ? "Admin console" : "Student athlete portal"}
            </p>
          </div>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to.endsWith("dashboard")}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-accent text-white shadow-sm" : "text-slate-300 hover:bg-white/5"
                }`
              }
            >
              <it.icon size={18} className="shrink-0" />
              <span className="truncate">{it.label}</span>
              {it.label === "Notifications" && unread ? (
                <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">{unread}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-xs font-bold">
              {user?.full_name?.[0] || "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.full_name}</p>
              <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              nav("/");
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
          <button className="rounded-xl p-2 md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search equipment, sports, booking ID..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent"
            />
            {hits ? (
              <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift">
                {!hits.equipment.length && !hits.sports.length && !hits.bookings.length ? (
                  <p className="px-4 py-3 text-sm text-slate-500">No matches.</p>
                ) : (
                  <div className="max-h-80 overflow-auto p-2 text-sm">
                    {hits.equipment.map((e) => (
                      <button
                        key={"e" + e.id}
                        className="block w-full rounded-xl px-3 py-2 text-left hover:bg-slate-50"
                        onClick={() => nav(mode === "admin" ? "/admin/equipment" : `/app/equipment/${e.id}`)}
                      >
                        {e.name} · {e.equipment_code}
                      </button>
                    ))}
                    {hits.bookings.map((b) => (
                      <button
                        key={"b" + b.id}
                        className="block w-full rounded-xl px-3 py-2 text-left hover:bg-slate-50"
                        onClick={() =>
                          nav(mode === "admin" ? `/admin/bookings/${b.id}` : `/app/bookings/${b.id}`)
                        }
                      >
                        {b.booking_code}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
          <button
            onClick={() => nav(mode === "admin" ? "/admin/notifications" : "/app/notifications")}
            className="relative rounded-2xl border border-slate-200 p-2.5"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unread ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            ) : null}
          </button>
          <div className="hidden items-center gap-2 sm:flex">
            <UserRound size={16} className="text-slate-400" />
            <div className="text-sm">
              <p className="font-semibold leading-tight">{user?.full_name}</p>
              <p className="text-xs capitalize text-slate-500">{user?.role}</p>
            </div>
          </div>
        </header>
        <main className="page-enter flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-navy-950/50 md:hidden">
          <div className="flex h-full w-72 flex-col bg-navy-950 p-4 text-white">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold">Menu</p>
              <button onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  className={({ isActive }) =>
                    `mb-1 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm ${isActive ? "bg-accent" : ""}`
                  }
                >
                  <it.icon size={18} /> {it.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white md:hidden">
        {mobile.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 text-[10px] ${isActive ? "text-accent" : "text-slate-500"}`
            }
          >
            <it.icon size={18} />
            {it.label.split(" ")[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
