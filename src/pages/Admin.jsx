import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, formatTime, messageStatusLabel } from "../api";
import { channelLink } from "../notify";
import { DEPARTMENTS, YEARS } from "../constants";
import QrScanner, { parseScan } from "../QrScanner";
import { Badge, Empty, Field, Ghost, Modal, Primary, SkeletonGrid, Stat, inputCls, useToast } from "../ui";

function useList(path) {
  const [rows, setRows] = useState(null);
  const reload = () => api(path).then(setRows);
  useEffect(() => {
    reload();
  }, [path]);
  return [rows, reload];
}

export function AdminHome() {
  const [d, setD] = useState(null);
  useEffect(() => {
    api("/api/dashboard/admin").then(setD);
  }, []);
  if (!d) return <SkeletonGrid n={8} />;
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Users" value={d.users} icon="👥" />
        <Stat label="Total Equipment" value={d.equipment} icon="🧰" />
        <Stat label="Available Equipment" value={d.available} icon="✅" />
        <Stat label="Issued Equipment" value={d.issued} icon="📦" />
        <Stat label="Maintenance" value={d.maintenance} icon="🛠️" />
        <Stat label="Today's Bookings" value={d.today} icon="📅" />
        <Stat label="Pending Requests" value={d.pending} icon="⏳" />
        <Stat label="Active Bookings" value={d.active} icon="🟢" />
      </div>
    </div>
  );
}

