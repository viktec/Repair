"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationsCard() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setSupported(true);
    setPermission(Notification.permission);

    // Fetch VAPID public key
    fetch("/api/push/subscribe")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.publicKey) setVapidKey(data.publicKey);
      })
      .catch(() => null);

    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => null);
  }, []);

  async function handleSubscribe() {
    if (!vapidKey) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      setPermission(Notification.permission);

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      if (res.ok) {
        setSubscribed(true);
      } else {
        await sub.unsubscribe();
        alert("Errore durante l'iscrizione. Riprova.");
      }
    } catch (err) {
      console.error("[push] subscribe error", err);
      setPermission(Notification.permission);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error("[push] unsubscribe error", err);
    } finally {
      setLoading(false);
    }
  }

  if (!supported || !vapidKey) return null;

  return (
    <div className="rounded-lg border p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          {subscribed ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm">Notifiche push</p>
          <p className="text-xs text-muted-foreground">
            {permission === "denied"
              ? "Notifiche bloccate dal browser. Abilitale nelle impostazioni del browser."
              : subscribed
              ? "Ricevi notifiche in tempo reale su questo dispositivo."
              : "Attiva per ricevere notifiche sui nuovi ticket e aggiornamenti."}
          </p>
        </div>
      </div>

      {permission !== "denied" && (
        <button
          onClick={subscribed ? handleUnsubscribe : handleSubscribe}
          disabled={loading}
          className="shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          {loading ? "..." : subscribed ? "Disattiva" : "Attiva"}
        </button>
      )}
    </div>
  );
}
