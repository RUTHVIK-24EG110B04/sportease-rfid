const TOKEN_KEY = "sportease_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token, remember) {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  if (!token) return;
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

export async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = { method, headers, body: form };
  } else {
    headers["Content-Type"] = "application/json";
    payload = { method, headers, body: body ? JSON.stringify(body) : undefined };
  }
  const res = await fetch(path, payload);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.");
    err.payload = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function bookingQr(b) {
  return JSON.stringify({
    bookingId: b.id,
    bookingCode: b.booking_code,
    equipmentId: b.equipment_id,
    userId: b.user_id,
    date: b.booking_date,
    time: `${b.start_time}-${b.end_time}`,
    rfid: b.rfid_tag,
  });
}

export function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
}

export const statusTone = {
  Pending: "bg-orange-100 text-orange-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-rose-100 text-rose-700",
  Cancelled: "bg-slate-200 text-slate-600",
  Active: "bg-sky-100 text-sky-700",
  Completed: "bg-blue-100 text-blue-700",
  Available: "bg-emerald-100 text-emerald-700",
  "Partially Available": "bg-lime-100 text-lime-700",
  Booked: "bg-amber-100 text-amber-700",
  Issued: "bg-indigo-100 text-indigo-700",
  Maintenance: "bg-yellow-100 text-yellow-800",
  Damaged: "bg-rose-100 text-rose-700",
  Lost: "bg-slate-800 text-white",
  Excellent: "bg-emerald-50 text-emerald-700",
  Good: "bg-sky-50 text-sky-700",
  Average: "bg-amber-50 text-amber-700",
  // WhatsApp / message log
  manual: "bg-amber-100 text-amber-800",
  queued: "bg-sky-100 text-sky-700",
  sent: "bg-emerald-100 text-emerald-800",
  sent_manual: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-700",
  no_phone: "bg-slate-200 text-slate-600",
  no_email: "bg-slate-200 text-slate-600",
  // RFID log results
  ok: "bg-emerald-100 text-emerald-800",
  denied: "bg-rose-100 text-rose-700",
  error: "bg-rose-100 text-rose-700",
  unknown: "bg-amber-100 text-amber-800",
};

export const messageStatusLabel = {
  manual: "Ready to send",
  queued: "Sending…",
  sent: "Sent",
  sent_manual: "Sent",
  failed: "Auto-send failed",
  no_phone: "No phone number",
  no_email: "No email",
};
