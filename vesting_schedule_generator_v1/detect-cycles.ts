import { GraphNode } from "./types";

export const detectCycles = (graph: Map<string, GraphNode>) => {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const dfs = (nodeId: string) => {
    if (recursionStack.has(nodeId)) {
      throw new Error(
        `Cycle detected involving the vesting condition with id ${nodeId}`
      );
    }
    if (visited.has(nodeId)) {
      return; // already visited, no cycle from this path
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = graph.get(nodeId);
    if (node) {
      for (const childId of node.next_condition_ids) {
        dfs(childId);
      }
    }

    recursionStack.delete(nodeId);
  };

  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId);
    }
  }
};
