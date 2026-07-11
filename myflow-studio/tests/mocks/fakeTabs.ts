import type { ActiveTabInfo, TabsLike } from "@background/devMode/tabsBridge";

export interface FakeTabsOptions {
  activeTab?: ActiveTabInfo | undefined;
  /** If set, sendMessage rejects for this tabId (simulates "no content script listening"). */
  unreachableTabId?: number | undefined;
}

export function createFakeTabs(
  options: FakeTabsOptions = {},
): TabsLike & { sentMessages: { tabId: number; message: unknown }[] } {
  const sentMessages: { tabId: number; message: unknown }[] = [];
  return {
    sentMessages,
    queryActiveTab: () => Promise.resolve(options.activeTab),
    sendMessage: (tabId, message) => {
      if (tabId === options.unreachableTabId) {
        return Promise.reject(
          new Error("Could not establish connection. Receiving end does not exist."),
        );
      }
      sentMessages.push({ tabId, message });
      return Promise.resolve(undefined);
    },
  };
}
