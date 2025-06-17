(async () => {
  const container = document.getElementById("dashboard-list");
  const items = await chrome.storage.local.get(null);
  const now = Date.now();
  const threshold = 60 * 60 * 1000;
  const keys = Object.keys(items)
    .filter(
      (k) => k.startsWith("snooze-") && items[k].snoozeTime - now >= threshold
    )
    .sort((a, b) => items[a].snoozeTime - items[b].snoozeTime);

  if (!keys.length) {
    container.innerHTML =
      '<p class="text-neutral-400">No long-term snoozes.</p>';
    return;
  }

  keys.forEach((key) => {
    const { title, url, snoozeTime } = items[key];
    const minutes = Math.ceil((snoozeTime - now) / 60000);

    const card = document.createElement("div");
    card.className = "bg-neutral-700/60 rounded-2xl shadow-lg p-6";

    const h2 = document.createElement("h2");
    h2.className = "text-2xl font-bold mb-2";
    h2.textContent = title || url;
    card.appendChild(h2);

    const info = document.createElement("p");
    info.className = "text-neutral-300";
    info.textContent = `Opens in ${minutes} minute(s)`;
    card.appendChild(info);

    container.appendChild(card);
  });
})();
