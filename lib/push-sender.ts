import webpush from "web-push";

const VAPID_PUBLIC = "BEAUFUsgnk4QCgX9zA5tvPRykEZYA2b1jZOf_9e-PxyPj-8pIcxW7rwqLAo022ryxQmfjKcHlTvGboF17MdEk0s";

webpush.setVapidDetails(
  "mailto:noreply@buscaycurra.es",
  VAPID_PUBLIC,
  process.env.VAPID_PRIVATE_KEY || ""
);

export interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPush(sub: PushSub, payload: { title: string; body: string; url?: string }) {
  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? "/app/buscar" })
  );
}
