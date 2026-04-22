import React from "react";
import { LayoutList, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  withAlpha, 
  CATEGORY_ICON_OPTIONS,
  type CategoryConfig 
} from "@/lib/category-visuals";
import { CategoryCombobox } from "@/components/category-combobox";
import { Label } from "@/components/ui/label";

interface CategoryPickerProps {
  category: string;
  onCategoryChange: (val: string) => void;
  availableCategories: string[];
  categoryConfigs: CategoryConfig[];
  isCustomizing: boolean;
  onCustomizingChange: (val: boolean) => void;
  draftColor: string;
  onDraftColorChange: (val: string) => void;
  draftIcon: string | null;
  onDraftIconChange: (val: string | null) => void;
}

const PRESET_COLORS = [
  "#FF5F5F", "#FF914D", "#FFC233", "#26C281", "#10AC84", "#417BFF", "#8B5CF6",
  "#EF4444", "#F97316", "#FACC15", "#22C55E", "#06B6D4", "#3B82F6", "#A855F7",
];

export function CategoryPicker({
  category,
  onCategoryChange,
  availableCategories,
  categoryConfigs,
  isCustomizing,
  onCustomizingChange,
  draftColor,
  onDraftColorChange,
  draftIcon,
  onDraftIconChange,
}: CategoryPickerProps) {


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <Label htmlFor="category-selector" className="text-[11px] font-display font-medium uppercase tracking-[0.25em] text-navi-gray/60">
          Category
        </Label>
        <button
          type="button"
          onClick={() => onCustomizingChange(!isCustomizing)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
            isCustomizing 
              ? "bg-navi-blue text-white" 
              : "text-navi-blue hover:bg-navi-blue/5"
          )}
        >
          <Palette className="size-3.5" strokeWidth={1.2} />
          <span className="text-[10px] font-display font-medium uppercase tracking-widest">
            {isCustomizing ? "Editing View" : "Customize View"}
          </span>
        </button>
      </div>

      <div className="flex items-start gap-4">
        <CategoryCombobox
          id="category-selector"
          value={category}
          onValueChange={onCategoryChange}
          categories={availableCategories}
          categoryConfigs={categoryConfigs}
        />
      </div>

      {isCustomizing && (
        <div className="mt-8 space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <Label id="visual-identity-label" className="text-[11px] font-display font-medium uppercase tracking-[0.25em] text-navi-gray/60">
                Visual Identity
              </Label>
              <span className="text-[10px] font-mono text-navi-gray/40 lowercase">{draftColor}</span>
            </div>
            <div className="grid grid-cols-7 gap-3" role="group" aria-labelledby="visual-identity-label">
              {PRESET_COLORS.map((color) => {
                const selected = draftColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onDraftColorChange(color)}
                    className={cn(
                      "size-8 rounded-full transition-all flex items-center justify-center relative",
                      selected ? "scale-110" : "hover:scale-110 active:scale-95"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {selected && (
                      <div className="absolute inset-0 rounded-full ring-2 ring-navi-dark ring-offset-4" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <Label id="iconography-label" className="text-[11px] font-display font-medium uppercase tracking-[0.25em] text-navi-gray/60">
                Iconography
              </Label>
              <span className="text-[10px] font-display font-medium uppercase tracking-widest text-navi-gray/40">
                {draftIcon || "Default"}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3" role="group" aria-labelledby="iconography-label">
              <button
                type="button"
                onClick={() => onDraftIconChange(null)}
                className={cn(
                  "flex items-center justify-center h-14 rounded-2xl border transition-all active:scale-[0.98]",
                  draftIcon === null 
                    ? "bg-white border-navi-dark shadow-sm" 
                    : "bg-navi-surface border-transparent hover:bg-white/50"
                )}
              >
                <div 
                  className="size-8 rounded-xl flex items-center justify-center border"
                  style={{ 
                    backgroundColor: draftIcon === null ? withAlpha(draftColor, 0.05) : "transparent",
                    borderColor: draftIcon === null ? withAlpha(draftColor, 0.1) : "transparent",
                    color: draftIcon === null ? draftColor : "#191c1f"
                  }}
                >
                  <LayoutList className="size-4" strokeWidth={1.2} />
                </div>
              </button>
              {CATEGORY_ICON_OPTIONS.slice(0, 7).map((opt) => {
                const Icon = opt.icon;
                const selected = draftIcon === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onDraftIconChange(opt.value)}
                    className={cn(
                      "flex items-center justify-center h-14 rounded-2xl border transition-all active:scale-[0.98]",
                      selected
                        ? "bg-white border-navi-dark shadow-sm"
                        : "bg-navi-surface border-transparent hover:bg-white/50"
                    )}
                  >
                    <div 
                      className="size-8 rounded-xl flex items-center justify-center border"
                      style={{ 
                        backgroundColor: selected ? withAlpha(draftColor, 0.05) : "transparent",
                        borderColor: selected ? withAlpha(draftColor, 0.1) : "transparent",
                        color: selected ? draftColor : "#191c1f"
                      }}
                    >
                      <Icon className="size-4" strokeWidth={1.2} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
