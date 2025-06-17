// sw.js

// 1) On install: open onboarding
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
  }
});

// 2) Alarm listener for snooze- and close- entries
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const key = alarm.name;
  const { [key]: entry } = await chrome.storage.local.get(key);
  if (!entry) return;

  if (key.startsWith("snooze-")) {
    // Re-open the URL when snooze expires
    chrome.tabs.create({ url: entry.url });
  } else if (key.startsWith("close-")) {
    // Close the stored tabId
    try {
      await chrome.tabs.remove(entry.tabId);
    } catch {}
  }

  // Clean up
  chrome.storage.local.remove(key);
  chrome.alarms.clear(key);
});

// 3) Heartbeat fallback every 5 min
setInterval(async () => {
  const now = Date.now();
  const all = await chrome.storage.local.get(null);
  for (const [k, e] of Object.entries(all)) {
    const t = e.snoozeTime || e.closeTime;
    if (t && t <= now) {
      chrome.alarms.create(k, { when: 0 });
    }
  }
}, 5 * 60 * 1000);

// 4) Domain‐wide snooze enforcement
// Whenever the user navigates any top‐level frame,
// if its hostname matches any currently active snooze,
// redirect to dashboard.html immediately.
chrome.webNavigation.onBeforeNavigate.addListener(
  async (details) => {
    // Only care about main frame navigations
    if (details.frameId !== 0) return;

    let hostname;
    try {
      hostname = new URL(details.url).hostname;
    } catch {
      return;
    }

    const items = await chrome.storage.local.get(null);
    for (const [key, entry] of Object.entries(items)) {
      if (!key.startsWith("snooze-")) continue;

      // Compare domains
      let snoozeHost;
      try {
        snoozeHost = new URL(entry.url).hostname;
      } catch {
        continue;
      }
      if (hostname === snoozeHost) {
        // Redirect into your dashboard
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL("dashboard.html"),
        });
        return;
      }
    }
  },
  {
    url: [{ schemes: ["http", "https"] }],
  }
);
