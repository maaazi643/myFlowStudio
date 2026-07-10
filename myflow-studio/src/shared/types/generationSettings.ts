export type FilenameTemplateId = "numbered" | "numbered-prompt";

export interface GenerationSettings {
  speedProfileId: string;
  imagesPerPrompt: number;
  aspectRatioId: string;
  modelId: string;
  qualityId: string;
  autoDownload: boolean;
  startNumber: number;
  numberPadding: number;
  filenameTemplate: FilenameTemplateId;
}
