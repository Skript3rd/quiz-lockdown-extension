chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "terminate_quiz") {
    // Check if we have the tab ID to close
    if (sender.tab && sender.tab.id) {
      chrome.tabs.remove(sender.tab.id);
    }
  }
});