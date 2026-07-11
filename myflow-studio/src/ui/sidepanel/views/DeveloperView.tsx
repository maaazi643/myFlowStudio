import { Badge } from "@ui/components";
import { useDevCapture } from "@ui/hooks/useDevCapture";
import { useSelectorRegistry } from "@ui/hooks/useSelectorRegistry";
import { CAPTURABLE_ROLES } from "@shared/devtools/roles";
import {
  capturedRoleCount,
  isRegistryComplete,
  missingRequiredRoles,
} from "@shared/devtools/registry";
import { getRoleDefinition } from "@shared/devtools/roles";
import { CaptureRow } from "./devMode/CaptureRow";
import styles from "./DeveloperView.module.css";

export function DeveloperView() {
  const { activeRole, starting, error, start, cancel } = useDevCapture();
  const { registry, clearSelector } = useSelectorRegistry();

  const total = CAPTURABLE_ROLES.length;
  const capturedCount = capturedRoleCount(registry);
  const complete = isRegistryComplete(registry);
  const missing = missingRequiredRoles(registry);

  return (
    <div className={styles.wrap}>
      <p className={styles.intro}>
        Developer Mode captures the real Google Flow page elements the automation engine needs —
        nothing is guessed or hardcoded. Open the Google Flow tab, make sure it&apos;s the active
        tab, then click Capture and click the matching element on the page.
      </p>

      <div className={styles.status}>
        <Badge tone={complete ? "success" : "warning"}>
          {String(capturedCount)} of {String(total)} captured
        </Badge>
        {!complete ? (
          <span className={styles.missing}>
            Required for automation:{" "}
            {missing.map((role) => getRoleDefinition(role).label).join(", ")}
          </span>
        ) : null}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.list}>
        {CAPTURABLE_ROLES.map((definition) => (
          <CaptureRow
            key={definition.role}
            definition={definition}
            captured={registry[definition.role]}
            waiting={activeRole === definition.role}
            disabled={starting || (activeRole !== null && activeRole !== definition.role)}
            onCapture={() => {
              void start(definition.role);
            }}
            onCancel={cancel}
            onClear={() => {
              clearSelector(definition.role);
            }}
          />
        ))}
      </div>
    </div>
  );
}
