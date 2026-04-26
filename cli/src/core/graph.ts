import type { Workflow, WorkflowGraph, Step } from "@executor/types";

export function buildGraph(workflow: Workflow): WorkflowGraph {
  const { name, id, failFast, steps } = workflow;

  return {
    name,
    id,
    failFast,
    roots: steps
      .filter((step) => step.needs === undefined || step.needs!.length == 0)
      .map((step) => step.id),
    nodes: new Map(steps.map((step) => [step.id, step])),
    edges: getEdgesFromSteps(steps),
  };
}

function getEdgesFromSteps(steps: Step[]): Map<string, string[]> {
  return steps
    .filter((step) => step.needs !== undefined && step!.needs.length > 0)
    .flatMap((step) => step!.needs!.map((need) => [need, step.id]))
    .reduce((edgeMap, [from, to]) => {
      edgeMap.getOrInsert(from as string, []).push(to as string);
      return edgeMap;
    }, new Map<string, string[]>());
}
