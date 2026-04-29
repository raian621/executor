import { describe, it, expect } from "bun:test";
import { ExecutorClient } from "./client";
import { ExecutorClientError } from "./errors";
import { StepStatus, type Workflow } from "@executor/types";

const BASE_URL = "http://localhost:12345";

function createMockFetch(
  responses: Array<{ status: number; body: unknown; expectedRequest?: { method: string; url: string; body?: unknown } }>,
): typeof fetch {
  let callIndex = 0;
  return (async (...args: Parameters<typeof fetch>) => {
    const [input, init] = args;
    const current = responses[callIndex];
    if (!current) {
      throw new Error(`Unexpected fetch call #${callIndex}`);
    }

    if (current.expectedRequest) {
      const url = input.toString();
      expect(url).toBe(current.expectedRequest.url);
      expect(init?.method).toBe(current.expectedRequest.method);
      if (current.expectedRequest.body) {
        expect(JSON.parse(init?.body as string)).toEqual(current.expectedRequest.body);
      }
    }

    callIndex++;
    return new Response(JSON.stringify(current.body), {
      status: current.status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}

describe("ExecutorClient", () => {
  describe("createWorkflow", () => {
    it("should POST workflow and return on success", async () => {
      const workflow: Workflow = {
        id: "wf-1",
        name: "Test Workflow",
        failFast: false,
        steps: [],
      };

      const mockFetch = createMockFetch([
        {
          status: 200,
          body: { status: "Successfully stored workflow data" },
          expectedRequest: {
            method: "POST",
            url: `${BASE_URL}/api/v1/workflow`,
            body: { workflow },
          },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      await client.createWorkflow(workflow);
    });

    it("should throw ExecutorClientError on non-2xx", async () => {
      const workflow: Workflow = {
        id: "wf-1",
        name: "Test Workflow",
        failFast: false,
        steps: [],
      };

      const mockFetch = createMockFetch([
        {
          status: 500,
          body: { status: "Internal server error" },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      await expect(client.createWorkflow(workflow)).rejects.toThrow(ExecutorClientError);
    });
  });

  describe("getWorkflow", () => {
    it("should return workflow on success", async () => {
      const workflow: Workflow = {
        id: "wf-1",
        name: "Test Workflow",
        failFast: false,
        steps: [],
      };

      const mockFetch = createMockFetch([
        {
          status: 200,
          body: { workflow },
          expectedRequest: {
            method: "GET",
            url: `${BASE_URL}/api/v1/workflow`,
            body: { workflowId: "wf-1" },
          },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      const result = await client.getWorkflow("wf-1");
      expect(result).toEqual(workflow);
    });

    it("should return null for 404", async () => {
      const mockFetch = createMockFetch([
        {
          status: 404,
          body: { status: "Workflow not found" },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      const result = await client.getWorkflow("missing");
      expect(result).toBeNull();
    });

    it("should throw on other errors", async () => {
      const mockFetch = createMockFetch([
        {
          status: 500,
          body: { status: "Internal server error" },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      await expect(client.getWorkflow("wf-1")).rejects.toThrow(ExecutorClientError);
    });
  });

  describe("deleteWorkflow", () => {
    it("should DELETE workflow and return on success", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: { status: "Workflow successfully deleted" },
          expectedRequest: {
            method: "DELETE",
            url: `${BASE_URL}/api/v1/workflow`,
            body: { workflowId: "wf-1" },
          },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      await client.deleteWorkflow("wf-1");
    });

    it("should throw ExecutorClientError on 404", async () => {
      const mockFetch = createMockFetch([
        {
          status: 404,
          body: { status: "Workflow not found" },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      await expect(client.deleteWorkflow("missing")).rejects.toThrow(ExecutorClientError);
    });
  });

  describe("updateStepStatus", () => {
    it("should POST step status update and return on success", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: { status: "Successfully updated step status" },
          expectedRequest: {
            method: "POST",
            url: `${BASE_URL}/api/v1/workflow/step/status`,
            body: { workflowId: "wf-1", stepId: "step-1", stepStatus: StepStatus.Running },
          },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      await client.updateStepStatus("wf-1", "step-1", StepStatus.Running);
    });

    it("should throw on non-2xx", async () => {
      const mockFetch = createMockFetch([
        {
          status: 500,
          body: { status: "Internal server error" },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      await expect(
        client.updateStepStatus("wf-1", "step-1", StepStatus.Failed),
      ).rejects.toThrow(ExecutorClientError);
    });
  });

  describe("getStepStatus", () => {
    it("should return step status on success", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: { stepStatus: StepStatus.Finished },
          expectedRequest: {
            method: "GET",
            url: `${BASE_URL}/api/v1/workflow/step/status`,
            body: { workflowId: "wf-1", stepId: "step-1" },
          },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      const result = await client.getStepStatus("wf-1", "step-1");
      expect(result).toBe(StepStatus.Finished);
    });

    it("should return null for 404", async () => {
      const mockFetch = createMockFetch([
        {
          status: 404,
          body: { status: "Step not found" },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      const result = await client.getStepStatus("wf-1", "missing");
      expect(result).toBeNull();
    });

    it("should throw on other errors", async () => {
      const mockFetch = createMockFetch([
        {
          status: 500,
          body: { status: "Internal server error" },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      await expect(client.getStepStatus("wf-1", "step-1")).rejects.toThrow(ExecutorClientError);
    });
  });

  describe("getStepStatuses", () => {
    it("should return step status list on success (all found)", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: {
            stepStatusList: [
              { status: "FOUND", stepId: "step-1", stepStatus: StepStatus.Finished },
              { status: "FOUND", stepId: "step-2", stepStatus: StepStatus.Failed },
            ],
          },
          expectedRequest: {
            method: "GET",
            url: `${BASE_URL}/api/v1/workflow/step/statuses`,
            body: { workflowId: "wf-1", stepIds: ["step-1", "step-2"] },
          },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      const result = await client.getStepStatuses("wf-1", ["step-1", "step-2"]);
      expect(result).toEqual([
        { status: "FOUND", stepId: "step-1", stepStatus: StepStatus.Finished },
        { status: "FOUND", stepId: "step-2", stepStatus: StepStatus.Failed },
      ]);
    });

    it("should return step status list on 207 (partial)", async () => {
      const mockFetch = createMockFetch([
        {
          status: 207,
          body: {
            stepStatusList: [
              { status: "FOUND", stepId: "step-1", stepStatus: StepStatus.Finished },
              { status: "NOT_FOUND", stepId: "missing-step" },
            ],
          },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      const result = await client.getStepStatuses("wf-1", ["step-1", "missing-step"]);
      expect(result).toEqual([
        { status: "FOUND", stepId: "step-1", stepStatus: StepStatus.Finished },
        { status: "NOT_FOUND", stepId: "missing-step" },
      ]);
    });

    it("should return null when workflow not found", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: { status: "Worlfow not found" },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      const result = await client.getStepStatuses("missing", ["step-1"]);
      expect(result).toBeNull();
    });

    it("should throw on non-2xx (excluding 207)", async () => {
      const mockFetch = createMockFetch([
        {
          status: 500,
          body: { status: "Internal server error" },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      await expect(client.getStepStatuses("wf-1", ["step-1"])).rejects.toThrow(ExecutorClientError);
    });
  });

  describe("deleteStep", () => {
    it("should DELETE step and return on success", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: { status: "Step successfully deleted" },
          expectedRequest: {
            method: "DELETE",
            url: `${BASE_URL}/api/v1/workflow/step`,
            body: { workflowId: "wf-1", stepId: "step-1" },
          },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      await client.deleteStep("wf-1", "step-1");
    });

    it("should throw ExecutorClientError on 404", async () => {
      const mockFetch = createMockFetch([
        {
          status: 404,
          body: { status: "Step not found" },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      await expect(client.deleteStep("wf-1", "missing")).rejects.toThrow(ExecutorClientError);
    });
  });

  describe("baseUrl trailing slash", () => {
    it("should handle baseUrl with trailing slash", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: { workflow: null },
          expectedRequest: {
            method: "GET",
            url: `${BASE_URL}/api/v1/workflow`,
          },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: `${BASE_URL}/`, fetch: mockFetch });
      await client.getWorkflow("wf-1");
    });
  });

  describe("ExecutorClientError", () => {
    it("should expose status and responseBody", async () => {
      const mockFetch = createMockFetch([
        {
          status: 404,
          body: { status: "Workflow not found" },
        },
      ]);

      const client = new ExecutorClient({ baseUrl: BASE_URL, fetch: mockFetch });
      try {
        await client.deleteWorkflow("missing");
        expect(true).toBe(false); // Should not reach here
      } catch (err) {
        expect(err).toBeInstanceOf(ExecutorClientError);
        const error = err as ExecutorClientError;
        expect(error.status).toBe(404);
        expect(error.responseBody).toEqual({ status: "Workflow not found" });
        expect(error.message).toBe("ExecutorClient request failed with status 404");
      }
    });
  });
});
