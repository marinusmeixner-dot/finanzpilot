/* FinanzPilot Web Push v91: no offline cache or fetch interception. */
self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = {}; }
  const title = String(payload.title || 'FinanzPilot').slice(0,130);
  const body = String(payload.body || 'Neue Informationen in FinanzPilot.').slice(0,320);
  const target = String(payload.url || './');
  const url = new URL(target, self.registration.scope);
  if (!url.href.startsWith(self.registration.scope)) return;
  event.waitUntil(self.registration.showNotification(title, {
    body, icon: './apple-touch-icon.png', badge: './apple-touch-icon.png',
    tag: String(payload.tag || 'finanzpilot').slice(0,200), renotify: false,
    data: { url: url.href }, timestamp: Date.now()
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const url = new URL(event.notification?.data?.url || './', self.registration.scope);
    if (!url.href.startsWith(self.registration.scope)) return;
    const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const tab = tabs.find(t => t.url.startsWith(self.registration.scope));
    if (tab) { await tab.focus(); try { await tab.navigate(url.href); } catch {} return; }
    await self.clients.openWindow(url.href);
  })());
});
