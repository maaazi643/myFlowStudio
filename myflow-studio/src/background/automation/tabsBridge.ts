/**
 * The subset of chrome.tabs the automation executor actually uses, narrowed
 * to our own interface so tests can supply a plain fake instead of mocking
 * the ambient chrome global — same pattern as PortLike/StorageArea.
 */
export interface ActiveTabInfo {
  id: number;
  title?: string | undefined;
  url?: string | undefined;
}

export interface TabsLike {
  queryActiveTab(): Promise<ActiveTabInfo | undefined>;
  sendMessage(tabId: number, message: unknown): Promise<unknown>;
}

export function createChromeTabsBridge(): TabsLike {
  return {
    async queryActiveTab() {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id === undefined) {
        return undefined;
      }
      return { id: tab.id, title: tab.title, url: tab.url };
    },
    sendMessage: (tabId, message) => chrome.tabs.sendMessage(tabId, message),
  };
}
