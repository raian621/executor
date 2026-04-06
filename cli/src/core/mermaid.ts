import type { WorkflowGraph } from "../types/graph";

export function toMermaid(graph: WorkflowGraph): string {
  const lines = ["flowchart TD"];

  for (const [id, step] of graph.nodes) {
    const label = step.name.replace(/"/g, "'");
    lines.push(`    ${id}["${label}"]`);
  }

  for (const [from, tos] of graph.edges) {
    for (const to of tos) {
      lines.push(`    ${from} --> ${to}`);
    }
  }

  return lines.join("\n");
}
