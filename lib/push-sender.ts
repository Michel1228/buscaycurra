/* eslint-disable @typescript-eslint/no-require-imports */
const webpush = require("web-push") as {
  setVapidDetails: (subject: string, pub: string, priv: string) => void;
  sendNotification: (
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string
  ) => Promise<void>;
};

const VAPID_PUBLIC = "BEAUFUsgnk4QCgX9zA5tvPRykEZYA2b1jZOf_9e-PxyPj-8pIcxW7rwqLAo022ryxQmfjKcHlTvGboF17MdEk0s";

let initialized = false;
function initVapid() {
  if (initialized) return;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!priv) throw new Error("VAPID_PRIVATE_KEY no configurado");
  webpush.setVapidDetails("mailto:noreply@buscaycurra.es", VAPID_PUBLIC, priv);
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
