import type { Screen } from "../navigation";
import { PageHeader } from "../components/arcade/PageHeader";
import { ShopPanel } from "../components/ShopPanel";

interface Props {
  onNavigate: (s: Screen) => void;
}

// Full-page shop, opened from the top/bottom nav. The ShopDrawer edge tab
// remains for quick access while cooking; both render the shared ShopPanel.
export function ShopScreen({ onNavigate }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <PageHeader title="Shop" />
      <ShopPanel onNavigate={onNavigate} />
    </div>
  );
}
