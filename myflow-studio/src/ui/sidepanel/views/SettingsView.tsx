import { useMemo } from "react";
import type { ReactNode } from "react";
import { Field, Input, Select, SegmentedControl, Toggle } from "@ui/components";
import { useGenerationSettings } from "@ui/hooks/useGenerationSettings";
import {
  SPEED_PROFILES,
  IMAGES_PER_PROMPT_OPTIONS,
  ASPECT_RATIOS,
  MODELS,
  QUALITY_OPTIONS,
} from "@shared/config";
import type { ImagesPerPrompt } from "@shared/config";
import { validateGenerationSettings } from "@shared/utils/validators/generationSettingsValidator";
import type { GenerationSettings } from "@shared/types/generationSettings";
import { FilenamePreview } from "./FilenamePreview";
import styles from "./SettingsView.module.css";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  );
}

export function SettingsView() {
  const [settings, setSettings] = useGenerationSettings();
  const validation = useMemo(() => validateGenerationSettings(settings), [settings]);

  function update<K extends keyof GenerationSettings>(key: K, value: GenerationSettings[K]): void {
    setSettings({ ...settings, [key]: value });
  }

  const selectedSpeed = SPEED_PROFILES.find((profile) => profile.id === settings.speedProfileId);

  return (
    <div className={styles.wrap}>
      <Section title="Generation">
        <Field
          label="Speed"
          hint={selectedSpeed?.description}
          error={validation.errors.speedProfileId}
        >
          <SegmentedControl
            aria-label="Generation speed"
            value={settings.speedProfileId}
            onChange={(value) => {
              update("speedProfileId", value);
            }}
            options={SPEED_PROFILES.map((profile) => ({ value: profile.id, label: profile.label }))}
          />
        </Field>

        <Field label="Images per prompt" error={validation.errors.imagesPerPrompt}>
          <SegmentedControl
            aria-label="Images per prompt"
            value={String(settings.imagesPerPrompt)}
            onChange={(value) => {
              update("imagesPerPrompt", Number(value) as ImagesPerPrompt);
            }}
            options={IMAGES_PER_PROMPT_OPTIONS.map((count) => ({
              value: String(count),
              label: `x${String(count)}`,
            }))}
          />
        </Field>
      </Section>

      <Section title="Model & quality">
        <Field label="Aspect ratio" error={validation.errors.aspectRatioId}>
          <Select
            aria-label="Aspect ratio"
            value={settings.aspectRatioId}
            onChange={(event) => {
              update("aspectRatioId", event.target.value);
            }}
            options={ASPECT_RATIOS.map((ratio) => ({ value: ratio.id, label: ratio.label }))}
          />
        </Field>

        <Field label="Model" error={validation.errors.modelId}>
          <Select
            aria-label="Model"
            value={settings.modelId}
            onChange={(event) => {
              update("modelId", event.target.value);
            }}
            options={MODELS.map((model) => ({ value: model.id, label: model.label }))}
          />
        </Field>

        <Field label="Image quality" error={validation.errors.qualityId}>
          <Select
            aria-label="Image quality"
            value={settings.qualityId}
            onChange={(event) => {
              update("qualityId", event.target.value);
            }}
            options={QUALITY_OPTIONS.map((quality) => ({
              value: quality.id,
              label: quality.label,
            }))}
          />
        </Field>
      </Section>

      <Section title="Output">
        <Toggle
          label="Auto download"
          hint="Automatically download every completed image. When off, the queue still continues — images are just left in Flow for manual review."
          checked={settings.autoDownload}
          onChange={(checked) => {
            update("autoDownload", checked);
          }}
        />

        <div className={styles.row}>
          <Input
            label="Start number"
            type="number"
            min={0}
            step={1}
            value={settings.startNumber}
            error={validation.errors.startNumber}
            onChange={(event) => {
              update("startNumber", Number(event.target.value));
            }}
          />
          <Input
            label="Padding"
            type="number"
            min={1}
            max={8}
            step={1}
            value={settings.numberPadding}
            error={validation.errors.numberPadding}
            onChange={(event) => {
              update("numberPadding", Number(event.target.value));
            }}
          />
        </div>

        <Field label="Filename">
          <Select
            aria-label="Filename template"
            value={settings.filenameTemplate}
            onChange={(event) => {
              update(
                "filenameTemplate",
                event.target.value as GenerationSettings["filenameTemplate"],
              );
            }}
            options={[
              { value: "numbered", label: "Number only" },
              { value: "numbered-prompt", label: "Number + prompt" },
            ]}
          />
        </Field>

        <Field label="Preview">
          <FilenamePreview
            startNumber={settings.startNumber}
            padding={settings.numberPadding}
            template={settings.filenameTemplate}
          />
        </Field>
      </Section>
    </div>
  );
}
