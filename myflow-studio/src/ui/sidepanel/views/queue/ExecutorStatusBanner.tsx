import { useSelectorRegistry } from "@ui/hooks/useSelectorRegistry";
import { isRegistryComplete, missingRequiredRoles } from "@shared/devtools/registry";
import { getRoleDefinition } from "@shared/devtools/roles";
import { cssClass } from "@ui/utils/cssModule";
import styles from "./ExecutorStatusBanner.module.css";

/**
 * Makes it impossible to miss which executor the queue will actually use —
 * without this, a run against an incomplete selector registry silently
 * falls back to the simulated placeholder: the queue shows "Completed" but
 * nothing happens on the real page, with no visible explanation why.
 */
export function ExecutorStatusBanner() {
  const { registry } = useSelectorRegistry();
  const complete = isRegistryComplete(registry);

  if (complete) {
    return (
      <div className={`${styles.banner} ${cssClass(styles.real)}`}>
        <strong>Automation: Real</strong>
        <span className={styles.hint}>Runs will drive the captured Google Flow page.</span>
      </div>
    );
  }

  const missing = missingRequiredRoles(registry);
  return (
    <div className={`${styles.banner} ${cssClass(styles.simulated)}`}>
      <strong>Automation: Simulated</strong>
      <span className={styles.hint}>
        Nothing happens on the real page yet — capture{" "}
        {missing.map((role) => getRoleDefinition(role).label).join(", ")} in Developer Mode to
        enable real automation.
      </span>
    </div>
  );
}
