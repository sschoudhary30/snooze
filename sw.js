chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install")
    chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
});

let checking = false;
async function checkSnoozes() {
  if (checking) return;
  checking = true;
  const now = Date.now();
  const items = await chrome.storage.local.get(null);

  for (const [key, entry] of Object.entries(items)) {
    if (entry.snoozeTime <= now) {
      chrome.tabs.create({ url: entry.url });
      chrome.storage.local.remove(key);
    }
  }

  checking = false;
}

chrome.alarms.onAlarm.addListener(checkSnoozes);
setInterval(checkSnoozes, 5 * 60 * 1000);
