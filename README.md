# SportEase

Smart Sports Equipment & Booking Management System for colleges, academies, and clubs.

React frontend + Express REST API + SQLite. Bookings, overlap prevention, issue/return, notifications, and admin analytics all persist in the database.

## Run locally

```bash
cd sportease
npm install
npm run dev
```

Then open [http://127.0.0.1:5173](http://127.0.0.1:5173).

- API: `http://127.0.0.1:5174`
- Database file: `server/data/sportease.db` (created on first API start)

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@sportease.com` | `admin123` |
| Student | `student@sportease.com` | `student123` |

Other seeded students use `student123` (`priya@sportease.com`, `jordan@sportease.com`, …).

## What is included

- Splash → landing → register/login
- Student dashboard, sports, equipment, grounds, stepped booking, RFID/QR pass, profile
- Admin CRUD for users, sports, equipment (with RFID tags), categories, grounds, slots
- Approve / reject / cancel bookings
- **RFID Desk**: issue and return equipment by tapping cards
- **WhatsApp & Alerts**: send booking details to students by WhatsApp, SMS or email
- Notifications and reports
- Server-side overlap check: `existing_start < requested_end AND existing_end > requested_start`

There is **no payment** in this version. Bookings are free; the fee settings, Pay page and
"Mark payment done" button were removed.

## RFID

Every **equipment item** has its own unique RFID tag, and every **booking** gets its own unique RFID tag
when it is created (shown on the student's pass and in the admin booking list).

| Thing | Tag looks like | Where to see / change it |
| --- | --- | --- |
| Equipment item | `EQ-3F9A12C4` | Admin → Equipment (column + Edit form) |
| Booking | `BK-7B21D0AE` | Student → My Bookings; Admin → Bookings |

- Tags are generated automatically and are **unique across both tables** (the server rejects duplicates).
- To use a real card or sticker, open the equipment (or booking) and tap it on the reader. The tag is typed
  into the box and replaces the generated one. Real cards usually look like `04A3B2C1`.
- Existing equipment and bookings in an old database get their tags automatically on the next start.

### Issue and return at the desk (Admin → RFID Desk)

1. **Issue:** tap the student's **booking** card, then the **equipment** tag. The server checks that the
   equipment belongs to that booking, so the wrong item is refused. The booking becomes *Active*.
2. **Return:** tap the **equipment** tag. Choose Excellent / Good / Damaged / Lost and confirm.
   The booking becomes *Completed*.
3. Every tap is recorded in **Recent RFID activity** (ok / denied / unknown tag).

**Hardware:** any USB RFID reader that works as a keyboard ("keyboard wedge", e.g. 125 kHz EM4100 or
13.56 MHz Mifare readers) works with no driver. The reader types the tag and presses Enter into the
focused box. **No reader?** The RFID Desk has a *Simulate a tap* panel that behaves exactly like a card tap,
so you can demo the whole flow on any laptop. Students without a card can still be served with the QR
code or booking code fallback.

## WhatsApp, SMS and email to students (Admin → WhatsApp & Alerts)

The server writes a message for every booking event: **received, approved, rejected, cancelled,
equipment issued, equipment returned**. It also lets the admin write any message to one student or all.
Students need a phone number on their profile (admins can edit it under Users).

It works in two modes:

1. **Click-to-send (default, nothing to set up).** Messages are saved in the log. Press **WhatsApp**, **SMS**
   or **Email** on a row (or on a booking's detail page): WhatsApp/SMS/your mail app opens with the
   message already written and you press send. WhatsApp does not allow sending from a web page
   without an API, so this is a manual last tap.
2. **Automatic WhatsApp / SMS (optional).** Copy `server/.env.example` to `server/.env`, add your Twilio
   keys, and restart. The server then sends WhatsApp itself on every booking event. If a send fails, the
   message stays in the log marked *Auto-send failed* and can be sent by hand. Setting `ADMIN_PHONE` also
   sends the admin a WhatsApp alert whenever a student books.

Admins also get an in-app notification when a student makes a booking.

## Edit equipment names

Sign in as admin → **Equipment** → **Edit** → change **Equipment Name** → **Save Equipment**. The API `PUT /api/equipment/:id` writes the new name to SQLite; student pages load it on the next fetch.

## New API endpoints

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/api/rfid/scan` | Identify a tag (booking / equipment / unknown) |
| POST | `/api/rfid/issue` | Issue: `{ booking_tag, equipment_tag }` |
| POST | `/api/rfid/return` | Return: `{ equipment_tag, condition_after, remarks }` |
| PUT | `/api/bookings/:id/rfid` | Assign a physical card to a booking |
| GET | `/api/rfid/logs` | Recent RFID activity |
| GET | `/api/messages` | Message log |
| POST | `/api/messages/send` | Write a message to one student or all |
| POST | `/api/bookings/:id/send-message` | Send booking details (`whatsapp` / `sms` / `email`) |

## Smart locker device (ESP32 + RC522) - student taps their own ID card

A reader (ESP32 + RC522 + relay-driven latch) can call `POST /api/device/tap` with the card UID and the
header `X-Device-Key` (set `DEVICE_KEY` in `server/.env`). One tap **issues** the student's approved booking
that is due now, or **returns** the item they hold. The reply says `unlock: true/false`. If a tap is refused
(no booking, unknown card, server down) the latch stays locked and the student uses the manual counter.

- Every student has a card field in **Admin -> Users** (virtual `ST-XXXXXXXX` until you paste a real UID).
- No hardware? `node scripts/simulate-device.js <CARD_UID>` behaves like the reader.
- Wiring diagram, pin table, firmware and the bench-test plan are in the `hardware/` folder.
- The firmware is a prototype and has **not** been tested on real hardware yet.

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/device/ping` | Reader health check (needs `X-Device-Key`) |
| POST | `/api/device/tap` | `{ card_uid, device_id }` -> issue or return, `{ ok, action, unlock, message }` |
| PUT | `/api/users/:id` | now also accepts `rfid_tag` (the student's card) |
