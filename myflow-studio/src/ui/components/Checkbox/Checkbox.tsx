import styles from "./Checkbox.module.css";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  "aria-label": string;
}

export function Checkbox({ checked, onChange, "aria-label": ariaLabel }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={styles.checkbox}
      checked={checked}
      aria-label={ariaLabel}
      onChange={(event) => {
        onChange(event.target.checked);
      }}
    />
  );
}
