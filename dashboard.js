// dashboard.js
document.addEventListener("DOMContentLoaded", renderDashboard);

async function renderDashboard() {
  const items = await chrome.storage.local.get(null);
  const now = Date.now();

  // **1) Scheduled Snoozes**
  const snoozeKeys = Object.keys(items)
    .filter((k) => k.startsWith("snooze-"))
    .sort((a, b) => items[a].snoozeTime - items[b].snoozeTime);

  const snoozeContainer = document.getElementById("dashboard-list");
  snoozeContainer.innerHTML = snoozeKeys.length
    ? ""
    : '<p class="text-neutral-300">No scheduled snoozes.</p>';

  snoozeKeys.forEach((key) => {
    const { title, url, snoozeTime } = items[key];
    const card = document.createElement("div");
    card.className = "bg-neutral-700/60 rounded-2xl shadow-lg p-4 space-y-2";

    // Title
    const h2 = document.createElement("h2");
    h2.className = "text-xl font-bold";
    const raw = title || url;
    h2.textContent = raw.length > 20 ? raw.slice(0, 20) + "…" : raw;
    card.appendChild(h2);

    // Countdown
    const p = document.createElement("p");
    p.className = "text-neutral-300";
    function updateS() {
      const left = snoozeTime - Date.now();
      if (left <= 0) {
        p.textContent = "Reopening now…";
        return;
      }
      const h = Math.floor(left / 3600e3);
      const m = Math.floor((left % 3600e3) / 60000);
      const s = Math.floor((left % 60000) / 1000);
      p.textContent = `Opens in ${h}h ${m}m ${s}s`;
    }
    updateS();
    setInterval(updateS, 1000);
    card.appendChild(p);

    // Remove button
    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.className =
      "mt-2 px-3 py-1 bg-red-600 rounded font-bold hover:bg-red-500";
    btn.addEventListener("click", () => {
      chrome.storage.local.remove(key);
      chrome.alarms.clear(key);
      renderDashboard();
    });
    card.appendChild(btn);

    snoozeContainer.appendChild(card);
  });

  // **2) Scheduled Closures**
  const closeKeys = Object.keys(items)
    .filter((k) => k.startsWith("close-"))
    .sort((a, b) => items[a].closeTime - items[b].closeTime);

  const closeContainer = document.getElementById("dashboard-close-list");
  closeContainer.innerHTML = closeKeys.length
    ? ""
    : '<p class="text-neutral-300">No scheduled closures.</p>';

  closeKeys.forEach((key) => {
    const { tabId, closeTime } = items[key];
    const card = document.createElement("div");
    card.className = "bg-neutral-700/60 rounded-2xl shadow-lg p-4 space-y-2";

    // Title
    const h2 = document.createElement("h2");
    h2.className = "text-xl font-bold";
    chrome.tabs.get(tabId, (tab) => {
      const raw = tab?.title || `Tab ${tabId}`;
      h2.textContent = raw.length > 20 ? raw.slice(0, 20) + "…" : raw;
    });
    card.appendChild(h2);

    // Countdown
    const p = document.createElement("p");
    p.className = "text-neutral-300";
    function updateC() {
      const left = closeTime - Date.now();
      if (left <= 0) {
        p.textContent = "Closing now…";
        return;
      }
      const h = Math.floor(left / 3600e3);
      const m = Math.floor((left % 3600e3) / 60000);
      const s = Math.floor((left % 60000) / 1000);
      p.textContent = `Closes in ${h}h ${m}m ${s}s`;
    }
    updateC();
    setInterval(updateC, 1000);
    card.appendChild(p);

    // Remove button
    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.className =
      "mt-2 px-3 py-1 bg-red-600 rounded font-bold hover:bg-red-500";
    btn.addEventListener("click", () => {
      chrome.storage.local.remove(key);
      chrome.alarms.clear(key);
      renderDashboard();
    });
    card.appendChild(btn);

    closeContainer.appendChild(card);
  });
}
