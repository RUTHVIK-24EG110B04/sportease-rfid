import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api, greeting, formatTime, bookingQr } from "../api";
import { DEPARTMENTS, YEARS } from "../constants";
import { useAuth } from "../AuthContext";
import { Badge, Empty, Field, Ghost, Primary, SkeletonGrid, Stat, inputCls, useToast } from "../ui";

export function StudentHome() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  useEffect(() => {
    api("/api/dashboard/student").then(setData);
  }, []);
  if (!data) return <SkeletonGrid n={4} />;
  return (
    <div>
      <h1 className="text-3xl font-extrabold">
        {greeting()}, {user.full_name.split(" ")[0]} 👋
      </h1>
      <p className="text-slate-500">Ready to play?</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Available Equipment" value={data.available} icon="🧰" />
        <Stat label="My Active Bookings" value={data.active} icon="📅" />
        <Stat label="Upcoming Bookings" value={data.upcoming} icon="⏰" />
        <Stat label="Pending Requests" value={data.pending} icon="⏳" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["/app/equipment", "Book Equipment", "Reserve bats, balls & kits"],
          ["/app/grounds", "Book Ground", "Book courts & turf ovals"],
          ["/app/bookings", "My Bookings", "QR codes & digital tickets"],
          ["/app/scan", "QR Pass", "Show live booking QR"],
        ].map(([to, t, d]) => (
          <Link key={to} to={to} className="card-hover rounded-3xl bg-white p-5 shadow-card">
            <p className="font-bold">{t}</p>
            <p className="mt-1 text-sm text-slate-500">{d}</p>
          </Link>
        ))}
      </div>
      <h2 className="mt-10 text-lg font-bold">Recent bookings</h2>
      <div className="mt-3 space-y-3">
        {data.recent.length ? (
          data.recent.map((b) => (
            <Link key={b.id} to={`/app/bookings/${b.id}`} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-card">
              <div>
                <p className="font-semibold">{b.booking_code}</p>
                <p className="text-sm text-slate-500">
                  {b.equipment?.name || b.ground?.name} · {b.booking_date} · {formatTime(b.start_time)}
                </p>
              </div>
              <Badge status={b.status} />
            </Link>
          ))
        ) : (
          <Empty title="No bookings yet." hint="Start by booking your favorite sports equipment." action={<Link className="mt-4 inline-block rounded-2xl bg-accent px-4 py-2 text-white" to="/app/equipment">Explore Equipment</Link>} />
        )}
      </div>
    </div>
  );
}

