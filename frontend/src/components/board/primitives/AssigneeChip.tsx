import type { CSSProperties } from "react";
import { MOCK_USERS } from "@/mock/users";
import UserChip from "./UserChip";
import AgentChip from "./AgentChip";

interface AssigneeChipProps {
  userId?: number;
  agentName?: string;
  size?: number;
  working?: boolean;
}

/**
 * Dispatches to UserChip or AgentChip based on which identifier is provided.
 * Renders a "?" placeholder if neither is set.
 */
export default function AssigneeChip({
  userId,
  agentName,
  size = 22,
  working,
}: AssigneeChipProps) {
  if (agentName) {
    return <AgentChip name={agentName} size={size} working={working} />;
  }

  if (typeof userId === "number" && userId > 0) {
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (user) return <UserChip user={user} size={size} />;
  }

  const style: CSSProperties = {
    width: size,
    height: size,
    fontSize: size * 0.42,
    background: "var(--hover)",
    color: "var(--text-3)",
    border: "1px dashed var(--border-hi)",
    flex: "0 0 auto",
  };
  return (
    <span
      title="Unassigned"
      className="inline-flex select-none items-center justify-center rounded-full font-bold"
      style={style}
    >
      ?
    </span>
  );
}
