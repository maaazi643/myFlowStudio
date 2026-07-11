import { useStorageValue } from "@ui/hooks/useStorageValue";
import { automationStatusStorageKey } from "@shared/storage/automationStatusStorage";
import { AUTOMATION_ROLE_DEFINITIONS } from "@shared/automation/roles";
import { cssClass } from "@ui/utils/cssModule";
import styles from "./AutomationStatusBanner.module.css";

/**
 * Makes it impossible to miss whether automation can actually run — there
 * is no manual setup step and no simulated fallback, so this either shows
 * "Real — ready" or names exactly which required element the content
 * script's discovery engine couldn't find on the current page.
 */
export function AutomationStatusBanner() {
  const [status] = useStorageValue(automationStatusStorageKey);

  if (!status) {
    return (
      <div className={`${styles.banner} ${cssClass(styles.waiting)}`}>
        <strong>Automation: waiting for Google Flow</strong>
        <span className={styles.hint}>
          Open the Google Flow tab and keep it focused. MyFlow Studio automatically discovers the
          page elements it needs — there is nothing to configure.
        </span>
      </div>
    );
  }

  const missingRequired = AUTOMATION_ROLE_DEFINITIONS.filter(
    (definition) => definition.required && !status.roles[definition.role]?.found,
  );

  if (missingRequired.length === 0) {
    return (
      <div className={`${styles.banner} ${cssClass(styles.real)}`}>
        <strong>Automation: Real — ready</strong>
        <span className={styles.hint}>
          All required elements were found on the current page. Runs will drive the real Google
          Flow page.
        </span>
      </div>
    );
  }

  return (
    <div className={`${styles.banner} ${cssClass(styles.blocked)}`}>
      <strong>Automation: blocked</strong>
      <span className={styles.hint}>
        Couldn&rsquo;t find {missingRequired.map((definition) => definition.label).join(", ")} on
        this page. Make sure the Google Flow tab is open, fully loaded, and focused.
      </span>
      <ul className={styles.roleList}>
        {AUTOMATION_ROLE_DEFINITIONS.map((definition) => {
          const roleStatus = status.roles[definition.role];
          const found = roleStatus?.found ?? false;
          return (
            <li key={definition.role} className={found ? styles.roleFound : styles.roleMissing}>
              {definition.label}: {found ? "found" : "not found"}
              {definition.required ? "" : " (optional)"}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
