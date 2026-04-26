import { readFileSync } from "fs";
import { Command } from "commander";
import { parseTomlWorkflow } from "./core/parser";
import { Executor } from "./core/executor";
import { toMermaid } from "./core/mermaid";
import { buildGraph } from "./core/graph";
import renderApp from "./ui/App";
import serveWebUi from "./serve-web-ui";

const program = new Command()
  .option("-c, --check", "check the input workflow", false)
  .option(
    "-b, --base <base-dir>",
    "set the base directory for workflow imports",
    ".",
  )
  .option(
    "-w, --web-ui-path <web-ui-path>",
    "Path to base directory of web UI static files.",
    "../ui/dist/",
  )
  .option("-p, --port <port>", "Port to listen on", "1234")
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
    const executor = new Executor(workflow, /* numWorkers= */ 8);
    renderApp(executor);
    serveWebUi(options.webUiPath, parseInt(options.port));
    executor.executeWorkflow().then(() =>
      new Promise((resolve) => {
        // Give clients time to update before shutting everything down:
        setTimeout(resolve, 300);
      }).then(() => process.exit()),
    );
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}
