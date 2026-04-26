import type { Executor } from "../core/executor";
import type { Step, StepId, Verification } from "@executor/types";
import { StepStatus } from "@executor/types";

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