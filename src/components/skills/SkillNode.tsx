import { Icon } from "../arcade/Icon";
import { PixelIcon } from "../PixelIcon";
import type { NodeKind, SkillNode as SkillNodeDef } from "../../engine/skillTree";

export type NodeState = "locked" | "unaffordable" | "affordable" | "purchased";

// Circle diameter per kind. The screen also reads this to centre the node on
// its polar coordinate, so it lives here next to the styling.
export const NODE_SIZE: Record<NodeKind, number> = {
  small: 40,
  notable: 56,
  gate: 64,
};

// Same state vocabulary as the old tile list: dashed + lock, pulse when
// affordable, green wash + check when bought.
const SURFACE: Record<NodeState, string> = {
  locked: "border-dashed border-ink/40 bg-cream-50 opacity-60",
  unaffordable: "border-ink bg-white shadow-arcade-sm",
  affordable: "border-ink bg-white shadow-arcade-sm",
  purchased: "border-ink bg-buy/25 shadow-arcade-sm",
};

interface Props {
  node: SkillNodeDef;
  state: NodeState;
  selected: boolean;
  hint?: string; // replaces the tooltip text (e.g. demo-locked gates)
  onSelect: () => void;
}

// A single dot on the radial graph — icon only; name/cost/Buy live in the
// detail card so the canvas stays readable when zoomed out.
export function GraphNode({ node, state, selected, hint, onSelect }: Props) {
  const size = NODE_SIZE[node.kind];
  const star = node.branch === "star";
  const locked = state === "locked";
  const purchased = state === "purchased";
  const surface =
    purchased && star ? "border-ink bg-violet-100 shadow-arcade-sm" : SURFACE[state];

  return (
    <button
      type="button"
      title={hint ?? `${node.name} — ${node.description}`}
      aria-label={`${node.name} — ${node.description}`}
      onClick={onSelect}
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center rounded-full border-4 transition-transform hover:-translate-y-0.5 ${surface} ${
        star ? "ring-4 ring-violet-400" : ""
      } ${selected ? "outline outline-[3px] outline-offset-2 outline-ink" : ""}`}
    >
      {state === "affordable" && (
        <span className="pointer-events-none absolute -inset-1 animate-ping rounded-full border-4 border-buy motion-reduce:animate-none" />
      )}

      {locked ? (
        <Icon name="lock" fill size={Math.round(size * 0.45)} className="text-ink/50" />
      ) : (
        <PixelIcon
          id={node.id}
          icon={node.icon}
          size={Math.round(size * 0.6)}
          iconClassName={star ? "text-violet-600" : "text-primary"}
        />
      )}

      {purchased && (
        <Icon
          name="check_circle"
          fill
          size={16}
          className={`absolute -right-1.5 -top-1.5 rounded-full bg-white ${
            star ? "text-violet-600" : "text-buy"
          }`}
        />
      )}
    </button>
  );
}
