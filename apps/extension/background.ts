const PLAYGROUND_URL = "https://lexical-devtools.vercel.app/";

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason !== chrome.runtime.OnInstalledReason.INSTALL) return;

  chrome.tabs.create({ url: PLAYGROUND_URL });
});
