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

  deleteWorkflow(workflowId: WorkflowId, deleteSteps: boolean = true) {
    this.workflows.delete(workflowId);
    if (deleteSteps) {
      this.stepStatuses.keys().forEach(([stepWorkflowId, stepId]) => {
        if (stepWorkflowId === workflowId) {
          this.deleteStepStatus(workflowId, stepId);
        }
      })
    }
  }

  updateStepStatus(workflowId: WorkflowId, stepId: StepId, status: StepStatus) {
    this.stepStatuses.set([workflowId, stepId], status);
  }

  getStepStatus(workflowId: WorkflowId, stepId: StepId): StepStatus | null {
    return this.stepStatuses.get([workflowId, stepId]) || null;
  }

  deleteStepStatus(workflowId: WorkflowId, stepId: StepId) {
    this.stepStatuses.delete([workflowId, stepId]);
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
