export function intlPhone(phone) {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("0") && d.length === 11) d = d.slice(1);
  if (d.length === 10) d = "91" + d;
  return d;
}

export function bookingAlertText(b, extra = "") {
  const item = b.equipment?.name || b.ground?.name || "sports booking";
  const code = b.equipment?.equipment_code ? ` ${b.equipment.equipment_code}` : "";
  return [
    "SportEase – booking update",
    `Code: ${b.booking_code}`,
    `Item: ${item}${code}`,
    `Date: ${b.booking_date}`,
    `Time: ${b.start_time} – ${b.end_time}`,
    `Booking: ${b.status}`,
    b.rfid_tag ? `Booking RFID: ${b.rfid_tag}` : "",
    extra,
  ]
    .filter(Boolean)
    .join("\n");
}

export function sendWhatsApp(phone, text) {
  const n = intlPhone(phone);
  if (n.length < 11) return false;
  window.open(`https://wa.me/${n}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  return true;
}

export function sendSms(phone, text) {
  const n = intlPhone(phone);
  if (n.length < 11) return false;
  const ios = /iPhone|iPad|Mac/i.test(navigator.userAgent);
  const url = ios
    ? `sms:+${n}&body=${encodeURIComponent(text)}`
    : `sms:+${n}?body=${encodeURIComponent(text)}`;
  window.location.href = url;
  return true;
}

export function sendBookingAlerts(phone, text) {
  const ok = sendWhatsApp(phone, text);
  return ok;
}

// Build a WhatsApp / SMS / email link from a student + text. Used for click-to-send.
export function channelLink(channel, user, text) {
  const n = intlPhone(user?.phone);
  const q = encodeURIComponent(text);
  if (channel === "email") {
    return user?.email ? `mailto:${encodeURIComponent(user.email)}?subject=${encodeURIComponent("SportEase booking update")}&body=${q}` : "";
  }
  if (n.length < 11) return "";
  return channel === "sms" ? `sms:+${n}?body=${q}` : `https://wa.me/${n}?text=${q}`;
}
