["snooze10min", "snooze30min", "snooze1hour", "snooze1day"].forEach((id) => {
  document.getElementById(id).addEventListener("click", () => {
    const durations = {
      snooze10min: 0.17,
      snooze30min: 0.5,
      snooze1hour: 1,
      snooze1day: 24,
    };
    snoozeTab(durations[id]);
  });
});
// Open Dashboard
document.getElementById("openDashboard").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
});

async function snoozeTab(hours) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return alert("No active tab to snooze.");

  const snoozeTime = Date.now() + hours * 3600 * 1000;
  const key = `snooze-${tab.id}-${snoozeTime}`;
  await chrome.storage.local.set({
    [key]: { url: tab.url, title: tab.title, snoozeTime },
  });
  chrome.alarms.create(key, { when: snoozeTime });
  chrome.tabs.remove(tab.id);
  listSnoozed();
}

function removeSnooze(key) {
  chrome.storage.local.get(key, (items) => {
    const e = items[key];
    if (e?.url) chrome.tabs.create({ url: e.url });
    chrome.storage.local.remove(key);
    chrome.alarms.clear(key);
    listSnoozed();
  });
}

function listSnoozed() {
  chrome.storage.local.get(null, (items) => {
    const now = Date.now();
    const threshold = 60 * 60 * 1000;
    const keys = Object.keys(items)
      .filter(
        (k) => k.startsWith("snooze-") && items[k].snoozeTime - now < threshold
      )
      .sort((a, b) => items[a].snoozeTime - items[b].snoozeTime);

    const list = document.getElementById("snooze-list");
    list.innerHTML = "";

    keys.forEach((key) => {
      const { title, url, snoozeTime } = items[key];
      const li = document.createElement("li");
      li.className = "flex justify-between items-center";

      // Title
      const span = document.createElement("span");
      span.textContent = title || url;
      Object.assign(span.style, {
        flex: "1",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        marginRight: "8px",
      });
      li.appendChild(span);

      // Countdown
      const remainingMs = snoozeTime - now;
      const mins = Math.floor(remainingMs / 60000);
      const secs = Math.floor((remainingMs % 60000) / 1000);
      const cd = document.createElement("span");
      cd.textContent = `${mins}m ${secs}s`;
      cd.className = "text-sm text-neutral-400 mr-4";
      li.appendChild(cd);

      // Remove
      const btn = document.createElement("button");
      btn.textContent = "Remove";
      btn.className =
        "px-2 py-1 bg-red-600 rounded text-white text-sm hover:bg-red-500";
      btn.addEventListener("click", () => removeSnooze(key));
      li.appendChild(btn);

      list.appendChild(li);
    });
  });
}

// Refresh countdown every second
setInterval(listSnoozed, 1000);

// Initial
listSnoozed();
