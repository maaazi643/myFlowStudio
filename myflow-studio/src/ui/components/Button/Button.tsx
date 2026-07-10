import type { ButtonHTMLAttributes } from "react";
import { cssClass } from "@ui/utils/cssModule";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: cssClass(styles.primary),
  secondary: cssClass(styles.secondary),
  ghost: cssClass(styles.ghost),
  danger: cssClass(styles.danger),
};

const sizeClass: Record<ButtonSize, string> = {
  sm: cssClass(styles.sizeSm),
  md: cssClass(styles.sizeMd),
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  type = "button",
  className,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    variantClass[variant],
    sizeClass[size],
    fullWidth ? styles.fullWidth : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return <button type={type} className={classes} {...rest} />;
}
