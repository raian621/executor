import { parse as parseToml } from "toml";
import { StepStatus, type Workflow, type Step } from "@executor/types";
import type { StepId } from "@executor/types";

export function parseTomlWorkflow(tomlStr: string): Workflow {
  const {
    id,
    name,
    failFast,
    steps: workflowSteps,
  }: {
    id?: string;
    name: string;
    failFast?: boolean;
    steps: Map<StepId, Step>;
  } = parseToml(tomlStr);
  const workflowId = id ?? kebabifyName(name) ?? `workflow-${Math.random() * 1000 | 0}`;

  const steps: Step[] = Object.entries(workflowSteps).map(
    ([id, step]: [string, Step]) => {
      const derivedId = step.id || id || kebabifyName(step.name);
      return {
        ...step,
        id: derivedId,
        workflowId,
        status: StepStatus.Pending,
      } as Step;
    },
  );

  return { id: workflowId, name, failFast: failFast || false, steps };
}

function kebabifyName(name?: string): string | undefined {
  if (name === undefined) {
    return undefined;
  }
  return name
    ?.toLowerCase()
    .split(" ")
    .filter((word) => word.length > 0)
    .join("-");
}
