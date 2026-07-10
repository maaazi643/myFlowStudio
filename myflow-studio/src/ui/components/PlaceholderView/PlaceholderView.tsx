import styles from "./PlaceholderView.module.css";

export interface PlaceholderViewProps {
  milestone: string;
  title: string;
  description: string;
}

export function PlaceholderView({ milestone, title, description }: PlaceholderViewProps) {
  return (
    <div className={styles.wrap}>
      <span className={styles.milestone}>{milestone}</span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
