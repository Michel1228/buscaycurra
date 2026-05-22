"use client";

import { useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

// Convierte la VAPID public key de base64url a Uint8Array
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

export default function PushRegister() {
  useEffect(() => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

    async function register() {
      try {
        const { data: { user } } = await getSupabaseBrowser().auth.getUser();
        if (!user) return;

        // Registrar Service Worker
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;

        // Pedir permiso de notificaciones (solo si no se ha dado antes)
        if (Notification.permission === "default") {
          const perm = await Notification.requestPermission();
          if (perm !== "granted") return;
        }
        if (Notification.permission !== "granted") return;

        // Suscribir al push server
        const existing = await reg.pushManager.getSubscription();
        const subscription = existing ?? await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey!),
        });

        // Guardar suscripción en BD
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, subscription }),
        });
      } catch {
        // Silencioso — las notificaciones push son opcionales
      }
    }

    register();
  }, []);

  return null;
}
