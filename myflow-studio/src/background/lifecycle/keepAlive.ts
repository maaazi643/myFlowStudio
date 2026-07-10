import type { MessageRouter } from "../messaging/router";

const HEARTBEAT_ALARM_NAME = "myflow-studio-heartbeat";

/**
 * chrome.alarms only reliably honors periods >= 1 minute in a packed,
 * production extension (sub-minute periods are only ever honored for
 * unpacked/dev-mode extensions, and not dependably even then).
 *
 * This alarm is what will let a future milestone (M7's queue engine) wake
 * a terminated service worker and resume an in-flight run — for now it
 * just proves the wiring by broadcasting a HEARTBEAT event on every tick.
 */
const HEARTBEAT_PERIOD_MINUTES = 1;

export function startHeartbeat(router: MessageRouter): void {
  // create() with an existing name just re-arms it — simpler and just as
  // correct as a get-then-create check, and it means the alarm always
  // exists after every service worker wake rather than only on first ever
  // install.
  void chrome.alarms.create(HEARTBEAT_ALARM_NAME, { periodInMinutes: HEARTBEAT_PERIOD_MINUTES });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== HEARTBEAT_ALARM_NAME) {
      return;
    }
    router.broadcast({ type: "HEARTBEAT", firedAt: Date.now() });
  });
}
