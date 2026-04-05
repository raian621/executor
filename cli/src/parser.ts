import { parse as parseToml } from "toml";
import type { Workflow } from "./types/workflow";
import type { Step } from "./types/step";
import { fail } from "assert";

export function parseTomlWorkflow(tomlStr: string): Workflow {
  const { name, failFast, steps: workflowSteps } = parseToml(tomlStr);
  const workflowId = name.toLowerCase().replaceAll(" ", "-");

  const steps: Step[] = Object.entries(workflowSteps).map(
    ([id, step]: [string, any]) => {
      const derivedId = step.id || id;
      return { id: derivedId, workflowId, ...step } as Step;
    },
  );

  return { id: workflowId, name, failFast: failFast || false, steps };
}
