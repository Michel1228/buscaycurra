/* eslint-disable @typescript-eslint/no-require-imports */
const webpush = require("web-push") as {
  setVapidDetails: (subject: string, pub: string, priv: string) => void;
  sendNotification: (
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string
  ) => Promise<void>;
};

// Usar variables de entorno (mismas que lib/web-push.ts) — sin hardcode
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:noreply@buscaycurra.es";

let initialized = false;
function initVapid() {
  if (initialized) return;
  const pub = VAPID_PUBLIC;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error("VAPID keys no configuradas (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)");
  webpush.setVapidDetails(VAPID_EMAIL, pub, priv);
  initialized = true;
}

export interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPush(sub: PushSub, payload: { title: string; body: string; url?: string }) {
  initVapid();
  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? "/app/buscar" })
  );
}
