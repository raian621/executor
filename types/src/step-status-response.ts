import type { StepId, StepStatus } from "./step.js";

export interface StepStatusResponse {
  stepId: StepId,
  status: string,
  stepStatus?: StepStatus,
};
