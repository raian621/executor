import { Command } from "commander";
import { parseTomlWorkflow } from "./parser";
import { readFileSync } from "fs";
import { executeWorkflow } from "./executor";
import { toMermaid } from "./mermaid";
import { buildGraph } from "./graph";

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
  console.log(toMermaid(buildGraph(workflow)));
  if (options.check) {
    console.log(workflow);
  } else {
    executeWorkflow(workflow);
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}
