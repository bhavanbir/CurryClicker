import { useMemo } from "react";
import { useGameStore } from "../store/useGameStore";
import { computeEffects, type ActiveEffects } from "../engine/effects";

// Live aggregate effects from purchased skill nodes + equipped gacha rolls.
export function useEffects(): ActiveEffects {
  const skillNodes = useGameStore((s) => s.skillNodes);
  const metaNodes = useGameStore((s) => s.metaNodes);
  const gachaInventory = useGameStore((s) => s.gachaInventory);
  const equippedUids = useGameStore((s) => s.equippedUids);
  const weeksCompleted = useGameStore((s) => s.weeksCompleted);

  return useMemo(
    () =>
      computeEffects(
        skillNodes,
        metaNodes,
        gachaInventory.filter((r) => equippedUids.includes(r.uid)),
        weeksCompleted,
      ),
    [skillNodes, metaNodes, gachaInventory, equippedUids, weeksCompleted],
  );
}
