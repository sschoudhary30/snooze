const hrsInput = document.getElementById("inputHours");
const minInput = document.getElementById("inputMinutes");
const btnSnooze = document.getElementById("btnSnooze");
const btnClose = document.getElementById("btnClose");
const snoozeDiv = document.getElementById("snooze-list");
const btnDash = document.getElementById("openDashboard");

btnSnooze.addEventListener("click", () => schedule("snooze"));
btnClose.addEventListener("click", () => schedule("close"));
btnDash.addEventListener("click", () => {
  chrome.tabs.create({ url: "dashboard.html" });
});

async function schedule(type) {
  const hrs = parseInt(hrsInput.value, 10) || 0;
  const mins = parseInt(minInput.value, 10) || 0;
  const ms = hrs * 3600e3 + mins * 60e3;
  if (ms <= 0) return alert("Enter a duration > 0.");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return alert("No active tab.");

  const now = Date.now();
  let name, payload;

  if (type === "snooze") {
    const when = now + ms;
    name = `snooze-${tab.id}-${when}`;
    payload = { url: tab.url, title: tab.title, snoozeTime: when };
    chrome.tabs.remove(tab.id);
  } else {
    const when = now + ms;
    name = `close-${tab.id}-${when}`;
    payload = { tabId: tab.id, closeTime: when };
  }

  await chrome.storage.local.set({ [name]: payload });
  chrome.alarms.create(name, { when: payload.snoozeTime || payload.closeTime });

  hrsInput.value = minInput.value = "";
  renderSnoozes();
}

async function renderSnoozes() {
  const items = await chrome.storage.local.get(null);
  const now = Date.now();
  const fiveMin = 5 * 60e3;
  const keys = Object.keys(items)
    .filter(
      (k) =>
        k.startsWith("snooze-") &&
        items[k].snoozeTime - now < fiveMin &&
        items[k].snoozeTime > now
    )
    .sort((a, b) => items[a].snoozeTime - items[b].snoozeTime);

  snoozeDiv.innerHTML = keys.length ? "" : "<em>No snoozes under 5 min.</em>";

  for (const k of keys) {
    const { title, url, snoozeTime } = items[k];
    const row = document.createElement("div");
    row.className = "flex items-center justify-between";

    const span = document.createElement("span");
    span.style.flex = "1";
    span.style.whiteSpace = "nowrap";
    span.style.overflow = "hidden";
    span.style.textOverflow = "ellipsis";

    function update() {
      const left = snoozeTime - Date.now();
      if (left <= 0) return;
      const m = Math.floor(left / 60000);
      const s = Math.floor((left % 60000) / 1000);
      span.textContent = `${(title || url).slice(0, 20)}… opens in ${m}m ${s}s`;
    }
    update();
    setInterval(update, 1000);
    row.appendChild(span);

    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.className = "ml-2 px-2 py-1 bg-red-600 rounded text-white text-sm";
    btn.addEventListener("click", () => {
      chrome.storage.local.remove(k, renderSnoozes);
      chrome.alarms.clear(k);
    });
    row.appendChild(btn);

    snoozeDiv.appendChild(row);
  }
}

document.addEventListener("DOMContentLoaded", renderSnoozes);
