import { test, expect, vi } from 'bun:test';
import { executeWorkflow } from './executor';
import type { Workflow } from './types/workflow';

test('workflow completes', async () => {
  const workflow: Workflow = {
    name: "Test Workflow",
    id: "test-workflow",
    failFast: false,
    steps: [
      {
        name: "Step 1",
        id: "step-1",
        workflowId: "test-workflow",
        commands: ["sleep 1"]
      },
      {
        name: "Step 2",
        id: "step-2",
        workflowId: "test-workflow",
        commands: ["echo done"]
      },
    ],
  };

  expect(executeWorkflow(workflow)).resolves.toBeUndefined();
});
