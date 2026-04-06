import { test, expect } from "bun:test";
import { Executor } from "../core/executor";
import { getSteps, getStepStatus, verifyStep } from "./step";
import type { Workflow } from "../types/workflow";
import { StepStatus } from "../types/step";

test("getSteps returns steps when executor starts", () => {
  const workflow: Workflow = {
    name: "Test Workflow",
    id: "test-workflow",
    failFast: false,
    steps: [
      {
        name: "Step 1",
        id: "step-1",
        workflowId: "test-workflow",
        commands: ["echo hello"],
        status: StepStatus.Pending,
      },
      {
        name: "Step 2",
        id: "step-2",
        workflowId: "test-workflow",
        commands: ["echo world"],
        status: StepStatus.Pending,
      },
    ],
  };

  const executor = new Executor(workflow, 8);
  const steps = getSteps(executor);

  expect(steps).toHaveLength(2);
  expect(steps[0]!.id).toBe("step-1");
  expect(steps[1]!.id).toBe("step-2");
});

test("getStepStatus returns Pending before executor starts", () => {
  const workflow: Workflow = {
    name: "Test Workflow",
    id: "test-workflow",
    failFast: false,
    steps: [
      {
        name: "Step 1",
        id: "step-1",
        workflowId: "test-workflow",
        commands: ["echo hello"],
        status: StepStatus.Pending,
      },
    ],
  };

  const executor = new Executor(workflow, 8);
  const status = getStepStatus(executor, "step-1");

  expect(status).toBe(StepStatus.Pending);
});

test("getStepStatus returns Finished after executor finishes", async () => {
  const workflow: Workflow = {
    name: "Test Workflow",
    id: "test-workflow",
    failFast: false,
    steps: [
      {
        name: "Step 1",
        id: "step-1",
        workflowId: "test-workflow",
        commands: ["echo hello"],
        status: StepStatus.Pending,
      },
    ],
  };

  const executor = new Executor(workflow, 8);
  await executor.executeWorkflow();

  const status = getStepStatus(executor, "step-1");

  expect(status).toBe(StepStatus.Finished);
});

test("getStepStatus returns Running during long step execution", async () => {
  const workflow: Workflow = {
    name: "Test Workflow",
    id: "test-workflow",
    failFast: false,
    steps: [
      {
        name: "Step 1",
        id: "step-1",
        workflowId: "test-workflow",
        commands: ["sleep 0.5"],
        status: StepStatus.Pending,
      },
    ],
  };

  const executor = new Executor(workflow, 8);
  const executePromise = executor.executeWorkflow();

  await new Promise((resolve) => setTimeout(resolve, 100));
  const status = getStepStatus(executor, "step-1");
  expect(status).toBe(StepStatus.Running);

  await executePromise;
  expect(getStepStatus(executor, "step-1")).toBe(StepStatus.Finished);
});
