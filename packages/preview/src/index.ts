import type { SourceLocation } from "@exemplarium/core";

export interface PreviewViewport {
  width: number;
  height: number;
  name: string;
}

export interface PreviewSelection {
  componentName?: string;
  source?: SourceLocation;
  tailwindClasses: string[];
}

export interface PreviewSession {
  id: string;
  routePath?: string;
  componentId?: string;
  viewport: PreviewViewport;
  selected?: PreviewSelection;
}
