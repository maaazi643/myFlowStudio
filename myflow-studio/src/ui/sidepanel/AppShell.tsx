import { useState } from "react";
import { Button, Tabs } from "@ui/components";
import type { TabItem } from "@ui/components";
import { useThemePreference } from "@ui/hooks/useThemePreference";
import type { ThemePreference } from "@ui/hooks/useThemePreference";
import pkg from "../../../package.json";
import { QueueView } from "./views/QueueView";
import { PromptsView } from "./views/PromptsView";
import { SettingsView } from "./views/SettingsView";
import { ProjectsView } from "./views/ProjectsView";
import { LogsView } from "./views/LogsView";
import { MonitorView } from "./views/MonitorView";
import { DeveloperView } from "./views/DeveloperView";
import styles from "./AppShell.module.css";

const TABS: TabItem[] = [
  { value: "queue", label: "Queue" },
  { value: "prompts", label: "Prompts" },
  { value: "settings", label: "Settings" },
  { value: "projects", label: "Projects" },
  { value: "logs", label: "Logs" },
  { value: "monitor", label: "Monitor" },
  { value: "developer", label: "Developer" },
];

const VIEWS: Record<string, () => React.JSX.Element> = {
  queue: QueueView,
  prompts: PromptsView,
  settings: SettingsView,
  projects: ProjectsView,
  logs: LogsView,
  monitor: MonitorView,
  developer: DeveloperView,
};

const NEXT_THEME: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const THEME_LABEL: Record<ThemePreference, string> = {
  system: "Auto",
  light: "Light",
  dark: "Dark",
};

export function AppShell() {
  const [activeTab, setActiveTab] = useState<string>("queue");
  const { theme, setTheme } = useThemePreference();
  const ActiveView = VIEWS[activeTab] ?? QueueView;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <p className="eyebrow">MyFlow Studio · v{pkg.version}</p>
          <h1>Automated Google Flow generation</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setTheme(NEXT_THEME[theme]);
          }}
          aria-label="Cycle theme preference"
        >
          {THEME_LABEL[theme]}
        </Button>
      </header>

      <nav className={styles.nav}>
        <Tabs items={TABS} value={activeTab} onChange={setActiveTab} aria-label="Studio sections" />
      </nav>

      <main className={styles.content}>
        {TABS.map((tab) => (
          <div
            key={tab.value}
            role="tabpanel"
            id={`tabpanel-${tab.value}`}
            aria-labelledby={`tab-${tab.value}`}
            hidden={tab.value !== activeTab}
          >
            {tab.value === activeTab ? <ActiveView /> : null}
          </div>
        ))}
      </main>
    </div>
  );
}
