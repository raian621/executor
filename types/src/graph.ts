import type { Step, StepId } from "./step.js";
import type { Workflow } from "./workflow.js";

export interface WorkflowGraph {
  name: string;
  id: string;
  failFast: boolean;
  edges: Map<StepId, StepId[]>;
  nodes: Map<StepId, Step>;
  roots: StepId[];
}
