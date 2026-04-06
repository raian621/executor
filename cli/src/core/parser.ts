import { parse as parseToml } from "toml";
import type { Workflow } from "../types/workflow";
import { StepStatus, type Step } from "../types/step";

export function parseTomlWorkflow(tomlStr: string): Workflow {
  const { id, name, failFast, steps: workflowSteps } = parseToml(tomlStr);
  const workflowId = id || kebabifyName(name);

  const steps: Step[] = Object.entries(workflowSteps).map(
    ([id, step]: [string, any]) => {
      const derivedId = step.id || kebabifyName(step.name) || id;
      return { id: derivedId, workflowId, status: StepStatus.Pending, ...step } as Step;
    },
  );

  return { id: workflowId, name, failFast: failFast || false, steps };
}

function kebabifyName(name?: string): string | undefined {
  return name?.toLowerCase().split(' ').filter(word => word.length > 0)
    .join('-');
}
