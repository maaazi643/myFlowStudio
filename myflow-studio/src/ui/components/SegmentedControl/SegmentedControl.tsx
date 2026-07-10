import { cssClass } from "@ui/utils/cssModule";
import styles from "./SegmentedControl.module.css";

export interface SegmentedOption<TValue extends string> {
  value: TValue;
  label: string;
}

export interface SegmentedControlProps<TValue extends string> {
  options: SegmentedOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  "aria-label": string;
}

export function SegmentedControl<TValue extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
}: SegmentedControlProps<TValue>) {
  return (
    <div className={styles.group} role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={[styles.segment, selected ? cssClass(styles.segmentSelected) : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => {
              onChange(option.value);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
