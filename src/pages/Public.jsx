import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Field, Primary, Ghost, inputCls, useToast } from "../ui";
import { DEPARTMENTS, YEARS } from "../constants";

export function Splash() {
  const { user, ready } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      nav(user ? (user.role === "admin" ? "/admin/dashboard" : "/app/dashboard") : "/landing", {
        replace: true,
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [ready, user, nav]);

  return (
    <div className="splash-bg grid min-h-screen place-items-center text-white">
      <div className="text-center">
        <div
          className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-accent text-4xl shadow-lift"
          style={{ animation: "splashScale 0.7s ease both" }}
        >
          🏅
        </div>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight" style={{ animation: "splashText 0.7s 0.15s ease both" }}>
          SPORTEASE
        </h1>
        <p className="mt-2 text-emerald-200" style={{ animation: "splashText 0.7s 0.3s ease both" }}>
          Play. Book. Manage.
        </p>
      </div>
    </div>
  );
}

export function Landing() {
  const features = [
    ["Easy Equipment Booking", "Reserve bats, balls, and kits in a few taps."],
    ["Smart Availability", "See live slots before you commit."],
    ["No Duplicate Bookings", "Server-side overlap checks keep schedules clean."],
    ["Ground Reservation", "Courts and fields with opening-hour rules."],
    ["Equipment Tracking", "Issue, return, damaged, and lost in one ledger."],
    ["Admin Analytics", "Usage, peaks, and inventory at a glance."],
  ];
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-white">S</span>
          SportEase
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="rounded-2xl px-4 py-2 text-sm font-semibold">
            Login
          </Link>
          <Link to="/register" className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white">
            Get Started
          </Link>
        </div>
      </header>
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs text-emerald-200">
              Smart Sports Equipment & Ground Booking
            </p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Manage Your Sports. <span className="text-accent">Smarter.</span>
            </h1>
            <p className="mt-4 max-w-lg text-slate-300">
              Book sports equipment, reserve grounds, manage schedules, and keep every sports facility organized in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="rounded-2xl bg-accent px-6 py-3 font-semibold text-white">
                Get Started
              </Link>
              <Link to="/login" className="rounded-2xl border border-white/20 px-6 py-3 font-semibold">
                Login
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {["Cricket", "Football", "Basketball", "Badminton"].map((n, i) => (
              <div
                key={n}
                className="card-hover rounded-3xl bg-white/10 p-5 backdrop-blur"
                style={{ animation: `splashText 0.6s ${i * 0.1}s ease both` }}
              >
                <p className="text-3xl">{["🏏", "⚽", "🏀", "🏸"][i]}</p>
                <p className="mt-3 font-bold">{n}</p>
                <p className="text-xs text-slate-300">Ready to book</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(([t, d]) => (
          <div key={t} className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
            <h3 className="font-bold">{t}</h3>
            <p className="mt-2 text-sm text-slate-500">{d}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-extrabold">Sports on campus</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["🏏", "Cricket"],
            ["⚽", "Football"],
            ["🏀", "Basketball"],
            ["🏐", "Volleyball"],
            ["🏸", "Badminton"],
            ["🏓", "Table Tennis"],
          ].map(([icon, name]) => (
            <div key={name} className="card-hover rounded-3xl border border-slate-100 p-5">
              <p className="text-3xl">{icon}</p>
              <p className="mt-2 font-bold">{name}</p>
              <p className="text-sm text-slate-500">Equipment and courts ready to book.</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="bg-navy-950 py-10 text-center text-white">
        <p className="text-sm text-slate-400">© {new Date().getFullYear()} SportEase · Campus athletics, organized.</p>
      </footer>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("student@sportease.com");
  const [password, setPassword] = useState("student123");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setBusy(true);
    try {
      const user = await login(email, password, remember);
      toast("Welcome back!");
      nav(user.role === "admin" ? "/admin/dashboard" : "/app/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-navy-950 p-12 text-white md:flex">
        <p className="font-extrabold">SportEase</p>
        <div>
          <h2 className="text-4xl font-extrabold">
            Play. Book.
            <br />
            <span className="text-accent">Manage.</span>
          </h2>
          <p className="mt-4 max-w-sm text-slate-300">The smart way to manage sports equipment, reserve grounds, and keep every facility organized.</p>
        </div>
        <p className="text-xs text-slate-500">Demo · student@sportease.com / student123 · admin@sportease.com / admin123</p>
      </div>
      <form onSubmit={submit} className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12">
        <h1 className="text-3xl font-extrabold">Welcome Back!</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to access equipment rental and ground booking.</p>
        {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        <div className="mt-6 space-y-4">
          <Field label="Email">
            <input className={inputCls()} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                className={inputCls()}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="absolute right-3 top-3 text-xs font-semibold text-slate-500" onClick={() => setShow((s) => !s)}>
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </Field>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember me
            </label>
            <button type="button" className="text-accent" onClick={() => toast("Ask athletics staff to reset your password.", "err")}>
              Forgot Password?
            </button>
          </div>
          <Primary disabled={busy} className="w-full">
            {busy ? "Signing in..." : "Login"}
          </Primary>
          <p className="text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-accent">
              Create Account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    full_name: "",
    student_id: "",
    email: "",
    phone: "",
    department: "Computer Science",
    year: "1",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await register(form);
      setOk(true);
      toast("Account created.");
      setTimeout(() => nav("/app/dashboard"), 900);
    } catch (err) {
      setErrors(err.payload?.errors || {});
      toast(err.message, "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl px-6 py-10">
      <Link to="/" className="text-sm font-semibold text-slate-500">
        ← SportEase
      </Link>
      <h1 className="mt-6 text-3xl font-extrabold">Create Account</h1>
      {ok ? <p className="mt-4 text-accent">Account ready. Taking you in…</p> : null}
      <form onSubmit={submit} className="mt-6 grid gap-4">
        {[
          ["full_name", "Full Name"],
          ["student_id", "Student ID"],
          ["email", "Email"],
          ["phone", "Phone"],
        ].map(([k, l]) => (
          <Field key={k} label={l} error={errors[k]}>
            <input className={inputCls(errors[k])} value={form[k]} onChange={(e) => set(k, e.target.value)} />
          </Field>
        ))}
        <Field label="Department" error={errors.department}>
          <select className={inputCls(errors.department)} value={form.department} onChange={(e) => set("department", e.target.value)}>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Year" error={errors.year}>
          <select className={inputCls()} value={form.year} onChange={(e) => set("year", e.target.value)}>
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </Field>
        <Field label="Password" error={errors.password}>
          <input type="password" className={inputCls(errors.password)} value={form.password} onChange={(e) => set("password", e.target.value)} />
        </Field>
        <Field label="Confirm Password" error={errors.confirm_password}>
          <input
            type="password"
            className={inputCls(errors.confirm_password)}
            value={form.confirm_password}
            onChange={(e) => set("confirm_password", e.target.value)}
          />
        </Field>
        <Primary disabled={busy}>{busy ? "Creating..." : "Create Account"}</Primary>
        <p className="text-center text-sm">
          Already registered?{" "}
          <Link className="font-semibold text-accent" to="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
