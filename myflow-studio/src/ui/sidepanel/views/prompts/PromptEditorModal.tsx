import { useEffect, useMemo, useState } from "react";
import { Button, Field, Input, Modal, Textarea } from "@ui/components";
import { extractVariableNames, resolvePromptText } from "@shared/utils/promptVariables";
import { ReferencePicker } from "./ReferencePicker";
import styles from "./PromptEditorModal.module.css";

export interface PromptEditorModalProps {
  open: boolean;
  initialText: string;
  initialVariables: Record<string, string> | undefined;
  initialReferenceImageIds: string[] | undefined;
  onClose: () => void;
  onSave: (
    text: string,
    variables: Record<string, string> | undefined,
    referenceImageIds: string[] | undefined,
  ) => void;
}

export function PromptEditorModal({
  open,
  initialText,
  initialVariables,
  initialReferenceImageIds,
  onClose,
  onSave,
}: PromptEditorModalProps) {
  const [text, setText] = useState(initialText);
  const [variables, setVariables] = useState<Record<string, string>>(initialVariables ?? {});
  const [referenceImageIds, setReferenceImageIds] = useState<string[]>(
    initialReferenceImageIds ?? [],
  );

  useEffect(() => {
    if (open) {
      setText(initialText);
      setVariables(initialVariables ?? {});
      setReferenceImageIds(initialReferenceImageIds ?? []);
    }
  }, [open, initialText, initialVariables, initialReferenceImageIds]);

  const variableNames = useMemo(() => extractVariableNames(text), [text]);
  const resolved = useMemo(() => resolvePromptText(text, variables), [text, variables]);

  function handleSave(): void {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    const relevant = Object.fromEntries(
      variableNames
        .filter((name) => variables[name])
        .map((name) => [name, variables[name] as string]),
    );
    onSave(
      trimmed,
      Object.keys(relevant).length > 0 ? relevant : undefined,
      referenceImageIds.length > 0 ? referenceImageIds : undefined,
    );
    onClose();
  }

  return (
    <Modal open={open} title={initialText ? "Edit prompt" : "Add prompt"} onClose={onClose}>
      <div className={styles.body}>
        <Textarea
          label="Prompt text"
          rows={4}
          value={text}
          placeholder="A neon jellyfish over Tokyo at night, {{style}}"
          onChange={(event) => {
            setText(event.target.value);
          }}
        />

        {variableNames.length > 0 ? (
          <div className={styles.variables}>
            <span className={styles.variablesLabel}>Variables</span>
            {variableNames.map((name) => (
              <Input
                key={name}
                label={name}
                value={variables[name] ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setVariables((current) => ({ ...current, [name]: value }));
                }}
              />
            ))}
          </div>
        ) : null}

        <ReferencePicker selectedIds={referenceImageIds} onChange={setReferenceImageIds} />

        <Field label="Preview">
          <p className={styles.preview}>{resolved || "—"}</p>
        </Field>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!text.trim()}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
