import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryIcon, type CategoryConfig, type CategoryKind } from "@/lib/category-visuals";

/**
 * The one way decorative icons are drawn across the app: a bare line glyph
 * with no tinted tile, border or shadow behind it. Colour carries identity
 * (category, card, goal); the fixed-width slot keeps neighbouring text aligned
 * from row to row regardless of which glyph is shown.
 *
 * Interactive controls (back buttons, swatches, radio dots, avatars) are not
 * icon marks and keep their own shapes.
 */

export const ICON_STROKE = 1.25;

export type IconMarkSize = "sm" | "md" | "lg" | "xl" | "2xl";

const SLOT: Record<IconMarkSize, string> = {
  sm: "w-5",
  md: "w-7",
  lg: "w-8",
  xl: "w-10",
  "2xl": "w-12",
};

const GLYPH: Record<IconMarkSize, string> = {
  sm: "size-[18px]",
  md: "size-[22px]",
  lg: "size-6",
  xl: "size-8",
  "2xl": "size-10",
};

/**
 * Identity colours (category, card, goal) are user-picked and often fully
 * saturated. Icons render them blended into the app's slate ink so the hue
 * still tells categories apart but never shouts. Change the ratio here to
 * tune every icon in the app at once.
 */
const ICON_COLOR_STRENGTH = 55;
const ICON_INK = "#3d434a";

export function muteIconColor(color?: string) {
  if (!color) return undefined;
  return `color-mix(in oklab, ${color} ${ICON_COLOR_STRENGTH}%, ${ICON_INK})`;
}

interface SlotProps {
  size?: IconMarkSize;
  color?: string;
  className?: string;
}

function slotProps({ size = "md", color, className }: SlotProps) {
  return {
    "aria-hidden": true,
    className: cn("inline-flex shrink-0 items-center justify-center", SLOT[size], className),
    style: color ? ({ color: muteIconColor(color) } satisfies CSSProperties) : undefined,
  };
}

export function IconMark({ icon: Icon, ...props }: SlotProps & { icon: LucideIcon }) {
  return (
    <span {...slotProps(props)}>
      <Icon className={GLYPH[props.size ?? "md"]} strokeWidth={ICON_STROKE} />
    </span>
  );
}

export function CategoryMark({
  category,
  config,
  kind,
  ...props
}: SlotProps & { category: string; config?: CategoryConfig; kind?: CategoryKind }) {
  const glyph = GLYPH[props.size ?? "md"];
  return (
    <span {...slotProps(props)}>
      <CategoryIcon
        category={category}
        config={config}
        kind={kind}
        className={glyph}
        fallbackClassName={glyph}
        color={muteIconColor(props.color ?? config?.color)}
        strokeWidth={ICON_STROKE}
      />
    </span>
  );
}
