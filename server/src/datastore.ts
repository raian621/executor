/** In-memory data store for workflow data */

import type {
  StepId,
  StepStatus,
  StepStatusResponse,
  Workflow,
  WorkflowId,
} from "@executor/types";

export class DataStore {
  // Initial snapshots of workflows; don't rely on statuses from the workflows
  // in this map
  workflows: Map<WorkflowId, Workflow>;
  stepStatuses: Map<WorkflowId, Map<StepId, StepStatus>>;

  constructor() {
    this.workflows = new Map<WorkflowId, Workflow>();
    this.stepStatuses = new Map<WorkflowId, Map<StepId, StepStatus>>();
  }

  addWorkflow(workflow: Workflow) {
    this.workflows.set(workflow.id, workflow);
  }

  getWorkflow(workflowId: WorkflowId): Workflow | null {
    return this.workflows.get(workflowId) ?? null;
  }

  deleteWorkflow(workflowId: WorkflowId, deleteSteps: boolean = true): boolean {
    if (!this.workflows.delete(workflowId)) {
      return false;
    }

    let deletedSteps = true;
    if (deleteSteps) {
      for (const [stepWorkflowId, stepStatuses] of this.stepStatuses) {
        if (stepWorkflowId !== workflowId) {
          continue;
        }
        for (const stepId of stepStatuses.keys()) {
          if (!stepStatuses.delete(stepId)) {
            deletedSteps = false;
          }
        }
      }
    }

    return deletedSteps;
  }

  updateStepStatus(workflowId: WorkflowId, stepId: StepId, status: StepStatus) {
    const stepStatuses = this.stepStatuses.getOrInsert(
      workflowId,
      new Map<StepId, StepStatus>(),
    );
    stepStatuses.set(stepId, status);
  }

  getStepStatus(workflowId: WorkflowId, stepId: StepId): StepStatus | null {
    const stepStatuses = this.stepStatuses.get(workflowId);
    if (stepStatuses === undefined) {
      return null;
    }
    return stepStatuses.get(stepId) ?? null;
  }

  deleteStepStatus(workflowId: WorkflowId, stepId: StepId): boolean {
    const stepStatuses = this.stepStatuses.get(workflowId);
    if (stepStatuses === undefined) {
      return false;
    }

    return stepStatuses.delete(stepId);
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
