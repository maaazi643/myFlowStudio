import { useQueueState } from "@ui/hooks/useQueueState";
import { useQueueHistory } from "@ui/hooks/useQueueHistory";
import { QueueControls } from "./queue/QueueControls";
import { QueueProgress } from "./queue/QueueProgress";
import { QueueItemRow } from "./queue/QueueItemRow";
import { QueueHistory } from "./queue/QueueHistory";
import styles from "./QueueView.module.css";

export function QueueView() {
  const {
    run,
    error,
    starting,
    start,
    pause,
    resume,
    stop,
    skipCurrent,
    retryItem,
    retryAllFailed,
  } = useQueueState();
  const history = useQueueHistory(run?.status);

  return (
    <div className={styles.wrap}>
      {error ? <p className={styles.error}>{error}</p> : null}

      <QueueControls
        run={run}
        starting={starting}
        onStart={() => {
          void start();
        }}
        onPause={pause}
        onResume={resume}
        onStop={stop}
        onSkip={skipCurrent}
        onRetryAllFailed={retryAllFailed}
      />

      {run ? (
        <>
          <QueueProgress run={run} />
          <div className={styles.list}>
            {run.items.map((item, index) => (
              <QueueItemRow
                key={item.id}
                item={item}
                index={index}
                onRetry={() => {
                  retryItem(item.id);
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <p className={styles.empty}>
          No run in progress. Import prompts, check Settings, then hit Start.
        </p>
      )}

      <QueueHistory runs={history} />
    </div>
  );
}
