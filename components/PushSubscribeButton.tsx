"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const VAPID_PUBLIC_KEY = "BDy57EXay3f97rznP-2QOJOrs2KWYqgWAK-PtQ9oF8W9Yxpu9ri_kqbYKKVgHByP5wOnoEfyTLigsaLRuawblZo";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function PushSubscribeButton() {
  const [estado, setEstado] = useState<"idle" | "cargando" | "activo" | "bloqueado" | "no-soportado">("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("no-soportado");
      return;
    }
    if (Notification.permission === "denied") {
      setEstado("bloqueado");
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (sub) setEstado("activo");
    });
  }, []);

  async function activar() {
    if (estado === "activo") {
      await desactivar();
      return;
    }

    setEstado("cargando");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setEstado("bloqueado"); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });

      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setEstado("idle"); return; }

      const subJson = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: { p256dh: subJson.keys?.p256dh, auth: subJson.keys?.auth },
        }),
      });

      setEstado("activo");
    } catch {
      setEstado("idle");
    }
  }

  async function desactivar() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) { setEstado("idle"); return; }

      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      await sub.unsubscribe();
      setEstado("idle");
    } catch {
      setEstado("idle");
    }
  }

  if (estado === "no-soportado") return null;

  return (
    <div className="flex items-center justify-between p-4 rounded-xl"
      style={{ background: "#161922", border: "1px solid #2d3142" }}>
      <div className="flex items-center gap-3">
        <span className="text-xl">🔔</span>
        <div>
          <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>
            Notificaciones de empleo
          </p>
          <p className="text-xs" style={{ color: "#64748b" }}>
            {estado === "activo"
              ? "Activas — te avisaremos de nuevas ofertas y envíos."
              : estado === "bloqueado"
              ? "Bloqueadas en el navegador. Actívalas en Configuración."
              : "Recibe alertas de ofertas y confirmaciones de envío."}
          </p>
        </div>
      </div>

      {estado !== "bloqueado" && (
        <button
          onClick={activar}
          disabled={estado === "cargando"}
          className="text-xs font-semibold px-3 py-2 rounded-lg transition flex-shrink-0 ml-3"
          style={{
            background: estado === "activo" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.12)",
            color: estado === "activo" ? "#ef4444" : "#22c55e",
            border: `1px solid ${estado === "activo" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
          }}
        >
          {estado === "cargando" ? "..." : estado === "activo" ? "Desactivar" : "Activar"}
        </button>
      )}
    </div>
  );
}
