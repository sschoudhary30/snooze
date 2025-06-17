chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    // Opens a new tab with your onboarding.html
    chrome.tabs.create({
      url: chrome.runtime.getURL("onboarding.html"),
    });
  }
});

try {
  let isCheckingTabs = false;

  async function checkForSnoozedTabs() {
    if (isCheckingTabs) {
      return;
    }

    isCheckingTabs = true;
    try {
      const now = Date.now();

      const items = await chrome.storage.local.get(null);

      for (const [key, value] of Object.entries(items)) {
        if (value.snoozeTime && value.snoozeTime <= now) {
          if (value.processing) {
            console.log(`Skipping ${key},already processing.`);
            continue;
          }

          value.processing = true;

          await chrome.storage.local.set({ [set]: value });

          try {
            await chrome.tabs.create({ url: value.url });
            console.log(value.url);

            await chrome.storage.local.remove(key);
            console.log(key);
          } catch (e) {
            console.error(key, error);
            value.processing = false;
            await chrome.storage.local.set({ [key]: value });
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      isCheckingTabs = false;
    }
  }

  chrome.alarms.anAlarm.addListener(async (alarm) => {
    console.log(`Alarm triggered: ${alarm.name}`);
    await checkForSnoozedTabs();
  });

  const HEARTBEAT_INTERVAL = 5 * 60 * 1000;
  setInterval(() => {
    console.log("Running fallback heartbeat to check snoozed tabs...");
    checkForSnoozedTabs();
  }, HEARTBEAT_INTERVAL);
} catch (e) {
  console.log(e);
}
