/** In-memory data store for workflow data */

import type {
  StepId,
  StepStatus,
  StepStatusResponse,
  Workflow,
  WorkflowId,
} from "@executor/types";

export class DataStore {
  workflows: Map<WorkflowId, Workflow>;
  stepStatuses: Map<[WorkflowId, StepId], StepStatus>;

  constructor() {
    this.workflows = new Map<WorkflowId, Workflow>();
    this.stepStatuses = new Map<[WorkflowId, StepId], StepStatus>();
  }

  addWorkflow(workflow: Workflow) {
    this.workflows.set(workflow.id, workflow);
  }

  getWorkflow(workflowId: WorkflowId): Workflow | null {
    return this.workflows.get(workflowId) || null;
  }

  updateStepStatus(workflowId: WorkflowId, stepId: StepId, status: StepStatus) {
    this.stepStatuses.set([workflowId, stepId], status);
  }

  getStepStatus(workflowId: WorkflowId, stepId: StepId): StepStatus | null {
    return this.stepStatuses.get([workflowId, stepId]) || null;
  }

  getStepStatuses(
    workflowId: WorkflowId,
    stepIds: StepId[],
  ): StepStatusResponse[] | null {
    if (!this.workflows.has(workflowId)) {
      return null;
    }

    return stepIds.map((stepId) => {
      const stepStatus = this.getStepStatus(workflowId, stepId);

      if (stepStatus === null) {
        return { status: "NOT_FOUND", stepId };
      }

      return { status: "FOUND", stepId, stepStatus };
    });
  }
}
