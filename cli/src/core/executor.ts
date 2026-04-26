import { build, spawn } from "bun";
import { buildGraph } from "./graph";
import type { Workflow, WorkflowGraph, Step, StepId } from "@executor/types";
import { StepStatus } from "@executor/types";
import type { Verification } from "@executor/types";

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

  getSteps(): Step[] {
    return this.graph.nodes.values().toArray();
  }

  getStepStatus(stepId: StepId): StepStatus {
    // TODO: maybe refactor this to use an Executor-internal status map
    return this.graph.nodes.get(stepId)!.status;
  }

  verifyStep(stepId: StepId, verification: Verification) {
    const node = this.graph.nodes.get(stepId)!;
    // avoid double verification
    if (node.verification === undefined) {
      node.verification = verification;
    }
  }

  async #breadthFirstExecution(graph: WorkflowGraph, workerCount: number) {
    const workerPromises: Promise<void>[] = [];
    for (let i = 0; i < workerCount; i++) {
      workerPromises.push(this.#startWorker());
    }

    while (this.stepQueue.length > 0) {
      const stepId = this.stepQueue.shift() as string;
      const step = graph.nodes.get(stepId) as Step;

      if (step.needs && !step.needs.every((id) => this.finished.has(id))) {
        this.stepQueue.push(stepId);
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      this.readyQueue.push(this.graph.nodes.get(stepId)!);
      for (const childId of graph.edges.get(stepId) ?? []) {
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
      step.status = StepStatus.Running;
      let status = await this.#execute(step);
      if (status === "ok") {
        this.finished.set(step.id, true);
        step.status = StepStatus.Finished;
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
        step.status = StepStatus.Retrying;
        this.#execute(onRetry);
      }
    }

    if (onFailure && retries === (step.retries || 1)) {
      this.#execute(onFailure);
      step.status = StepStatus.Failed;
      return "failed";
    }

    if (onSuccess) {
      this.#execute(onSuccess);
    }

    return "ok";
  }

  async #executeCommands(commands: string[]): Promise<string> {
    for (const command of commands) {
      const process = spawn(["bash", "-c", `${command}`]);
      const exitCode = await process.exited;
      if (exitCode != 0) {
        return "failed";
      }
    }
    return "ok";
  }
}
