import { spawn } from "bun";
import { buildGraph } from "./graph";
import type { WorkflowGraph } from "./types/graph";
import type { Step, StepId } from "./types/step";
import type { Workflow } from "./types/workflow";
import { spawnSync } from "child_process";

export async function executeWorkflow(workflow: Workflow) {
  await breadthFirstExecution(buildGraph(workflow), 8);
}

async function breadthFirstExecution(
  graph: WorkflowGraph,
  workerCount: number,
) {
  const stepQueue = graph.roots.slice();
  const readyQueue: StepId[] = [];
  const finished = new Map<string, boolean>();

  const workerPromises: Promise<void>[] = [];
  for (let i = 0; i < workerCount; i++) {
    workerPromises.push(worker(graph.nodes, readyQueue, finished));
  }

  while (stepQueue.length > 0) {
    const stepId = stepQueue.shift() as string;
    const step = graph.nodes.get(stepId) as Step;

    if (step.needs && step.needs?.every((id) => finished.has(id))) {
      stepQueue.push(stepId); // rotate ID until step prerequisites are finished
      await new Promise((resolve) => setTimeout(resolve, 100));
      continue;
    }

    readyQueue.push(stepId);
    for (let childId in graph.edges.get(stepId)) {
      stepQueue.push(childId);
    }
  }

  await Promise.all(workerPromises);
}

async function worker(
  nodes: Map<StepId, Step>,
  queue: StepId[],
  finished: Map<StepId, boolean>,
) {
  while (nodes.size != finished.size) {
    if (queue.length == 0) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      continue;
    }

    const step = nodes.get(queue.shift() as string) as Step;
    let status = await execute(step);
    if (status === "ok") {
      finished.set(step.id, true);
    } else if (status === "failed") {
      console.error("failed");
    }
  }
}

async function execute(
  step: Step,
  onFailure?: Step,
  onRetry?: Step,
  onSuccess?: Step,
): Promise<string> {
  let retries = 0;

  for (let i = 0; i < (step.retries || 1); i++) {
    if (step.commands) {
      return executeCommands(step.commands);
    } else if (step.workflowRun) {
      throw new Error("unimplemented");
    }

    if (onRetry) {
      retries++;
      execute(onRetry);
    }
  }

  if (onFailure && retries === (step.retries || 1)) {
    execute(onFailure);
    return "failed";
  }

  if (onSuccess) {
    execute(onSuccess);
  }

  return "ok";
}

async function executeCommands(commands: string[]): Promise<string> {
  for (const command of commands) {
    const exitCode = await spawn(['bash', '-c', `${command}`]).exited;
    if (exitCode != 0) {
      return "failed";
    }
  }
  return "ok";
}
