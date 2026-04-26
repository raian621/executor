import { expect, test } from "bun:test";
import { parseTomlWorkflow } from "./parser";
import type { Workflow } from "@executor/types";
import { StepStatus } from "@executor/types";

test("parses TOML into Workflow object", () => {
  const toml = `name = "My Test Workflow"
failFast = true

[steps.build]
name = "Build"
commands = ["npm run build"]

[steps.test]
name = "Test"
needs = ["Build"]
commands = ["npm run test"]
`;
  const result = parseTomlWorkflow(toml) as Workflow;
  const expected: Workflow = {
    name: "My Test Workflow",
    id: "my-test-workflow",
    failFast: true,
    steps: [
      {
        workflowId: "my-test-workflow",
        name: "Build",
        id: "build",
        commands: ["npm run build"],
        status: StepStatus.Pending,
      },
      {
        workflowId: "my-test-workflow",
        name: "Test",
        id: "test",
        commands: ["npm run test"],
        needs: ["Build"],
        status: StepStatus.Pending,
      },
    ],
  };
  expect(result).toEqual(expected);
});
