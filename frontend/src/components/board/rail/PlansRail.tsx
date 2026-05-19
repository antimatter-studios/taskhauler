import { useState, type CSSProperties, type ReactNode } from "react";
import { Plus, Check, Pencil, ChevronRight } from "lucide-react";
import { MOCK_PROPOSALS } from "@/mock/proposals";
import type {
  Proposal,
  ProposalAction,
  ProposalStatus,
} from "@/mock/proposals";
import { MOCK_USERS } from "@/mock/users";
import { fmtAgo, fmtDate } from "@/lib/time";
import UserChip from "../primitives/UserChip";
import AgentChip from "../primitives/AgentChip";

// ── Toast helper (very light — just `alert` for now since toast infra is out of scope) ──

function notWired(action: "approve" | "reject" | "edit", proposal: Proposal) {
  // eslint-disable-next-line no-alert
  alert(
    `${action[0].toUpperCase()}${action.slice(1)} "${proposal.title}" would execute server-side; not yet wired.`,
  );
}

// ── Section header ───────────────────────────────────────────────────────

function SectionHead({ label, sub }: { label: string; sub: string }) {
  return (
    <div
      style={{
        padding: "10px 12px 4px",
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        flex: "0 0 auto",
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: "var(--text-3)",
          fontWeight: 700,
          letterSpacing: 1.3,
          fontFamily: "var(--mono)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 11,
          color: "var(--text-3)",
          fontFamily: "var(--font)",
        }}
      >
        {sub}
      </span>
    </div>
  );
}

// ── ProposalCard ─────────────────────────────────────────────────────────

interface ProposalCardProps {
  plan: Proposal;
  initiallyExpanded: boolean;
}

function statusBadge(status: ProposalStatus): { color: string; label: string } {
  switch (status) {
    case "pending":
      return { color: "var(--amber)", label: "PENDING" };
    case "approved":
      return { color: "var(--green)", label: "APPROVED" };
    case "rejected":
    default:
      return { color: "var(--text-3)", label: "REJECTED" };
  }
}

