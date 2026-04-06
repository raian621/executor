import { build, spawn } from "bun";
import { buildGraph } from "./graph";
import type { WorkflowGraph } from "../types/graph";
import type { Step, StepId } from "../types/step";
import type { Workflow } from "../types/workflow";

export class Executor {
  readonly graph: WorkflowGraph;
  readonly stepQueue: StepId[];
  readonly readyQueue: Step[];
  readonly finished: Map<string, boolean>;
  readonly numWorkers: number;

  constructor(workflow: Workflow, numWorkers: number) {
    this.graph = buildGraph(workflow);
    this.stepQueue = this.graph.roots.slice();
    this.readyQueue = [];
    this.finished = new Map<string, boolean>();
    this.numWorkers = numWorkers;
  }

  async executeWorkflow() {
    await this.#breadthFirstExecution(this.graph, this.numWorkers);
  }

  async #breadthFirstExecution(graph: WorkflowGraph, workerCount: number) {
    const workerPromises: Promise<void>[] = [];
    for (let i = 0; i < workerCount; i++) {
      workerPromises.push(this.#startWorker());
    }

    while (this.stepQueue.length > 0) {
      const stepId = this.stepQueue.shift() as string;
      const step = graph.nodes.get(stepId) as Step;

      if (step.needs && step.needs?.every((id) => this.finished.has(id))) {
        this.stepQueue.push(stepId); // rotate ID until step prerequisites are finished
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      this.readyQueue.push(this.graph.nodes.get(stepId)!);
      for (let childId in graph.edges.get(stepId)) {
        this.stepQueue.push(childId);
      }
    }

    await Promise.all(workerPromises);
  }

  async #startWorker() {
    while (this.graph.nodes.size != this.finished.size) {
      if (this.readyQueue.length == 0) {
        await new Promise((resolve) => setTimeout(resolve, 20));
        continue;
      }

      const step = this.readyQueue.shift() as Step;
      let status = await this.#execute(step);
      if (status === "ok") {
        this.finished.set(step.id, true);
      } else if (status === "failed") {
        console.error("failed");
      }
    }
  }

  async #execute(
    step: Step,
    onFailure?: Step,
    onRetry?: Step,
    onSuccess?: Step,
  ): Promise<string> {
    let retries = 0;

    for (let i = 0; i < (step.retries || 1); i++) {
      if (step.commands) {
        return this.#executeCommands(step.commands);
      } else if (step.workflowRun) {
        throw new Error("unimplemented");
      }

      if (onRetry) {
        retries++;
        this.#execute(onRetry);
      }
    }

    if (onFailure && retries === (step.retries || 1)) {
      this.#execute(onFailure);
      return "failed";
    }

    if (onSuccess) {
      this.#execute(onSuccess);
    }

    return "ok";
  }

  async #executeCommands(commands: string[]): Promise<string> {
    for (const command of commands) {
      const exitCode = await spawn(["bash", "-c", `${command}`]).exited;
      if (exitCode != 0) {
        return "failed";
      }
    }
    return "ok";
  }
}
