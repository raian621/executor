import type { Step } from "./step.js";

export type WorkflowId = string;

export interface Workflow {
  name: string;
  id: WorkflowId;
  failFast: boolean;
  steps: Step[];
}
