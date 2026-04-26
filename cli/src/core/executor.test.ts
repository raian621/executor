import { test, expect, vi } from "bun:test";
import { Executor } from "./executor";
import type { Workflow } from "@executor/types";
import { StepStatus } from "@executor/types";

test("workflow completes", async () => {
  const workflow: Workflow = {
    name: "Test Workflow",
    id: "test-workflow",
    failFast: false,
    steps: [
      {
        name: "Step 1",
        id: "step-1",
        workflowId: "test-workflow",
        commands: ["sleep 1"],
        status: StepStatus.Pending,
      },
      {
        name: "Step 2",
        id: "step-2",
        workflowId: "test-workflow",
        commands: ["echo done"],
        status: StepStatus.Pending,
      },
    ],
  };

  expect(new Executor(workflow, 8).executeWorkflow()).resolves.toBeUndefined();
  expect(
    workflow.steps.every((step) => step.status === StepStatus.Finished),
  ).toBeTrue();
});
