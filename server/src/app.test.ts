import { it, expect, describe, beforeEach } from "bun:test";
import { type Express } from "express";
import { DataStore } from "./datastore";
import { createApp } from "./app";
import request from "supertest";
import { StepStatus, type Workflow } from "@executor/types";
import path from "path";

const BASE_API_PATH = "/api/v1";

function getWorkflow(): Workflow {
  return {
    id: "workflow-id",
    name: "Workflow",
    failFast: false,
    steps: [],
  };
}

describe("/workflow", () => {
  let app: Express;
  let datastore: DataStore;
  const API_PATH = path.join(BASE_API_PATH, "/workflow");

  beforeEach(() => {
    datastore = new DataStore();
    app = createApp(datastore);
  });

  describe("POST", () => {
    it("should write workflow to datastore", async () => {
      const workflow: Workflow = {
        id: "workflow-id",
        name: "Workflow",
        failFast: false,
        steps: [],
      };

      const expectedStatus = { status: "Successfully stored workflow data" };

      const res = await request(app)
        .post(API_PATH)
        .send({ workflow })
        .expect(200);

      expect(res.body).toEqual(expectedStatus);
      expect(datastore.getWorkflow(workflow.id)).toEqual(workflow);
    });

    it("should overwrite workflow in datastore with same ID", async () => {
      const workflow: Workflow = getWorkflow();
      const expectedStatus = { status: "Successfully stored workflow data" };

      let res = await request(app)
        .post(API_PATH)
        .send({ workflow })
        .expect(200);
      expect(res.body).toEqual(expectedStatus);
      expect(datastore.getWorkflow(workflow.id)).toEqual(workflow);

      workflow.failFast = true;
      res = await request(app).post(API_PATH).send({ workflow }).expect(200);

      expect(res.body).toEqual(expectedStatus);
      expect(datastore.getWorkflow(workflow.id)).toEqual(workflow);
    });

    it("should write step statuses", async () => {
      const workflow = getWorkflow();
      workflow.steps = [
        {
          id: "step-1",
          name: "Step 1",
          status: StepStatus.Pending,
          workflowId: workflow.id,
        },
        {
          id: "step-2",
          name: "Step 2",
          status: StepStatus.Failed,
          workflowId: workflow.id,
        },
      ];
      const res = await request(app)
        .post(API_PATH)
        .send({ workflow })
        .expect(200);
      expect(res.body).toEqual({
        status: "Successfully stored workflow data",
      });
      workflow.steps.forEach((step) =>
        expect(
          datastore.getStepStatus(workflow.id, step.id),
          `Step ID ${step.id} not found`,
        ).toEqual(step.status),
      );
    });
  });

  describe("GET", () => {
    it("should return stored workflow", async () => {
      const workflow = getWorkflow();
      datastore.addWorkflow(workflow);
      const res = await request(app)
        .get(API_PATH)
        .send({ workflowId: workflow.id })
        .expect(200);
      expect(res.body).toEqual({ workflow });
    });

    it("should return error for missing workflow", async () => {
      const res = await request(app)
        .get(API_PATH)
        .send({ workflowId: "workflow-id" })
        .expect(404);
      expect(res.body).toEqual({ status: "Workflow not found" });
    });
  });

  describe("DELETE", () => {
    it("should return success status if workflow exists", async () => {
      const workflow = getWorkflow();
      datastore.addWorkflow(workflow);
      const res = await request(app)
        .delete(API_PATH)
        .send({ workflowId: workflow.id })
        .expect(200);
      expect(res.body).toEqual({ status: "Workflow successfully deleted" });
    });

    it("should return error if workflow does not exist", async () => {
      const res = await request(app)
        .delete(API_PATH)
        .send({ workflowId: "workflow-id" })
        .expect(404);
      expect(res.body).toEqual({ status: "Workflow not found" });
    });

    it("should delete all steps belonging to the workflow", async () => {
      const workflow: Workflow = {
        ...getWorkflow(),
        steps: [
          {
            id: "step-1",
            name: "Step 1",
            status: StepStatus.Pending,
            workflowId: "workflow-id",
          },
          {
            id: "step-2",
            name: "Step 2",
            status: StepStatus.Running,
            workflowId: "workflow-id",
          },
        ],
      };
      datastore.addWorkflow(workflow);
      await request(app)
        .delete(API_PATH)
        .send({ workflowId: workflow.id })
        .expect(200);

      expect(datastore.getStepStatus(workflow.id, "step-1")).toBeNull();
      expect(datastore.getStepStatus(workflow.id, "step-2")).toBeNull();
    });
  });
});

