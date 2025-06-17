// chrome.runtime.onInstalled.addListener(({ reason }) => {
//   if (reason === "install") {
//     chrome.tabs.create({
//       url: "onboarding.html",
//     });
//   }
// });

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    // Opens a new tab with your onboarding.html
    chrome.tabs.create({
      url: chrome.runtime.getURL("onboarding.html"),
    });
  }
});