function ProposalCard({ plan, initiallyExpanded }: ProposalCardProps) {
  const [expanded, setExpanded] = useState<boolean>(initiallyExpanded);
  const fromAgent = plan.proposer_kind === "agent";
  const proposerName = fromAgent
    ? `@${plan.proposer_agent_name ?? "?"}`
    : MOCK_USERS.find((u) => u.id === plan.proposer_user_id)?.display_name ??
      "Unknown";
  const badge = statusBadge(plan.status);

  const containerStyle: CSSProperties = {
    padding: "10px 12px",
    borderBottom: "1px solid var(--border)",
    background: plan.status === "pending" ? "var(--surface)" : "var(--bg)",
    opacity: plan.status === "rejected" ? 0.55 : 1,
  };

  const approvedByName =
    plan.approved_by_user_id != null
      ? MOCK_USERS.find((u) => u.id === plan.approved_by_user_id)?.display_name
      : undefined;
  const rejectedByName =
    plan.rejected_by_user_id != null
      ? MOCK_USERS.find((u) => u.id === plan.rejected_by_user_id)?.display_name
      : undefined;

  return (
    <div style={containerStyle}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "var(--font)",
          color: "var(--text)",
        }}
      >
        <div style={{ position: "relative", flex: "0 0 auto" }}>
          {fromAgent ? (
            <AgentChip
              name={plan.proposer_agent_name ?? "?"}
              size={22}
            />
          ) : (
            <UserChip
              user={
                MOCK_USERS.find((u) => u.id === plan.proposer_user_id) ?? {
                  display_name: proposerName,
                }
              }
              size={22}
            />
          )}
          {fromAgent && (
            <span
              style={{
                position: "absolute",
                right: -3,
                bottom: -3,
                width: 11,
                height: 11,
                borderRadius: 99,
                background: "var(--accent)",
                color: "var(--accent-fg)",
                fontSize: 8,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--mono)",
                boxShadow: "0 0 0 1.5px var(--surface)",
              }}
            >
              AI
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              marginBottom: 2,
            }}
          >
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "var(--text)",
                fontFamily: fromAgent ? "var(--mono)" : "var(--font)",
              }}
            >
              {proposerName}
            </span>
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>proposes</span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 10,
                color: "var(--text-3)",
                fontFamily: "var(--mono)",
              }}
            >
              {fmtAgo(plan.at)} ago
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              lineHeight: 1.35,
            }}
          >
            {plan.title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 5,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: badge.color,
                letterSpacing: 0.5,
                padding: "1px 5px",
                border: `1px solid color-mix(in srgb, ${badge.color} 33%, transparent)`,
                borderRadius: 3,
                fontFamily: "var(--mono)",
              }}
            >
              {badge.label}
            </span>
            <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>
              {plan.actions.length}{" "}
              {plan.actions.length === 1 ? "action" : "actions"}
            </span>
            {plan.confidence != null && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  color: "var(--text-3)",
                  fontFamily: "var(--mono)",
                }}
              >
                conf {Math.round(plan.confidence * 100)}%
              </span>
            )}
          </div>
        </div>
        <span
          style={{
            color: "var(--text-3)",
            transition: "transform 160ms",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            flex: "0 0 auto",
            display: "inline-flex",
            alignItems: "center",
            paddingTop: 4,
          }}
        >
          <ChevronRight size={12} />
        </span>
      </button>

      {expanded && (
        <div style={{ marginTop: 10, paddingLeft: 32 }}>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-2)",
              lineHeight: 1.45,
              marginBottom: 8,
            }}
          >
            {plan.summary}
          </div>

          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 5,
              padding: 8,
              fontFamily: "var(--mono)",
              fontSize: 11,
              lineHeight: 1.6,
              marginBottom: 10,
            }}
          >
            {plan.actions.map((a, i) => (
              <PlanActionLine key={i} action={a} />
            ))}
          </div>

          {plan.status === "pending" && (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => notWired("approve", plan)}
                style={{
                  flex: 1,
                  height: 28,
                  border: "none",
                  borderRadius: 5,
                  background: "var(--accent)",
                  color: "var(--accent-fg)",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                <Check size={12} strokeWidth={2.4} />
                Approve
              </button>
              <button
                type="button"
                onClick={() => notWired("reject", plan)}
                style={{
                  height: 28,
                  padding: "0 10px",
                  border: "1px solid var(--border)",
                  borderRadius: 5,
                  background: "var(--surface)",
                  color: "var(--text-2)",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                }}
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => notWired("edit", plan)}
                style={{
                  height: 28,
                  padding: "0 10px",
                  border: "1px solid var(--border)",
                  borderRadius: 5,
                  background: "var(--surface)",
                  color: "var(--text-2)",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Pencil size={11} />
                Edit
              </button>
            </div>
          )}

          {plan.status === "approved" && approvedByName && (
            <div
              style={{
                fontSize: 11,
                color: "var(--green)",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Check size={12} strokeWidth={2.4} />
              Approved by {approvedByName} · executed
            </div>
          )}

          {plan.status === "rejected" && rejectedByName && (
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>
              Rejected by {rejectedByName}
              {plan.rejection_reason && (
                <span style={{ fontStyle: "italic" }}>
                  {" "}
                  — &quot;{plan.rejection_reason}&quot;
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── PlanActionLine ───────────────────────────────────────────────────────

function PlanActionLine({ action }: { action: ProposalAction }): ReactNode {
  const kindColors: Record<ProposalAction["kind"], string> = {
    priority: "var(--amber)",
    move: "var(--accent)",
    label: "var(--text-2)",
    split: "var(--green)",
    ping: "var(--amber)",
    archive: "var(--text-3)",
    assign: "var(--accent)",
    due: "var(--amber)",
  };

  const color = kindColors[action.kind] ?? "var(--text-3)";

  let summary: ReactNode = null;
  switch (action.kind) {
    case "priority":
      summary = (
        <>
          set <b>{action.target}</b> priority {action.from} →{" "}
          <b>{action.to}</b>
        </>
      );
      break;
    case "move":
      summary = (
        <>
          move <b>{action.target}</b> {action.from} → <b>{action.to}</b>
        </>
      );
      break;
    case "label":
      if (action.add) {
        summary = (
          <>
            add label <b>&quot;{action.add}&quot;</b> to <b>{action.target}</b>
          </>
        );
      } else if (action.remove) {
        summary = (
          <>
            remove label <b>&quot;{action.remove}&quot;</b> from{" "}
            <b>{action.target}</b>
          </>
        );
      } else {
        summary = <>label <b>{action.target}</b></>;
      }
      break;
    case "split":
      summary = (
        <>
          split <b>{action.target}</b> into {action.parts.length} cards
        </>
      );
      break;
    case "ping":
      summary = (
        <>
          ping {action.users.map((u) => `@${u}`).join(" ")} re:{" "}
          <b>{action.target}</b>
        </>
      );
      break;
    case "archive":
      summary = (
        <>
          archive <b>{action.count}</b> cards
        </>
      );
      break;
    case "assign": {
      const who = action.assignee_agent
        ? `@${action.assignee_agent}`
        : action.assignee_user_id
          ? `@${MOCK_USERS.find((u) => u.id === action.assignee_user_id)?.handle ?? action.assignee_user_id}`
          : "(none)";
      summary = (
        <>
          assign <b>{action.target}</b> to <b>{who}</b>
        </>
      );
      break;
    }
    case "due":
      summary = (
        <>
          reschedule <b>{action.target}</b> to{" "}
          <b>{fmtDate(action.to)}</b>
        </>
      );
      break;
    default:
      summary = JSON.stringify(action);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 6,
        color: "var(--text-2)",
      }}
    >
      <span
        style={{
          color,
          fontWeight: 700,
          minWidth: 60,
          flexShrink: 0,
          fontSize: 10,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {action.kind}
      </span>
      <span style={{ flex: 1 }}>{summary}</span>
    </div>
  );
}

// ── PlansRail ────────────────────────────────────────────────────────────

/**
 * Plans rail: proposals queue.
 *
 * - Pending section (first proposal expanded by default)
 * - Recently decided section (approved + rejected; rejected at 0.55 opacity)
 * - Bottom CTA: "+ Propose a plan" solid accent button.
 */
export default function PlansRail() {
  const pending = MOCK_PROPOSALS.filter((p) => p.status === "pending");
  const decided = MOCK_PROPOSALS.filter((p) => p.status !== "pending");
  const firstPendingId = pending[0]?.id;

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <SectionHead
        label={`${pending.length} pending`}
        sub="waiting for review"
      />
      {pending.map((p) => (
        <ProposalCard
          key={p.id}
          plan={p}
          initiallyExpanded={p.id === firstPendingId}
        />
      ))}

      {decided.length > 0 && (
        <SectionHead label="recently decided" sub={`${decided.length}`} />
      )}
      {decided.map((p) => (
        <ProposalCard key={p.id} plan={p} initiallyExpanded={false} />
      ))}

      <div
        style={{
          marginTop: "auto",
          padding: "10px 12px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg)",
          flex: "0 0 auto",
        }}
      >
        <button
          type="button"
          style={{
            width: "100%",
            height: 30,
            padding: "0 10px",
            background: "var(--accent)",
            color: "var(--accent-fg)",
            border: "none",
            borderRadius: 5,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Plus size={12} strokeWidth={2.2} />
          Propose a plan
        </button>
      </div>
    </div>
  );
}
