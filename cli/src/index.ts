import { readFileSync } from "fs";
import { Command } from "commander";
import { parseTomlWorkflow } from "./core/parser";
import { Executor } from "./core/executor";
import { toMermaid } from "./core/mermaid";
import { buildGraph } from "./core/graph";
import renderApp from "./ui/App";

const program = new Command()
  .option("-c, --check", "check the input workflow", false)
  .option(
    "-b, --base <base-dir>",
    "set the base directory for workflow imports",
    ".",
  )
  .argument("<workflow>", "workflow to execute")
  .parse();

const options = program.opts();
const [workflowPath] = program.args;

try {
  const workflowStr = readFileSync(workflowPath as string).toString();
  const workflow = parseTomlWorkflow(workflowStr);
  if (options.check) {
    console.log(toMermaid(buildGraph(workflow)));
    console.log(workflow);
  } else {
    const executor = new Executor(workflow, /* numWorkers= */ 8)
    executor.executeWorkflow();
    renderApp(executor);
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}