function CrudTable({ columns, rows, onEdit, extra }) {
  if (!rows) return <SkeletonGrid n={4} />;
  if (!rows.length) return <Empty title="Nothing here yet." hint="Add the first record to get started." />;
  return (
    <>
      <div className="mt-4 hidden overflow-hidden rounded-3xl bg-white shadow-card md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c} className="px-4 py-3 font-medium">
                  {c}
                </th>
              ))}
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                {extra(r).map((cell, i) => (
                  <td key={i} className="px-4 py-3">
                    {cell}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <button className="font-semibold text-accent" onClick={() => onEdit(r)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-3 md:hidden">
        {rows.map((r) => (
          <div key={r.id} className="rounded-3xl bg-white p-4 shadow-card">
            {extra(r).map((cell, i) => (
              <p key={i} className="text-sm">
                <span className="text-slate-400">{columns[i]} · </span>
                {cell}
              </p>
            ))}
            <button className="mt-2 text-sm font-semibold text-accent" onClick={() => onEdit(r)}>
              Edit
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export function AdminUsers() {
  const [rows, reload] = useList("/api/users");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState(null);
  const toast = useToast();
  const shown = (rows || []).filter(
    (u) =>
      !q ||
      [u.full_name, u.email, u.student_id, u.department].join(" ").toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Users</h1>
      <input className={`${inputCls()} mt-4 max-w-sm`} placeholder="Search users..." value={q} onChange={(e) => setQ(e.target.value)} />
      <CrudTable
        columns={["Name", "Student ID", "RFID card", "Email", "Department", "Role", "Status"]}
        rows={shown}
        onEdit={setEdit}
        extra={(u) => [
          u.full_name,
          u.student_id,
          u.rfid_tag || "-",
          u.email,
          u.department,
          u.role,
          <Badge key="s" status={u.account_status === "active" ? "Approved" : "Cancelled"} />,
        ]}
      />
      <Modal open={!!edit} title="Edit user" onClose={() => setEdit(null)}>
        {edit ? (
          <div className="grid gap-3">
            {["full_name", "student_id", "phone"].map((k) => (
              <Field key={k} label={k}>
                <input className={inputCls()} value={edit[k] || ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
              </Field>
            ))}
            <Field label="RFID card (UID)">
              <input
                className={inputCls()}
                placeholder="Tap the student ID card on the reader, or type the UID"
                value={edit.rfid_tag || ""}
                onChange={(e) => setEdit({ ...edit, rfid_tag: e.target.value })}
              />
            </Field>
            <Field label="Department">
              <select className={inputCls()} value={edit.department || ""} onChange={(e) => setEdit({ ...edit, department: e.target.value })}>
                {!DEPARTMENTS.includes(edit.department) && edit.department ? (
                  <option value={edit.department}>{edit.department}</option>
                ) : null}
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Year">
              <select className={inputCls()} value={edit.year || "1"} onChange={(e) => setEdit({ ...edit, year: e.target.value })}>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>
            <select className={inputCls()} value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>
              <option value="student">student</option>
              <option value="admin">admin</option>
            </select>
            <select className={inputCls()} value={edit.account_status} onChange={(e) => setEdit({ ...edit, account_status: e.target.value })}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
            <Primary
              onClick={async () => {
                await api(`/api/users/${edit.id}`, { method: "PUT", body: edit });
                toast("User saved.");
                setEdit(null);
                reload();
              }}
            >
              Save
            </Primary>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export function AdminSports() {
  const [rows, reload] = useList("/api/sports");
  const [edit, setEdit] = useState(null);
  const toast = useToast();
  const blank = { name: "", description: "", icon: "🏅", image: "", status: "active" };
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Sports</h1>
        <Primary onClick={() => setEdit(blank)}>Add sport</Primary>
      </div>
      <CrudTable
        columns={["Name", "Equipment", "Available", "Status"]}
        rows={rows}
        onEdit={setEdit}
        extra={(s) => [`${s.icon} ${s.name}`, s.equipment_count, s.available_count, s.status]}
      />
      <Modal open={!!edit} title={edit?.id ? "Edit sport" : "Add sport"} onClose={() => setEdit(null)}>
        {edit ? (
          <div className="grid gap-3">
            <Field label="Name">
              <input className={inputCls()} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <Field label="Description">
              <textarea className={inputCls()} value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            </Field>
            <Field label="Icon">
              <input className={inputCls()} value={edit.icon || ""} onChange={(e) => setEdit({ ...edit, icon: e.target.value })} />
            </Field>
            <Field label="Image URL">
              <input className={inputCls()} value={edit.image || ""} onChange={(e) => setEdit({ ...edit, image: e.target.value })} />
            </Field>
            <select className={inputCls()} value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
            <Primary
              onClick={async () => {
                if (edit.id) await api(`/api/sports/${edit.id}`, { method: "PUT", body: edit });
                else await api("/api/sports", { method: "POST", body: edit });
                toast("Sport saved.");
                setEdit(null);
                reload();
              }}
            >
              Save
            </Primary>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export function AdminEquipment() {
  const [rows, reload] = useList("/api/equipment");
  const [sports, setSports] = useState([]);
  const [cats, setCats] = useState([]);
  const [edit, setEdit] = useState(null);
  const toast = useToast();
  useEffect(() => {
    api("/api/sports").then(setSports);
    api("/api/categories").then(setCats);
  }, []);
  const blank = {
    name: "",
    sport_id: "",
    category_id: "",
    equipment_code: "",
    serial_number: "",
    quantity: 1,
    available_quantity: 1,
    condition: "Good",
    status: "Available",
    description: "",
    image: "",
    purchase_date: "",
    rfid_tag: "",
  };
  const randomTag = () =>
    "EQ-" + Array.from(crypto.getRandomValues(new Uint8Array(4)), (x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
  async function save() {
    try {
      if (edit.id) await api(`/api/equipment/${edit.id}`, { method: "PUT", body: edit });
      else await api("/api/equipment", { method: "POST", body: edit });
      toast("Equipment saved.");
      setEdit(null);
      reload();
    } catch (e) {
      toast(e.message, "err");
    }
  }
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Equipment</h1>
        <Primary onClick={() => setEdit({ ...blank })}>Add Equipment</Primary>
      </div>
      <p className="mt-2 text-sm text-slate-500">Click Edit to change equipment names, codes, stock, status and the RFID tag. Every item has its own unique RFID tag.</p>
      <CrudTable
        columns={["Code", "RFID Tag", "Name", "Sport", "Category", "Qty", "Avail", "Condition", "Status"]}
        rows={rows}
        onEdit={setEdit}
        extra={(e) => [
          e.equipment_code,
          <span key="rf" className="font-mono text-xs">{e.rfid_tag}</span>,
          e.name,
          e.sport_name,
          e.category_name,
          e.quantity,
          e.available_quantity,
          e.condition,
          <Badge key="st" status={e.status} />,
        ]}
      />
      <Modal open={!!edit} title={edit?.id ? "Edit equipment" : "Add equipment"} onClose={() => setEdit(null)} wide>
        {edit ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Equipment Name">
              <input className={inputCls()} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <Field label="Equipment Code">
              <input className={inputCls()} value={edit.equipment_code} onChange={(e) => setEdit({ ...edit, equipment_code: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="RFID Tag (unique per item)">
                <div className="flex gap-2">
                  <input
                    className={inputCls() + " font-mono"}
                    placeholder="Tap the tag on your reader, or leave empty to auto-generate"
                    value={edit.rfid_tag || ""}
                    onChange={(e) => setEdit({ ...edit, rfid_tag: e.target.value.toUpperCase() })}
                  />
                  <Ghost onClick={() => setEdit({ ...edit, rfid_tag: randomTag() })}>Generate</Ghost>
                </div>
              </Field>
            </div>
            <Field label="Sport">
              <select className={inputCls()} value={edit.sport_id} onChange={(e) => setEdit({ ...edit, sport_id: Number(e.target.value) })}>
                <option value="">Select</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select className={inputCls()} value={edit.category_id || ""} onChange={(e) => setEdit({ ...edit, category_id: Number(e.target.value) })}>
                <option value="">Select</option>
                {cats
                  .filter((c) => !edit.sport_id || c.sport_id === Number(edit.sport_id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Serial Number">
              <input className={inputCls()} value={edit.serial_number || ""} onChange={(e) => setEdit({ ...edit, serial_number: e.target.value })} />
            </Field>
            <Field label="Quantity">
              <input type="number" className={inputCls()} value={edit.quantity} onChange={(e) => setEdit({ ...edit, quantity: Number(e.target.value) })} />
            </Field>
            <Field label="Available">
              <input type="number" className={inputCls()} value={edit.available_quantity} onChange={(e) => setEdit({ ...edit, available_quantity: Number(e.target.value) })} />
            </Field>
            <Field label="Condition">
              <select className={inputCls()} value={edit.condition} onChange={(e) => setEdit({ ...edit, condition: e.target.value })}>
                {["Excellent", "Good", "Average", "Damaged"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className={inputCls()} value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                {["Available", "Partially Available", "Booked", "Issued", "Maintenance", "Damaged", "Lost"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Purchase date">
              <input type="date" className={inputCls()} value={edit.purchase_date || ""} onChange={(e) => setEdit({ ...edit, purchase_date: e.target.value })} />
            </Field>
            <Field label="Image URL">
              <input className={inputCls()} value={edit.image || ""} onChange={(e) => setEdit({ ...edit, image: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea className={inputCls()} value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
              </Field>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Primary onClick={save}>Save Equipment</Primary>
              {edit.id ? (
                <Ghost
                  onClick={async () => {
                    await api(`/api/equipment/${edit.id}`, { method: "DELETE" });
                    toast("Marked removed.");
                    setEdit(null);
                    reload();
                  }}
                >
                  Delete
                </Ghost>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export function AdminCategories() {
  const [rows, reload] = useList("/api/categories");
  const [sports, setSports] = useState([]);
  const [edit, setEdit] = useState(null);
  const toast = useToast();
  useEffect(() => {
    api("/api/sports").then(setSports);
  }, []);
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Equipment Categories</h1>
        <Primary onClick={() => setEdit({ name: "", sport_id: "", description: "" })}>Add</Primary>
      </div>
      <CrudTable
        columns={["Name", "Sport", "Description"]}
        rows={rows}
        onEdit={setEdit}
        extra={(c) => [c.name, c.sport_name, c.description]}
      />
      <Modal open={!!edit} title="Category" onClose={() => setEdit(null)}>
        {edit ? (
          <div className="grid gap-3">
            <select className={inputCls()} value={edit.sport_id} onChange={(e) => setEdit({ ...edit, sport_id: Number(e.target.value) })}>
              <option value="">Sport</option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input className={inputCls()} placeholder="Name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <input className={inputCls()} placeholder="Description" value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            <Primary
              onClick={async () => {
                if (edit.id) await api(`/api/categories/${edit.id}`, { method: "PUT", body: edit });
                else await api("/api/categories", { method: "POST", body: edit });
                toast("Saved.");
                setEdit(null);
                reload();
              }}
            >
              Save
            </Primary>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export function AdminGrounds() {
  const [rows, reload] = useList("/api/grounds");
  const [sports, setSports] = useState([]);
  const [edit, setEdit] = useState(null);
  const toast = useToast();
  useEffect(() => {
    api("/api/sports").then(setSports);
  }, []);
  const blank = {
    name: "",
    sport_id: "",
    location: "",
    capacity: 10,
    description: "",
    image: "",
    status: "active",
    opening_time: "07:00",
    closing_time: "20:00",
  };
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Grounds & Courts</h1>
        <Primary onClick={() => setEdit(blank)}>Add ground</Primary>
      </div>
      <CrudTable
        columns={["Name", "Sport", "Location", "Hours", "Status"]}
        rows={rows}
        onEdit={setEdit}
        extra={(g) => [g.name, g.sport_name, g.location, `${g.opening_time}–${g.closing_time}`, g.status]}
      />
      <Modal open={!!edit} title="Ground" onClose={() => setEdit(null)} wide>
        {edit ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {["name", "location", "capacity", "opening_time", "closing_time", "image", "description"].map((k) => (
              <Field key={k} label={k}>
                <input className={inputCls()} value={edit[k] || ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
              </Field>
            ))}
            <select className={inputCls()} value={edit.sport_id} onChange={(e) => setEdit({ ...edit, sport_id: Number(e.target.value) })}>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select className={inputCls()} value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
            <Primary
              className="sm:col-span-2"
              onClick={async () => {
                if (edit.id) await api(`/api/grounds/${edit.id}`, { method: "PUT", body: edit });
                else await api("/api/grounds", { method: "POST", body: edit });
                toast("Ground saved.");
                setEdit(null);
                reload();
              }}
            >
              Save
            </Primary>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export function AdminBookings() {
  const [rows, setRows] = useState(null);
  const [sports, setSports] = useState([]);
  const [f, setF] = useState({ status: "", sport_id: "", date: "", q: "" });
  const nav = useNavigate();
  function load() {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(f).filter(([, v]) => v))).toString();
    api("/api/bookings?" + q).then(setRows);
  }
  useEffect(() => {
    api("/api/sports").then(setSports);
  }, []);
  useEffect(() => {
    load();
  }, [f]);
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Bookings</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <input className={inputCls()} placeholder="Booking ID or RFID tag" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <input type="date" className={inputCls()} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        <select className={inputCls()} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="">Status</option>
          {["Pending", "Approved", "Rejected", "Cancelled", "Active", "Completed"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className={inputCls()} value={f.sport_id} onChange={(e) => setF({ ...f, sport_id: e.target.value })}>
          <option value="">Sport</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      {!rows ? (
        <div className="mt-6">
          <SkeletonGrid />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((b) => (
            <button
              key={b.id}
              onClick={() => nav(`/admin/bookings/${b.id}`)}
              className="flex w-full items-center justify-between rounded-3xl bg-white p-4 text-left shadow-card"
            >
              <div>
                <p className="font-bold">{b.booking_code}</p>
                <p className="text-sm text-slate-500">
                  {b.user?.full_name} · {b.equipment?.name || b.ground?.name} · {b.booking_date} {formatTime(b.start_time)}
                </p>
                <p className="mt-0.5 font-mono text-xs text-slate-400">RFID {b.rfid_tag}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge status={b.status} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminBookingDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [b, setB] = useState(null);
  const [reason, setReason] = useState("");
  const [card, setCard] = useState("");
  const [msg, setMsg] = useState(null); // { text, status }
  const [text, setText] = useState("");
  const toast = useToast();
  const load = () => api(`/api/bookings/${id}`).then(setB);
  useEffect(() => {
    load();
    api(`/api/bookings/${id}/message`).then((m) => {
      setMsg(m);
      setText(m.text);
    });
  }, [id]);
  if (!b) return <SkeletonGrid n={2} />;
  async function act(path, body) {
    try {
      await api(path, { method: "POST", body });
      toast("Updated.");
      load();
    } catch (e) {
      toast(e.message, "err");
    }
  }
  async function assignCard() {
    try {
      await api(`/api/bookings/${id}/rfid`, { method: "PUT", body: { tag: card } });
      toast("RFID card assigned to this booking.");
      setCard("");
      load();
    } catch (e) {
      toast(e.message, "err");
    }
  }
  // Send the booking details to the student. With Twilio configured the server sends it itself;
  // otherwise we open WhatsApp / SMS / email with the text filled in (click-to-send).
  async function send(channel) {
    const auto = channel === "whatsapp" ? msg?.status?.whatsapp_auto : channel === "sms" ? msg?.status?.sms_auto : false;
    const href = channelLink(channel, b.user, text);
    if (!auto && !href) {
      return toast(channel === "email" ? "This student has no email." : "This student has no phone number. Add it in Users.", "err");
    }
    if (!auto) window.open(href, channel === "whatsapp" ? "_blank" : "_self", "noopener,noreferrer");
    try {
      const row = await api(`/api/bookings/${id}/send-message`, { method: "POST", body: { channel, text } });
      if (!auto) await api(`/api/messages/${row.id}/mark-sent`, { method: "POST" });
      toast(auto ? "Sent automatically." : "Opened " + channel + ". Press send there to deliver it.");
    } catch (e) {
      toast(e.message, "err");
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <h1 className="text-2xl font-extrabold">{b.booking_code}</h1>
        <div className="mt-4 grid gap-2 text-sm">
          <p>
            Student: {b.user?.full_name} ({b.user?.student_id}) · {b.user?.phone || "no phone"}
          </p>
          <p>
            Item: {b.equipment?.name || b.ground?.name} {b.equipment?.equipment_code || ""}
          </p>
          <p>
            {b.booking_date} · {formatTime(b.start_time)} – {formatTime(b.end_time)}
          </p>
          <p>Purpose: {b.purpose}</p>
          <div className="flex flex-wrap gap-2">
            <Badge status={b.status} />
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">RFID</p>
          <p className="mt-1">
            Booking tag: <span className="font-mono font-bold">{b.rfid_tag}</span>
          </p>
          {b.equipment ? (
            <p>
              Equipment tag: <span className="font-mono font-bold">{b.equipment.rfid_tag}</span>
            </p>
          ) : null}
          <div className="mt-3 flex gap-2">
            <input
              className={inputCls() + " font-mono"}
              placeholder="Tap a physical card to assign it to this booking"
              value={card}
              onChange={(e) => setCard(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && assignCard()}
            />
            <Ghost onClick={assignCard}>Assign</Ghost>
          </div>
        </div>
        <textarea className={`${inputCls()} mt-4`} placeholder="Reason / admin notes" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="mt-4 flex flex-wrap gap-2">
          {b.status === "Pending" ? (
            <>
              <Primary onClick={() => act(`/api/bookings/${id}/approve`, { admin_notes: reason })}>Approve Booking</Primary>
              <Ghost onClick={() => act(`/api/bookings/${id}/reject`, { reason })}>Reject Booking</Ghost>
            </>
          ) : null}
          <Ghost onClick={() => act(`/api/bookings/${id}/cancel`, { reason })}>Cancel</Ghost>
          {b.equipment_id && ["Approved", "Active"].includes(b.status) ? (
            <Primary onClick={() => nav("/admin/issue")}>Go to RFID Desk</Primary>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="text-lg font-extrabold">Send booking details to the student</h2>
        <p className="mt-1 text-sm text-slate-500">
          {msg?.status?.whatsapp_auto
            ? "WhatsApp auto-send is ON: the server delivers it for you."
            : "Press a button: WhatsApp / SMS / Email opens with this message filled in. Press send there."}
        </p>
        <textarea className={`${inputCls()} mt-3 font-mono text-xs`} rows={10} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Primary onClick={() => send("whatsapp")}>WhatsApp</Primary>
          <Ghost onClick={() => send("sms")}>SMS</Ghost>
          <Ghost onClick={() => send("email")}>Email</Ghost>
        </div>
        {!b.user?.phone ? <p className="mt-3 text-sm text-amber-700">This student has no phone number saved, so WhatsApp and SMS are unavailable. Add it under Users.</p> : null}
      </div>
    </div>
  );
}

export function AdminIssue() {
  const [rows, setRows] = useState(null);
  const [logs, setLogs] = useState([]);
  const [demo, setDemo] = useState([]);
  const [input, setInput] = useState("");
  const [booking, setBooking] = useState(null); // booking card that was tapped
  const [scanned, setScanned] = useState(null); // equipment that was tapped (for return)
  const [banner, setBanner] = useState(null); // { kind: ok | err | info, text }
  const [cond, setCond] = useState("Good");
  const [remarks, setRemarks] = useState("");
  const [ret, setRet] = useState(null);
  const [code, setCode] = useState("");
  const inputRef = useRef(null);
  const toast = useToast();

  const loadTx = () => api("/api/transactions").then(setRows);
  const loadLogs = () => api("/api/rfid/logs").then(setLogs);
  const loadDemo = () => api("/api/bookings?status=Approved").then((r) => setDemo(r.filter((x) => x.equipment).slice(0, 4)));
  const refresh = () => {
    loadTx();
    loadLogs();
    loadDemo();
  };
  useEffect(() => {
    refresh();
    inputRef.current?.focus();
  }, []);

  // One tap = one tag. Booking card first, then the equipment tag, to issue.
  // Tapping an issued equipment tag starts a return.
  async function tap(raw) {
    const tag = String(raw || "").trim();
    if (!tag) return;
    setInput("");
    try {
      const hit = await api("/api/rfid/scan", { method: "POST", body: { tag } });
      if (hit.type === "booking") {
        setBooking(hit.booking);
        setScanned(null);
        setBanner({
          kind: "info",
          text: hit.booking.equipment
            ? `Booking ${hit.booking.booking_code} for ${hit.booking.user?.full_name}. Now tap the ${hit.booking.equipment.name} tag.`
            : `Booking ${hit.booking.booking_code} is a ground booking, so there is nothing to issue.`,
        });
      } else if (hit.openTransaction) {
        setScanned(hit);
        setBooking(null);
        setBanner({ kind: "info", text: `${hit.equipment.name} ${hit.equipment.equipment_code} is out with ${hit.holder?.full_name}. Choose its condition and confirm the return.` });
      } else if (booking?.equipment_id) {
        const r = await api("/api/rfid/issue", { method: "POST", body: { booking_tag: booking.rfid_tag, equipment_tag: tag } });
        setBanner({ kind: "ok", text: `Issued ${hit.equipment.name} ${hit.equipment.equipment_code} to ${booking.user?.full_name}. Booking is now ${r.booking.status}.` });
        setBooking(null);
        setScanned(null);
        refresh();
        return;
      } else {
        setScanned(hit);
        setBanner({ kind: "info", text: `${hit.equipment.name} ${hit.equipment.equipment_code} is ${hit.equipment.status}. Tap a booking card first to issue it.` });
      }
    } catch (e) {
      setBanner({ kind: "err", text: e.message });
    }
    loadLogs();
    inputRef.current?.focus();
  }

  async function confirmReturn() {
    try {
      await api("/api/rfid/return", { method: "POST", body: { equipment_tag: scanned.tag, condition_after: cond, remarks } });
      setBanner({ kind: "ok", text: `${scanned.equipment.name} ${scanned.equipment.equipment_code} returned as ${cond}.` });
      setScanned(null);
      setRemarks("");
      setCond("Good");
      refresh();
    } catch (e) {
      setBanner({ kind: "err", text: e.message });
    }
  }

  // Fallback when a student has no card: QR or booking code
  async function lookup(value) {
    const q = parseScan(value || code);
    if (!q) return toast("Scan a QR or enter a booking code or RFID tag.", "err");
    try {
      const hit = await api(`/api/bookings/lookup?q=${encodeURIComponent(q)}`);
      setBooking(hit);
      setScanned(null);
      setBanner({ kind: "info", text: `Booking ${hit.booking_code} found for ${hit.user?.full_name}.` });
    } catch (e) {
      toast(e.message, "err");
    }
  }

  const tone = { ok: "bg-emerald-50 text-emerald-800", err: "bg-rose-50 text-rose-800", info: "bg-sky-50 text-sky-800" };

  return (
    <div>
      <h1 className="text-3xl font-extrabold">RFID Desk</h1>
      <p className="mt-1 text-sm text-slate-500">
        Tap the student's booking card, then the equipment tag, to issue. Tap an issued equipment tag to return it. USB RFID readers type the tag and press Enter, so just keep the box below selected.
      </p>

      <div className="mt-4 rounded-3xl bg-white p-5 shadow-card">
        <label className="text-sm font-semibold">Tap RFID card / tag here</label>
        <div className="mt-2 flex gap-2">
          <input
            ref={inputRef}
            autoFocus
            className={inputCls() + " font-mono text-lg"}
            placeholder="Waiting for tap…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tap(input)}
          />
          <Primary onClick={() => tap(input)}>Scan</Primary>
        </div>
        {banner ? <p className={`mt-3 rounded-2xl px-4 py-3 text-sm font-medium ${tone[banner.kind]}`}>{banner.text}</p> : null}

        {booking ? (
          <div className="mt-4 rounded-2xl border border-slate-200 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 1 · Booking card</p>
            <p className="mt-1 font-bold">
              {booking.user?.full_name} · {booking.user?.student_id} <span className="ml-1 font-mono text-xs font-normal text-slate-400">{booking.rfid_tag}</span>
            </p>
            <p className="text-slate-500">
              {booking.equipment?.name} {booking.equipment?.equipment_code} · {booking.booking_date} {formatTime(booking.start_time)}–{formatTime(booking.end_time)} · <Badge status={booking.status} />
            </p>
            {booking.equipment ? (
              <p className="mt-2 text-slate-700">
                Step 2: tap equipment tag <span className="font-mono font-bold">{booking.equipment.rfid_tag}</span>
              </p>
            ) : null}
            {booking.equipment ? (
              <button
                className="mt-2 text-xs text-slate-400 underline"
                onClick={async () => {
                  try {
                    await api("/api/transactions/issue", { method: "POST", body: { booking_id: booking.id } });
                    toast("Issued without tag check.");
                    setBooking(null);
                    refresh();
                  } catch (e) {
                    toast(e.message, "err");
                  }
                }}
              >
                Equipment tag not working? Issue without tag check
              </button>
            ) : null}
          </div>
        ) : null}

        {scanned?.openTransaction ? (
          <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Return</p>
            <p>
              <b>{scanned.equipment.name} {scanned.equipment.equipment_code}</b> issued to {scanned.holder?.full_name} ({scanned.holder?.booking_code}). Condition before: {scanned.openTransaction.condition_before}
            </p>
            <select className={inputCls()} value={cond} onChange={(e) => setCond(e.target.value)}>
              {["Excellent", "Good", "Damaged", "Lost"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input className={inputCls()} placeholder="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            <Primary onClick={confirmReturn}>Confirm return</Primary>
          </div>
        ) : null}
      </div>

      {demo.length ? (
        <div className="mt-4 rounded-3xl bg-white p-5 shadow-card">
          <p className="font-semibold">No reader? Simulate a tap</p>
          <p className="text-sm text-slate-500">Click a tag to behave exactly like a card tap. Booking tag first, then its equipment tag.</p>
          <div className="mt-3 space-y-2">
            {demo.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="w-44 truncate text-slate-500">{d.user?.full_name} · {d.equipment?.name}</span>
                <button className="rounded-full bg-navy-900 px-3 py-1 font-mono text-white" onClick={() => tap(d.rfid_tag)}>
                  {d.rfid_tag}
                </button>
                <span className="text-slate-400">then</span>
                <button className="rounded-full bg-accent px-3 py-1 font-mono text-white" onClick={() => tap(d.equipment.rfid_tag)}>
                  {d.equipment.rfid_tag}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <details className="mt-4 rounded-3xl bg-white p-5 shadow-card">
        <summary className="cursor-pointer font-semibold">Student has no card? Use QR or booking code</summary>
        <div className="mt-4">
          <QrScanner onScan={(value) => lookup(value)} />
        </div>
        <div className="mt-4 flex gap-2">
          <input
            className={inputCls()}
            placeholder="Booking code e.g. SPT-2026-00001"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") lookup();
            }}
          />
          <Primary onClick={() => lookup()}>Find</Primary>
        </div>
      </details>

      <h2 className="mt-8 font-bold">Open issues</h2>
      <div className="mt-3 space-y-3">
        {(rows || []).filter((t) => t.transaction_status === "Issued").length === 0 ? <p className="text-sm text-slate-400">Nothing is currently issued.</p> : null}
        {(rows || [])
          .filter((t) => t.transaction_status === "Issued")
          .map((t) => (
            <div key={t.id} className="rounded-3xl bg-white p-4 shadow-card">
              <p className="font-semibold">
                {t.equipment_name} {t.equipment_code} <span className="ml-1 font-mono text-xs font-normal text-slate-400">{t.equipment_rfid}</span>
              </p>
              <p className="text-sm text-slate-500">
                {t.student_name} · issued {new Date(t.issued_at).toLocaleString()}
              </p>
              <Ghost className="mt-2" onClick={() => setRet(t)}>
                Record return
              </Ghost>
            </div>
          ))}
      </div>

      <h2 className="mt-8 font-bold">Recent RFID activity</h2>
      <div className="mt-3 overflow-auto rounded-3xl bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Tag</th>
              <th className="p-3">Action</th>
              <th className="p-3">Result</th>
              <th className="p-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, 15).map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="whitespace-nowrap p-3 text-xs text-slate-500">{new Date(l.created_at).toLocaleTimeString()}</td>
                <td className="p-3 font-mono text-xs">{l.tag}</td>
                <td className="p-3 capitalize">{l.action}</td>
                <td className="p-3">
                  <Badge status={l.result} />
                </td>
                <td className="p-3 text-xs text-slate-500">{l.message}</td>
              </tr>
            ))}
            {!logs.length ? (
              <tr>
                <td className="p-4 text-slate-400" colSpan={5}>
                  No taps yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal open={!!ret} title="Record return" onClose={() => setRet(null)}>
        {ret ? (
          <ReturnForm
            tx={ret}
            onDone={() => {
              setRet(null);
              refresh();
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function ReturnForm({ tx, onDone }) {
  const [condition_after, setC] = useState("Good");
  const [remarks, setR] = useState("");
  const toast = useToast();
  return (
    <div className="grid gap-3">
      <p className="text-sm text-slate-500">Condition before: {tx.condition_before}</p>
      <select className={inputCls()} value={condition_after} onChange={(e) => setC(e.target.value)}>
        {["Excellent", "Good", "Damaged", "Lost"].map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <textarea className={inputCls()} value={remarks} onChange={(e) => setR(e.target.value)} placeholder="Remarks" />
      <Primary
        onClick={async () => {
          try {
            await api(`/api/transactions/${tx.id}/return`, { method: "POST", body: { condition_after, remarks } });
            toast("Return recorded.");
            onDone();
          } catch (e) {
            toast(e.message, "err");
          }
        }}
      >
        Return
      </Primary>
    </div>
  );
}

export function AdminNotes() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ user_id: "all", title: "", message: "", type: "System" });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => {
    api("/api/users").then(setUsers);
  }, []);
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-extrabold">Send notification</h1>
      <div className="mt-4 rounded-3xl bg-navy-950 p-4 text-sm text-slate-200">
        <p className="font-bold text-white">How to test</p>
        <p className="mt-1">Send to a student, then login as that student → Notifications. Or open student Notifications and click Send test.</p>
      </div>
      <div className="mt-6 grid gap-3 rounded-3xl bg-white p-6 shadow-card">
        <Field label="Send to">
          <select className={inputCls()} value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
            <option value="all">All students</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title">
          <input className={inputCls()} placeholder="e.g. Court closed tomorrow" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Message">
          <textarea
            className={inputCls()}
            rows={4}
            placeholder="Write the full message students should see"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </Field>
        <Field label="Type">
          <select className={inputCls()} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {["System", "Reminder", "Return Reminder", "Booking Approved"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Primary
          disabled={busy}
          onClick={async () => {
            const title = form.title.trim();
            const message = (form.message.trim() || title).trim();
            if (!title) return toast("Enter a title.", "err");
            setBusy(true);
            try {
              await api("/api/notifications", { method: "POST", body: { ...form, title, message } });
              toast("Notification sent.");
              setForm({ ...form, title: "", message: "" });
            } catch (e) {
              toast(e.message, "err");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Sending..." : "Send"}
        </Primary>
      </div>
    </div>
  );
}

export function AdminMessages() {
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState(null);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ user_id: "all", channel: "whatsapp", text: "" });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const load = () => api("/api/messages").then(setRows);
  useEffect(() => {
    load();
    api("/api/messaging/status").then(setStatus);
    api("/api/users").then(setUsers);
  }, []);

  async function compose() {
    if (!form.text.trim()) return toast("Write a message first.", "err");
    setBusy(true);
    try {
      const r = await api("/api/messages/send", { method: "POST", body: form });
      toast(status?.whatsapp_auto && form.channel === "whatsapp" ? `Sending ${r.sent} message(s) automatically.` : `${r.sent} message(s) ready below. Press the send buttons.`);
      setForm({ ...form, text: "" });
      load();
    } catch (e) {
      toast(e.message, "err");
    } finally {
      setBusy(false);
    }
  }
  // Called when the admin clicks a WhatsApp / SMS / Email link (the link itself opens the app).
  async function opened(m) {
    await api(`/api/messages/${m.id}/mark-sent`, { method: "POST" }).catch(() => {});
    load();
  }

  const auto = status?.whatsapp_auto;
  return (
    <div>
      <h1 className="text-3xl font-extrabold">WhatsApp & Alerts</h1>
      <div className={`mt-4 rounded-3xl p-4 text-sm ${auto ? "bg-emerald-50 text-emerald-900" : "bg-navy-950 text-slate-200"}`}>
        {auto ? (
          <p>
            <b>Automatic WhatsApp is ON.</b> Every booking, approval, issue and return is sent to the student by the server. Failed ones can still be sent by hand below.
          </p>
        ) : (
          <p>
            <b className="text-white">Click-to-send mode.</b> Every booking event is saved here. Press WhatsApp, SMS or Email on a row: the app opens with the message already written, and you press send. To make the server send WhatsApp automatically, add Twilio keys in <span className="font-mono">server/.env</span> (see README).
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-3 rounded-3xl bg-white p-6 shadow-card">
        <h2 className="font-bold">Write a message</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="To">
            <select className={inputCls()} value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
              <option value="all">All students</option>
              {users
                .filter((u) => u.role === "student")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Channel">
            <select className={inputCls()} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
          </Field>
        </div>
        <textarea className={inputCls()} rows={3} placeholder="e.g. Football ground is closed tomorrow. Bookings moved to Friday." value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        <Primary disabled={busy} onClick={compose}>
          {busy ? "Preparing…" : "Prepare message"}
        </Primary>
      </div>

      <h2 className="mt-8 font-bold">Message log</h2>
      {!rows ? (
        <div className="mt-3">
          <SkeletonGrid />
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {rows.length === 0 ? <Empty title="No messages yet." hint="Create a booking and its confirmation message will appear here." /> : null}
          {rows.map((m) => (
            <div key={m.id} className="rounded-3xl bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {m.user?.full_name || "Admin alert"} <span className="text-xs font-normal text-slate-400">· {m.event} · {m.channel}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Badge status={m.status} />
                  <span className="text-xs text-slate-400">{messageStatusLabel[m.status]}</span>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-line rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">{m.body}</p>
              {m.error ? <p className="mt-1 text-xs text-rose-600">{m.error}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {[
                  ["whatsapp", "WhatsApp"],
                  ["sms", "SMS"],
                  ["email", "Email"],
                ].map(([ch, label]) =>
                  m.links?.[ch] ? (
                    <a
                      key={ch}
                      href={m.links[ch]}
                      target={ch === "whatsapp" ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      onClick={() => opened(m)}
                      className={`rounded-full px-4 py-2 font-semibold ${ch === m.channel ? "bg-accent text-white" : "bg-slate-100 text-slate-700"}`}
                    >
                      {label}
                    </a>
                  ) : null
                )}
                {!m.links?.whatsapp && !m.links?.sms ? <span className="py-2 text-xs text-amber-700">No phone number on file for this student. Add it under Users.</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const COLORS = ["#22c55e", "#0ea5e9", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6"];

export function AdminReports() {
  const [from, setFrom] = useState("2026-01-01");
  const [to, setTo] = useState("2026-12-31");
  const [d, setD] = useState(null);
  useEffect(() => {
    api(`/api/analytics?from=${from}&to=${to}`).then(setD);
  }, [from, to]);
  if (!d) return <SkeletonGrid />;
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Reports & Analytics</h1>
      <div className="mt-4 flex gap-3">
        <input type="date" className={inputCls()} value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className={inputCls()} value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Most booked sports">
          <BarChart data={d.sports}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#22c55e" radius={8} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Equipment usage">
          <BarChart data={d.equipment} layout="vertical">
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip />
            <Bar dataKey="value" fill="#0ea5e9" />
          </BarChart>
        </ChartCard>
        <ChartCard title="Daily bookings">
          <LineChart data={d.daily}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#22c55e" />
          </LineChart>
        </ChartCard>
        <ChartCard title="Peak booking hours">
          <BarChart data={d.hours}>
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#f59e0b" />
          </BarChart>
        </ChartCard>
        <ChartCard title="Equipment status">
          <PieChart>
            <Pie data={d.status} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
              {d.status.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ChartCard>
        <ChartCard title="Monthly bookings">
          <BarChart data={d.monthly}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#6366f1" />
          </BarChart>
        </ChartCard>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-card">
          <h3 className="font-bold">Damaged equipment</h3>
          {d.damaged.map((e) => (
            <p key={e.id} className="mt-2 text-sm">
              {e.name} {e.equipment_code}
            </p>
          ))}
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-card">
          <h3 className="font-bold">Lost equipment</h3>
          {d.lost.length ? (
            d.lost.map((e) => (
              <p key={e.id} className="mt-2 text-sm">
                {e.name} {e.equipment_code}
              </p>
            ))
          ) : (
            <p className="mt-2 text-sm text-slate-500">None recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="h-80 rounded-3xl bg-white p-4 shadow-card">
      <h3 className="mb-2 font-bold">{title}</h3>
      <ResponsiveContainer width="100%" height="90%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function AdminSettings() {
  const [s, setS] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState({ label: "", start_time: "15:00", end_time: "16:00" });
  const toast = useToast();
  const load = () => {
    api("/api/settings").then(setS);
    api("/api/slots").then(setSlots);
  };
  useEffect(() => {
    load();
  }, []);
  if (!s) return <SkeletonGrid n={2} />;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <h1 className="text-2xl font-extrabold">Settings</h1>
        {Object.keys(s).map((k) => (
          <Field key={k} label={k}>
            <input className={inputCls()} value={s[k]} onChange={(e) => setEditSafe(setS, s, k, e.target.value)} />
          </Field>
        ))}
        <Primary
          className="mt-4"
          onClick={async () => {
            await api("/api/settings", { method: "PUT", body: s });
            toast("Settings saved.");
          }}
        >
          Save
        </Primary>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="font-bold">Time slots</h2>
        <div className="mt-3 space-y-2">
          {slots.map((x) => (
            <div key={x.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm">
              {x.label}
              <button
                className="text-rose-500"
                onClick={async () => {
                  await api(`/api/slots/${x.id}`, { method: "DELETE" });
                  load();
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2">
          <input className={inputCls()} placeholder="Label" value={slot.label} onChange={(e) => setSlot({ ...slot, label: e.target.value })} />
          <input className={inputCls()} value={slot.start_time} onChange={(e) => setSlot({ ...slot, start_time: e.target.value })} />
          <input className={inputCls()} value={slot.end_time} onChange={(e) => setSlot({ ...slot, end_time: e.target.value })} />
          <Primary
            onClick={async () => {
              await api("/api/slots", { method: "POST", body: slot });
              setSlot({ label: "", start_time: "15:00", end_time: "16:00" });
              load();
            }}
          >
            Add slot
          </Primary>
        </div>
      </div>
    </div>
  );
}

function setEditSafe(setS, s, k, v) {
  setS({ ...s, [k]: v });
}
