import type { Executor } from "../core/executor";
import { StepStatus, type Step, type StepId } from "../types/step";
import type { Verification } from "../types/verification";

export function getSteps(executor: Executor): Step[] {
  return executor.graph.nodes.values().toArray();
}

export function getStepStatus(executor: Executor, stepId: StepId): StepStatus {
  // TODO: maybe refactor this to use an Executor-internal status map
  return executor.graph.nodes.get(stepId)!.status;
}

export function verifyStep(executor: Executor, stepId: StepId, verification: Verification) {
  const node = executor.graph.nodes.get(stepId)!;
  // avoid double verification
  if (node.verification === undefined) {
    node.verification = verification;
  }
}