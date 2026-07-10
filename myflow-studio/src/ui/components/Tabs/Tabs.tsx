import { useRef } from "react";
import type { KeyboardEvent } from "react";
import styles from "./Tabs.module.css";

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  "aria-label": string;
}

export function Tabs({ items, value, onChange, "aria-label": ariaLabel }: TabsProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function focusAndSelect(index: number) {
    const wrapped = (index + items.length) % items.length;
    const item = items[wrapped];
    if (!item) {
      return;
    }
    buttonRefs.current[wrapped]?.focus();
    onChange(item.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAndSelect(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAndSelect(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAndSelect(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAndSelect(items.length - 1);
    }
  }

  return (
    <div className={styles.tablist} role="tablist" aria-label={ariaLabel}>
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${item.value}`}
            aria-controls={`tabpanel-${item.value}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={selected ? `${styles.tab} ${styles.tabSelected}` : styles.tab}
            onClick={() => {
              onChange(item.value);
            }}
            onKeyDown={(event) => {
              handleKeyDown(event, index);
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
