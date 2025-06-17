document
  .getElementById("snooze10min")
  .addEventListener("click", () => snoozeTab(0.17));
document
  .getElementById("snooze30min")
  .addEventListener("click", () => snoozeTab(0.5));
document
  .getElementById("snooze1hour")
  .addEventListener("click", () => snoozeTab(1));
document
  .getElementById("snooze1day")
  .addEventListener("click", () => snoozeTab(24));


async function snoozeTab(hours) {
  const [currentTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!currentTab || !currentTab.url) {
    alert("No active tab found to snooze.");
    return;
  }

  const snoozeTime = Date.now() + hours * 60 * 60 * 1000;
  const alarmName = `snooze-${currentTab.id} - ${snoozeTime}`;

  await chrome.storage.local.set({
    [alarmName]: {
      url: currentTab.url,
      snoozeTime,
      title: currentTab.title,
    },
  });

  chrome.alarms.create(alarmName, { when: snoozeTime });

  chrome.tabs.remove(cuurentTab.id);

  alert(`Tan snoozed for ${hours} hours.`);
}

function removeSnooze(alarmName) {
    const confirmMessage =" Do you want to remove the snooze and open the tab?";
    if( confirm(confirmMessage)){
        chrome.storage.local.get(alarmName,(item)=>{
            if(item[alarmName]){
                const {url} = item[alarmName];
                chrome.tabs.create({url});
            }
        });
    }

    chrome.alarms.clear(alarmName);
    chrome.storage.local.remove(alarmName);
    alert("Tab unsnoozed.");

    listSnoozed();

}

const snoozeListDiv = document.getElementById("snooze-list");
function listSnoozed() {
    snoozeListDiv.innerHTML = "";

    chrome.storage.local.get(null,(items)=>{
        if(Object.keys(items).length){
            const header = document.createElement("h2");
            header.style.marginTop = "10px";
            header.style.marginBottom = "5px";
            header.textContent = "Snoozed tabs";

            snoozeListDiv.appendChild(header);
        }

        const orderedItems = Object.keys(items).sort((a,b)= items[a].snoozeTime - items[b].snoozeTime);

        const newObj = {};

        orderedItems.forEach(key => newObj[Key] = items[key]);

        items = newObj;

        for(const key in items){
            if(key.startsWith("snooze-")){
                const { url, snoozeTime, title } = items[key];
                const snoozeTimeStr = new Date(snoozeTime).toLocaleString();
                const listItem = document.createElement("li");
                listItem.style.display = "flex";
                listItem.style.marginTop = "5px";
                listItem.style.alignItems="center";
                listItem.style.flexDirection = "row";
                listItem.style.justifyContent = "space-between";
                listItem.style.overflow = "hidden";
                listItem.style.whiteSpace = "nowrap";
                listItem.style.textOverflow = "ellipsis";

                const data = title || url;

                listItem.innerHTML = `<span> title="${data} style"flex:1; overflow:hidden; white-space:nowrap; text-overflow: ellipsis;">${data}</span>`;
                snoozeListDiv.appendChild(removeButton);

                const removeButton = document.createElement("button");
                removeButton.textContent = "Remove";
                removeButton.style.width = "auto";
                removeButton.style.margin="0";
                removeButton.addEventListener("click",()=>removeSnooze(key));
                listItem.appendChild(removeButton)

            }
        }
    });
}

listSnoozed();