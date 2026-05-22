import webpush from "web-push";

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:hola@buscaycurra.es";
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails(email, publicKey, privateKey);
  configured = true;
}

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: { title: string; body: string; url: string; tag?: string }
) {
  configure();
  if (!configured) return;
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err: unknown) {
    const e = err as { statusCode?: number };
    // 410 = suscripción expirada/eliminada — la borramos en el caller
    if (e?.statusCode === 410) throw new Error("SUBSCRIPTION_EXPIRED");
    throw err;
  }
}