export function SportsPage() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api("/api/sports").then(setRows);
  }, []);
  if (!rows) return <SkeletonGrid />;
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Sports</h1>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {rows.filter((s) => s.status === "active").map((s) => (
          <Link key={s.id} to={`/app/equipment?sport=${s.id}`} className="card-hover overflow-hidden rounded-3xl bg-white shadow-card">
            <div className="h-40 overflow-hidden">
              <img src={s.image} alt="" className="img-zoom h-full w-full object-cover" />
            </div>
            <div className="p-5">
              <p className="text-lg font-bold">
                {s.icon} {s.name}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {s.equipment_count} equipment · {s.available_count} available
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-accent">Explore →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function EquipmentPage() {
  const [rows, setRows] = useState(null);
  const [sports, setSports] = useState([]);
  const [cats, setCats] = useState([]);
  const params = new URLSearchParams(window.location.search);
  const [f, setF] = useState({
    q: "",
    sport_id: params.get("sport") || "",
    category_id: "",
    status: "",
    condition: "",
    sort: "name",
  });

  function load() {
    const q = new URLSearchParams(f).toString();
    api("/api/equipment?" + q).then(setRows);
  }
  useEffect(() => {
    api("/api/sports").then(setSports);
    api("/api/categories").then(setCats);
  }, []);
  useEffect(() => {
    load();
  }, [f]);

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Equipment</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-6">
        <input className={inputCls() + " md:col-span-2"} placeholder="Search equipment..." value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <select className={inputCls()} value={f.sport_id} onChange={(e) => setF({ ...f, sport_id: e.target.value })}>
          <option value="">All sports</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select className={inputCls()} value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
          <option value="">Category</option>
          {cats.filter((c) => !f.sport_id || String(c.sport_id) === String(f.sport_id)).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className={inputCls()} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="">Availability</option>
          {["Available", "Issued", "Maintenance", "Damaged", "Lost"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className={inputCls()} value={f.condition} onChange={(e) => setF({ ...f, condition: e.target.value })}>
          <option value="">Condition</option>
          {["Excellent", "Good", "Average", "Damaged"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className={inputCls()} value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })}>
          <option value="name">Name</option>
          <option value="availability">Availability</option>
          <option value="recent">Recently Added</option>
        </select>
      </div>
      {!rows ? (
        <div className="mt-6">
          <SkeletonGrid />
        </div>
      ) : !rows.length ? (
        <div className="mt-6">
          <Empty title="No equipment found." hint="Try another sport or clear filters." action={<button className="mt-4 text-accent" onClick={() => setF({ q: "", sport_id: "", category_id: "", status: "", condition: "", sort: "name" })}>Clear Filters</button>} />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((e) => (
            <Link key={e.id} to={`/app/equipment/${e.id}`} className="card-hover overflow-hidden rounded-3xl bg-white shadow-card">
              <img src={e.image} alt="" className="img-zoom h-36 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{e.name}</p>
                    <p className="text-xs text-slate-500">{e.equipment_code} · {e.sport_name}</p>
                  </div>
                  <Badge status={e.status} />
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Qty {e.available_quantity}/{e.quantity} · {e.condition}
                </p>
                <p className="mt-2 text-sm font-semibold text-accent">View Details →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function EquipmentDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [eq, setEq] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [avail, setAvail] = useState(null);
  useEffect(() => {
    api(`/api/equipment/${id}`).then(setEq);
  }, [id]);
  useEffect(() => {
    api(`/api/equipment/${id}/availability?date=${date}`).then(setAvail);
  }, [id, date]);
  if (!eq) return <SkeletonGrid n={3} />;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        <img src={eq.image} alt="" className="h-72 w-full object-cover" />
        <div className="p-6">
          <h1 className="text-3xl font-extrabold">{eq.name}</h1>
          <p className="text-slate-500">Code {eq.equipment_code} · {eq.sport_name}</p>
          <p className="mt-1 text-xs text-slate-500">
            RFID tag: <span className="font-mono font-semibold">{eq.rfid_tag}</span>
          </p>
          <div className="mt-3 flex gap-2">
            <Badge status={eq.condition} />
            <Badge status={eq.status} />
          </div>
          <p className="mt-4 text-sm text-slate-600">{eq.description}</p>
          <p className="mt-2 text-sm">Quantity: {eq.available_quantity}/{eq.quantity}</p>
        </div>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="font-bold">Booking calendar</h2>
        <input type="date" className={inputCls() + " mt-3"} value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="mt-4 space-y-2">
          {avail?.slots?.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                s.available ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-400"
              }`}
            >
              <span>{s.label}</span>
              <span className="text-xs font-bold">{s.available ? "AVAILABLE" : "BOOKED"}</span>
            </div>
          ))}
        </div>
        <Primary className="mt-6 w-full" onClick={() => nav(`/app/book?equipment=${eq.id}&date=${date}`)}>
          Book Now
        </Primary>
      </div>
    </div>
  );
}

export function GroundsPage() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api("/api/grounds").then(setRows);
  }, []);
  if (!rows) return <SkeletonGrid />;
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Grounds & Courts</h1>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {rows.filter((g) => g.status === "active").map((g) => (
          <Link key={g.id} to={`/app/grounds/${g.id}`} className="card-hover overflow-hidden rounded-3xl bg-white shadow-card">
            <img src={g.image} alt="" className="img-zoom h-40 w-full object-cover" />
            <div className="p-5">
              <p className="font-bold">{g.name}</p>
              <p className="text-sm text-slate-500">{g.location} · cap {g.capacity}</p>
              <p className="mt-2 text-xs text-slate-500">
                {formatTime(g.opening_time)} – {formatTime(g.closing_time)}
              </p>
              <p className="mt-3 font-semibold text-accent">Book Ground →</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function GroundDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [g, setG] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [avail, setAvail] = useState(null);
  useEffect(() => {
    api(`/api/grounds/${id}`).then(setG);
  }, [id]);
  useEffect(() => {
    api(`/api/grounds/${id}/availability?date=${date}`).then(setAvail);
  }, [id, date]);
  if (!g) return <SkeletonGrid n={3} />;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        <img src={g.image} className="h-72 w-full object-cover" alt="" />
        <div className="p-6">
          <h1 className="text-3xl font-extrabold">{g.name}</h1>
          <p className="text-slate-500">{g.location} · {g.sport_name}</p>
          <p className="mt-3 text-sm">{g.description}</p>
        </div>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <input type="date" className={inputCls()} value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="mt-4 space-y-2">
          {avail?.slots?.map((s) => (
            <div key={s.id} className={`flex justify-between rounded-2xl px-4 py-3 ${s.available ? "bg-emerald-50" : "bg-slate-100 text-slate-400"}`}>
              <span>{s.label}</span>
              <span className="text-xs font-bold">{s.available ? "AVAILABLE" : "BOOKED"}</span>
            </div>
          ))}
        </div>
        <Primary className="mt-6 w-full" onClick={() => nav(`/app/book?ground=${g.id}&date=${date}`)}>
          Book Ground
        </Primary>
      </div>
    </div>
  );
}

export function BookingsPage() {
  const [rows, setRows] = useState(null);
  const [tab, setTab] = useState("Upcoming");
  useEffect(() => {
    api("/api/bookings?scope=mine").then(setRows);
  }, []);
  const groups = useMemo(() => {
    const list = rows || [];
    const today = new Date().toISOString().slice(0, 10);
    return {
      Upcoming: list.filter((b) => ["Pending", "Approved"].includes(b.status) && b.booking_date >= today),
      Active: list.filter((b) => b.status === "Active"),
      Completed: list.filter((b) => b.status === "Completed"),
      Cancelled: list.filter((b) => ["Cancelled", "Rejected"].includes(b.status)),
    };
  }, [rows]);
  if (!rows) return <SkeletonGrid />;
  const shown = groups[tab];
  return (
    <div>
      <h1 className="text-3xl font-extrabold">My Bookings</h1>
      <div className="mt-4 flex gap-2 overflow-auto">
        {Object.keys(groups).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t ? "bg-navy-900 text-white" : "bg-white"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {shown.length ? (
          shown.map((b) => (
            <Link key={b.id} to={`/app/bookings/${b.id}`} className="flex items-center justify-between gap-3 rounded-3xl bg-white p-4 shadow-card">
              <div>
                <p className="font-bold">{b.booking_code}</p>
                <p className="text-sm text-slate-500">
                  {b.sport?.name} · {b.equipment?.name || b.ground?.name} · {b.booking_date} · {formatTime(b.start_time)}–{formatTime(b.end_time)}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-400">RFID {b.rfid_tag}</p>
                <span className="mt-2 inline-block text-xs font-semibold text-accent">Open RFID / QR pass →</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge status={b.status} />
              </div>
            </Link>
          ))
        ) : (
          <Empty title="No bookings yet." hint="Start by booking your favorite sports equipment." action={<Link to="/app/equipment" className="mt-4 inline-block text-accent">Explore Equipment</Link>} />
        )}
      </div>
    </div>
  );
}

export function BookingDetail() {
  const { id } = useParams();
  const toast = useToast();
  const nav = useNavigate();
  const [b, setB] = useState(null);
  useEffect(() => {
    api(`/api/bookings/${id}`).then(setB);
  }, [id]);
  if (!b) return <SkeletonGrid n={2} />;
  const qr = bookingQr(b);
  const showQr = !["Cancelled", "Rejected"].includes(b.status);
  async function cancel() {
    await api(`/api/bookings/${id}/cancel`, { method: "POST" });
    toast("Booking cancelled.");
    nav("/app/bookings");
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <h1 className="text-2xl font-extrabold">{b.booking_code}</h1>
        <div className="mt-4 space-y-2 text-sm">
          <p>Sport: {b.sport?.name}</p>
          <p>Item: {b.equipment?.name || b.ground?.name} {b.equipment?.equipment_code || ""}</p>
          <p>
            {b.booking_date} · {formatTime(b.start_time)} – {formatTime(b.end_time)}
          </p>
          <p>Purpose: {b.purpose || "—"}</p>
          <p>Created: {new Date(b.created_at).toLocaleString()}</p>
          <p>Admin notes: {b.admin_notes || "—"}</p>
          <div className="flex flex-wrap gap-2">
            <Badge status={b.status} />
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Booking RFID tag</p>
            <p className="mt-1 font-mono text-lg font-bold">{b.rfid_tag}</p>
            {b.equipment ? (
              <p className="mt-1 text-xs text-slate-500">
                Equipment tag: <span className="font-mono">{b.equipment.rfid_tag}</span> · staff tap both tags to issue your gear
              </p>
            ) : null}
          </div>
        </div>
        {["Pending", "Approved"].includes(b.status) ? (
          <Ghost className="mt-6" onClick={cancel}>
            Cancel Booking
          </Ghost>
        ) : null}
      </div>
      {showQr ? (
        <div className="rounded-3xl bg-white p-6 text-center shadow-card">
          <QRCodeSVG value={qr} size={180} className="mx-auto" />
          <p className="mt-4 font-semibold">Live booking pass</p>
          <p className="mt-1 font-mono text-sm font-bold">{b.rfid_tag}</p>
          <p className="mt-1 text-sm text-slate-500">Tap your RFID card or show this QR at the sports desk. Staff scan it to issue equipment.</p>
          {b.transaction?.transaction_status === "Issued" ? <p className="mt-2 text-accent">Equipment Issued</p> : <p className="mt-2 text-accent">{b.status}</p>}
        </div>
      ) : null}
    </div>
  );
}

export function ScanPassPage() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api("/api/bookings?scope=mine").then(setRows);
  }, []);
  const live = (rows || []).filter((b) => !["Cancelled", "Rejected", "Completed"].includes(b.status));
  if (!rows) return <SkeletonGrid />;
  return (
    <div>
      <h1 className="text-3xl font-extrabold">RFID / QR Pass</h1>
      <p className="mt-1 text-sm text-slate-500">This is your live pass. At the desk, staff tap your RFID card (or scan this QR) to issue gear.</p>
      {live.length ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {live.map((b) => (
            <div key={b.id} className="rounded-3xl bg-white p-6 text-center shadow-card">
              <QRCodeSVG value={bookingQr(b)} size={200} className="mx-auto" />
              <p className="mt-4 text-lg font-bold">{b.booking_code}</p>
              <p className="font-mono text-sm font-bold text-accent">{b.rfid_tag}</p>
              <p className="text-sm text-slate-500">
                {b.equipment?.name || b.ground?.name} {b.equipment?.equipment_code || ""}
              </p>
              <p className="text-sm text-slate-500">
                {b.booking_date} · {formatTime(b.start_time)}–{formatTime(b.end_time)}
              </p>
              <div className="mt-2 flex justify-center gap-2">
                <Badge status={b.status} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <Empty title="No live pass yet." hint="Book equipment or a ground first, then your QR will appear here." action={<Link to="/app/equipment" className="mt-4 inline-block text-accent">Book now</Link>} />
        </div>
      )}
    </div>
  );
}

export function NotificationsPage() {
  const [rows, setRows] = useState(null);
  const nav = useNavigate();
  const toast = useToast();
  function load() {
    api("/api/notifications").then(setRows);
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);
  if (!rows) return <SkeletonGrid />;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Notifications</h1>
        <div className="flex gap-3 text-sm font-semibold">
          <button
            className="text-navy-900"
            onClick={async () => {
              await api("/api/notifications/test", { method: "POST" });
              toast("Test sent. Check this list and the bell icon.");
              load();
            }}
          >
            Send test
          </button>
          <button
            className="text-accent"
            onClick={async () => {
              await api("/api/notifications/read-all", { method: "POST" });
              setRows((r) => r.map((n) => ({ ...n, is_read: 1 })));
            }}
          >
            Mark all read
          </button>
        </div>
      </div>
      <div className="mt-4 rounded-3xl bg-navy-950 p-4 text-sm text-slate-200">
        <p className="font-bold text-white">How to test notifications</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Click <b>Send test</b> on this page. A new unread card should appear and the bell count should go up.</li>
          <li>Or login as admin → Notifications → send to your student account → refresh this page.</li>
          <li>Green cards are unread. White cards are already read.</li>
        </ol>
      </div>
      <div className="mt-4 space-y-3">
        {rows.length ? (
          rows.map((n) => (
            <button
              key={n.id}
              className={`block w-full rounded-3xl p-4 text-left shadow-card ${n.is_read ? "bg-white" : "bg-emerald-50"}`}
              onClick={async () => {
                await api(`/api/notifications/${n.id}/read`, { method: "PATCH" });
                load();
                if (n.related_booking_id) nav(`/app/bookings/${n.related_booking_id}`);
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400">{n.type}</p>
                <p className="text-xs font-semibold">{n.is_read ? "Read" : "New"}</p>
              </div>
              <p className="font-bold">{n.title}</p>
              <p className="text-sm text-slate-500">{n.message}</p>
            </button>
          ))
        ) : (
          <Empty title="No notifications yet." hint='Click "Send test" above to confirm the inbox works.' />
        )}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { user, refresh, logout } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [form, setForm] = useState(user);
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [issued, setIssued] = useState([]);
  useEffect(() => {
    api("/api/transactions").then((rows) => setIssued(rows.filter((t) => t.transaction_status === "Issued")));
  }, []);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-navy-900 text-2xl font-bold text-white">
            {user.full_name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">{user.full_name}</h1>
            <p className="text-sm capitalize text-slate-500">{user.role} · {user.student_id}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          <Field label="Full name">
            <input className={inputCls()} value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input className={inputCls()} value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Department">
            <select className={inputCls()} value={form.department || ""} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              {!DEPARTMENTS.includes(form.department) && form.department ? <option value={form.department}>{form.department}</option> : null}
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Year">
            <select className={inputCls()} value={form.year || "1"} onChange={(e) => setForm({ ...form, year: e.target.value })}>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-sm text-slate-500">Email: {user.email}</p>
          <Primary
            onClick={async () => {
              await api("/api/auth/profile", { method: "PUT", body: form });
              await refresh();
              toast("Profile updated.");
            }}
          >
            Edit Profile
          </Primary>
        </div>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="font-bold">Change Password</h2>
        <div className="mt-4 space-y-3">
          <input className={inputCls()} type="password" placeholder="Current password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
          <input className={inputCls()} type="password" placeholder="New password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} />
          <Primary
            onClick={async () => {
              try {
                await api("/api/auth/password", { method: "PUT", body: pw });
                toast("Password updated.");
              } catch (e) {
                toast(e.message, "err");
              }
            }}
          >
            Change Password
          </Primary>
          <Ghost
            className="w-full"
            onClick={() => {
              logout();
              nav("/");
            }}
          >
            Logout
          </Ghost>
        </div>
        {issued.length ? (
          <div className="mt-6">
            <h3 className="font-bold">Issued equipment</h3>
            {issued.map((t) => (
              <div key={t.id} className="mt-2 rounded-2xl bg-slate-50 p-3 text-sm">
                <p>
                  {t.equipment_name} {t.equipment_code}
                </p>
                <button
                  className="mt-1 font-semibold text-accent"
                  onClick={async () => {
                    await api(`/api/transactions/${t.id}/return`, { method: "POST", body: { condition_after: "Good" } });
                    toast("Return requested.");
                    setIssued((rows) => rows.filter((x) => x.id !== t.id));
                  }}
                >
                  Return equipment
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BookFlow() {
  const toast = useToast();
  const nav = useNavigate();
  const { user } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const [step, setStep] = useState(params.get("equipment") || params.get("ground") ? 1 : 0);
  const [equipment, setEquipment] = useState([]);
  const [grounds, setGrounds] = useState([]);
  const [slots, setSlots] = useState([]);
  const [kind, setKind] = useState(params.get("ground") ? "ground" : "equipment");
  const [form, setForm] = useState({
    equipment_id: params.get("equipment") || "",
    ground_id: params.get("ground") || "",
    booking_date: params.get("date") || new Date().toISOString().slice(0, 10),
    start_time: "",
    end_time: "",
    purpose: "",
  });
  const [conflict, setConflict] = useState(null);
  const [busy, setBusy] = useState(false);
  const steps = ["Equipment", "Date", "Time", "Review", "Confirm"];

  useEffect(() => {
    api("/api/equipment").then(setEquipment);
    api("/api/grounds").then(setGrounds);
    api("/api/slots").then(setSlots);
  }, []);

  const selectedEq = equipment.find((e) => String(e.id) === String(form.equipment_id));
  const selectedG = grounds.find((g) => String(g.id) === String(form.ground_id));

  async function confirm() {
    setBusy(true);
    setConflict(null);
    try {
      const body = {
        booking_date: form.booking_date,
        start_time: form.start_time,
        end_time: form.end_time,
        purpose: form.purpose,
        equipment_id: kind === "equipment" ? Number(form.equipment_id) : null,
        ground_id: kind === "ground" ? Number(form.ground_id) : null,
      };
      const b = await api("/api/bookings", { method: "POST", body });
      toast(
        user?.phone
          ? `Booking done. RFID tag ${b.rfid_tag}. A WhatsApp confirmation goes to your number.`
          : `Booking done. RFID tag ${b.rfid_tag}. Add your mobile in Profile to get WhatsApp updates.`
      );
      nav(`/app/bookings/${b.id}`);
    } catch (err) {
      if (err.status === 409) setConflict(err.payload);
      toast(err.message, "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold">Smart booking</h1>
      <div className="mt-4 flex gap-2 overflow-auto text-xs font-semibold">
        {steps.map((s, i) => (
          <span key={s} className={`rounded-full px-3 py-1 ${i <= step ? "bg-accent text-white" : "bg-white text-slate-400"}`}>
            {s}
          </span>
        ))}
      </div>
      <div className="mt-6 rounded-3xl bg-white p-6 shadow-card">
        {step === 0 ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button className={`rounded-full px-4 py-2 ${kind === "equipment" ? "bg-navy-900 text-white" : "bg-slate-100"}`} onClick={() => setKind("equipment")}>
                Equipment
              </button>
              <button className={`rounded-full px-4 py-2 ${kind === "ground" ? "bg-navy-900 text-white" : "bg-slate-100"}`} onClick={() => setKind("ground")}>
                Ground
              </button>
            </div>
            <select className={inputCls()} value={kind === "equipment" ? form.equipment_id : form.ground_id} onChange={(e) => setForm({ ...form, [kind === "equipment" ? "equipment_id" : "ground_id"]: e.target.value })}>
              <option value="">Select {kind}</option>
              {(kind === "equipment" ? equipment : grounds).map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} {x.equipment_code || ""}
                </option>
              ))}
            </select>
            <Primary onClick={() => setStep(1)}>Continue</Primary>
          </div>
        ) : null}
        {step === 1 ? (
          <div>
            <Field label="Select date">
              <input type="date" className={inputCls()} value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} />
            </Field>
            <Primary className="mt-4" onClick={() => setStep(2)}>
              Continue
            </Primary>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="space-y-3">
            {slots.map((s) => (
              <button
                key={s.id}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 ${
                  form.start_time === s.start_time ? "border-accent bg-accent-soft" : "border-slate-200"
                }`}
                onClick={() => setForm({ ...form, start_time: s.start_time, end_time: s.end_time })}
              >
                {s.label}
              </button>
            ))}
            <Primary onClick={() => setStep(3)}>Continue</Primary>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="space-y-3">
            <Field label="Purpose">
              <input className={inputCls()} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            </Field>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm">
              <p>{selectedEq?.name || selectedG?.name}</p>
              <p>
                {form.booking_date} · {form.start_time} – {form.end_time}
              </p>
            </div>
            {conflict ? (
              <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
                <p className="font-bold">{conflict.error}</p>
                <p>{conflict.detail}</p>
                <div className="mt-2 space-y-1">
                  {conflict.alternatives
                    ?.filter((a) => a.available)
                    .map((a) => (
                      <button
                        key={a.id}
                        className="block w-full rounded-xl bg-white px-3 py-2 text-left"
                        onClick={() => {
                          setForm({ ...form, start_time: a.start_time, end_time: a.end_time });
                          setConflict(null);
                          setStep(2);
                        }}
                      >
                        {a.label}
                      </button>
                    ))}
                </div>
              </div>
            ) : null}
            <Primary onClick={() => setStep(4)}>Review</Primary>
          </div>
        ) : null}
        {step === 4 ? (
          <div>
            <p className="font-semibold">Confirm this booking?</p>
            <Primary className="mt-4" disabled={busy} onClick={confirm}>
              {busy ? "Checking availability..." : "Confirm"}
            </Primary>
          </div>
        ) : null}
      </div>
    </div>
  );
}
