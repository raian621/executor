import type {
  StepId,
  StepStatus,
  StepStatusResponse,
  Workflow,
  WorkflowId,
} from "@executor/types";
import { ExecutorClientError } from "./errors.js";

export interface ExecutorClientOptions {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
}

export class ExecutorClient {
  private readonly baseUrl: string;
  private readonly fetch: typeof globalThis.fetch;

  constructor(options: ExecutorClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.fetch = options.fetch ?? globalThis.fetch;
  }

  async createWorkflow(workflow: Workflow): Promise<void> {
    const res = await this.fetch(`${this.baseUrl}/api/v1/workflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflow }),
    });

    if (!res.ok) {
      const body = await this.parseBody(res);
      throw new ExecutorClientError(res.status, body);
    }
  }

  async getWorkflow(workflowId: WorkflowId): Promise<Workflow | null> {
    const res = await this.fetch(`${this.baseUrl}/api/v1/workflow`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId }),
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      const body = await this.parseBody(res);
      throw new ExecutorClientError(res.status, body);
    }

    const body = await this.parseBody(res) as { workflow: Workflow };
    return body.workflow;
  }

  async deleteWorkflow(workflowId: WorkflowId): Promise<void> {
    const res = await this.fetch(`${this.baseUrl}/api/v1/workflow`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId }),
    });

    if (!res.ok) {
      const body = await this.parseBody(res);
      throw new ExecutorClientError(res.status, body);
    }
  }

  async updateStepStatus(
    workflowId: WorkflowId,
    stepId: StepId,
    status: StepStatus,
  ): Promise<void> {
    const res = await this.fetch(`${this.baseUrl}/api/v1/workflow/step/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId, stepId, stepStatus: status }),
    });

    if (!res.ok) {
      const body = await this.parseBody(res);
      throw new ExecutorClientError(res.status, body);
    }
  }

  async getStepStatus(
    workflowId: WorkflowId,
    stepId: StepId,
  ): Promise<StepStatus | null> {
    const res = await this.fetch(`${this.baseUrl}/api/v1/workflow/step/status`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId, stepId }),
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      const body = await this.parseBody(res);
      throw new ExecutorClientError(res.status, body);
    }

    const body = await this.parseBody(res) as { stepStatus: StepStatus };
    return body.stepStatus;
  }

  async getStepStatuses(
    workflowId: WorkflowId,
    stepIds: StepId[],
  ): Promise<StepStatusResponse[] | null> {
    const res = await this.fetch(`${this.baseUrl}/api/v1/workflow/step/statuses`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId, stepIds }),
    });

    if (!res.ok) {
      const body = await this.parseBody(res);
      throw new ExecutorClientError(res.status, body);
    }

    const body = await this.parseBody(res) as {
      stepStatusList?: StepStatusResponse[];
      status?: string;
    };

    if (body.status === "Worlfow not found") {
      return null;
    }

    return body.stepStatusList ?? null;
  }

  async deleteStep(workflowId: WorkflowId, stepId: StepId): Promise<void> {
    const res = await this.fetch(`${this.baseUrl}/api/v1/workflow/step`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId, stepId }),
    });

    if (!res.ok) {
      const body = await this.parseBody(res);
      throw new ExecutorClientError(res.status, body);
    }
  }

  private async parseBody(res: Response): Promise<unknown> {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
}
