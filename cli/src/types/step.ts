import type { Verification } from "./verification";
import type { WorkflowId } from "./workflow";

export type StepId = string;

export interface Step {
  name: string;
  id: StepId;
  workflowId: WorkflowId;
  commands?: string[];
  workflowRun?: WorkflowId;
  needs?: StepId[];
  retries?: number;
  onRetry?: Step;
  onFailure?: Step;
  onSuccess?: Step;
  status: StepStatus;
  verification?: Verification
}

export enum StepStatus {
  Pending, Running, Retrying, Failed, Finished, NeedsVerification
}