describe("/workflow/step/status", () => {
  let app: Express;
  let datastore: DataStore;
  const API_PATH = path.join(BASE_API_PATH, "/workflow/step/status");

  beforeEach(() => {
    datastore = new DataStore();
    app = createApp(datastore);
  });

  describe("POST", () => {
    it("should update step status", async () => {
      const workflow = getWorkflow();
      datastore.addWorkflow(workflow);

      const res = await request(app)
        .post(API_PATH)
        .send({ workflowId: workflow.id, stepId: "step-1", stepStatus: StepStatus.Running })
        .expect(200);

      expect(res.body).toEqual({ status: "Successfully updated step status" });
      expect(datastore.getStepStatus(workflow.id, "step-1")).toEqual(StepStatus.Running);
    });
  });

  describe("GET", () => {
    it("should return step status", async () => {
      const workflow = getWorkflow();
      datastore.addWorkflow(workflow);
      datastore.updateStepStatus(workflow.id, "step-1", StepStatus.Finished);

      const res = await request(app)
        .get(API_PATH)
        .send({ workflowId: workflow.id, stepId: "step-1" })
        .expect(200);

      expect(res.body).toEqual({ stepStatus: StepStatus.Finished });
    });

    it("should return error for missing step", async () => {
      const workflow = getWorkflow();
      datastore.addWorkflow(workflow);

      const res = await request(app)
        .get(API_PATH)
        .send({ workflowId: workflow.id, stepId: "nonexistent-step" })
        .expect(404);

      expect(res.body).toEqual({ status: "Step not found" });
    });
  });
});

describe("/workflow/step/statuses", () => {
  let app: Express;
  let datastore: DataStore;
  const API_PATH = path.join(BASE_API_PATH, "/workflow/step/statuses");

  beforeEach(() => {
    datastore = new DataStore();
    app = createApp(datastore);
  });

  describe("GET", () => {
    it("should return multiple step statuses", async () => {
      const workflow = getWorkflow();
      datastore.addWorkflow(workflow);
      datastore.updateStepStatus(workflow.id, "step-1", StepStatus.Finished);
      datastore.updateStepStatus(workflow.id, "step-2", StepStatus.Failed);

      const res = await request(app)
        .get(API_PATH)
        .send({ workflowId: workflow.id, stepIds: ["step-1", "step-2"] })
        .expect(200);

      expect(res.body).toEqual({
        stepStatusList: [
          { status: "FOUND", stepId: "step-1", stepStatus: StepStatus.Finished },
          { status: "FOUND", stepId: "step-2", stepStatus: StepStatus.Failed },
        ],
      });
    });

    it("should return partial results for missing steps with 207 status", async () => {
      const workflow = getWorkflow();
      datastore.addWorkflow(workflow);
      datastore.updateStepStatus(workflow.id, "step-1", StepStatus.Finished);

      const res = await request(app)
        .get(API_PATH)
        .send({ workflowId: workflow.id, stepIds: ["step-1", "nonexistent-step"] })
        .expect(207);

      expect(res.body).toEqual({
        stepStatusList: [
          { status: "FOUND", stepId: "step-1", stepStatus: StepStatus.Finished },
          { status: "NOT_FOUND", stepId: "nonexistent-step" },
        ],
      });
    });

    it("should return error for missing workflow", async () => {
      const res = await request(app)
        .get(API_PATH)
        .send({ workflowId: "nonexistent-workflow", stepIds: ["step-1"] })
        .expect(200);

      expect(res.body).toEqual({ status: "Worlfow not found" });
    });
  });
});

describe("/workflow/step", () => {
  let app: Express;
  let datastore: DataStore;
  const API_PATH = path.join(BASE_API_PATH, "/workflow/step");

  beforeEach(() => {
    datastore = new DataStore();
    app = createApp(datastore);
  });

  describe("DELETE", () => {
    it("should delete step status", async () => {
      const workflow = getWorkflow();
      datastore.addWorkflow(workflow);
      datastore.updateStepStatus(workflow.id, "step-1", StepStatus.Running);

      const res = await request(app)
        .delete(API_PATH)
        .send({ workflowId: workflow.id, stepId: "step-1" })
        .expect(200);

      expect(res.body).toEqual({ status: "Step successfully deleted" });
      expect(datastore.getStepStatus(workflow.id, "step-1")).toBeNull();
    });

    it("should return error if step does not exist", async () => {
      const workflow = getWorkflow();
      datastore.addWorkflow(workflow);

      const res = await request(app)
        .delete(API_PATH)
        .send({ workflowId: workflow.id, stepId: "nonexistent-step" })
        .expect(404);

      expect(res.body).toEqual({ status: "Step not found" });
    });
  });
});
