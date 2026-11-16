import { useEffect, useRef, useState } from "react";
import { Ghost, Primary } from "./ui";

export function parseScan(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  try {
    const j = JSON.parse(raw);
    return String(j.bookingCode || j.bookingId || raw);
  } catch {
    return raw;
  }
}

function decodeCanvas(canvas) {
  const { width, height } = canvas;
  if (!width || !height) return "";
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const pixels = ctx.getImageData(0, 0, width, height);
  if (window.jsQR) {
    const code = window.jsQR(pixels.data, width, height, { inversionAttempts: "dontInvert" });
    return parseScan(code?.data || "");
  }
  return "";
}

export default function QrScanner({ onScan, autoStart = true }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const [live, setLive] = useState(false);
  const [hint, setHint] = useState("Camera preview appears below. You can also upload a QR photo or type the booking code.");
  const insecure = typeof window !== "undefined" && !window.isSecureContext;

  async function stop() {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }

  function loop() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      timerRef.current = requestAnimationFrame(loop);
      return;
    }
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const value = decodeCanvas(canvas);
    if (value) {
      onScan(value);
      setHint("QR scanned successfully.");
      stop();
      return;
    }
    timerRef.current = requestAnimationFrame(loop);
  }

  async function start() {
    if (insecure) {
      setHint("Camera needs https:// or http://127.0.0.1 — this LAN http address blocks it. Upload a QR photo or type the code.");
      return;
    }
    setHint("Allow camera, then hold the QR inside the frame.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      setLive(true);
      loop();
    } catch {
      setHint("Camera permission blocked. Upload a QR photo or type the booking code.");
    }
  }

  useEffect(() => {
    if (autoStart) {
      void start();
    }
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      const value = decodeCanvas(canvas);
      if (!value) {
        setHint("No QR found in that photo. Try a clearer image.");
        return;
      }
      onScan(value);
      setHint("QR scanned from photo.");
    };
    img.src = URL.createObjectURL(file);
  }

  return (
    <div className="rounded-3xl bg-navy-950 p-5 text-white">
      <p className="text-lg font-bold">Live QR scanner</p>
      <p className="mt-1 text-sm text-slate-300">{hint}</p>
      <div className="relative mt-4 overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} className="aspect-video w-full object-cover" playsInline muted />
        {!live ? (
          <div className="absolute inset-0 grid place-items-center text-sm text-slate-400">Camera preview</div>
        ) : (
          <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-accent/80" />
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="mt-4 flex flex-wrap gap-2">
        {live ? (
          <Ghost className="border-white/20 bg-white/10 text-white" onClick={stop}>
            Stop camera
          </Ghost>
        ) : (
          <Primary onClick={start}>Start camera</Primary>
        )}
        <label className="btn-press inline-flex cursor-pointer items-center rounded-2xl border border-white/20 px-5 py-3 font-semibold">
          Upload QR photo
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
        </label>
      </div>
    </div>
  );
}
