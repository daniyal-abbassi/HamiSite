"use client";

import { Agentation } from "agentation";

/** Development-only visual feedback toolbar connected to the local Agentation MCP server. */
export function AgentationToolbar() {
  if (process.env.NODE_ENV !== "development") return null;

  return <Agentation endpoint="http://localhost:4747" />;
}
