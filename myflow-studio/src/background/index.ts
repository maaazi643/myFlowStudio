// Bootstrap only. The message router, queue engine, and alarm-based
// lifecycle management arrive in M3 (messaging & background skeleton)
// and M7 (queue engine).

chrome.runtime.onInstalled.addListener((details) => {
  console.info("[MyFlow Studio] installed", details.reason);
});
