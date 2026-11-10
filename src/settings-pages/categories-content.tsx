import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Check, Save, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addAdminCategory, deleteAdminCategory } from "@/actions";
import {
  CATEGORY_ICON_OPTIONS,
  CategoryIcon,
  type CategoryConfig,
  withAlpha,
} from "@/lib/category-visuals";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { CategoryMark } from "@/components/icon-mark";

interface CategoriesContentProps {
  expenseCategories: string[];
  incomeCategories: string[];
  configMap: Record<string, CategoryConfig>;
}

const PRESET_COLORS = [
  // Row 1: Vibrant & Warm
  "#FF5F5F",
  "#FF914D",
  "#FFC233",
  "#26C281",
  "#10AC84",
  "#417BFF",
  "#8B5CF6",
  // Row 2: Deep & Rich
  "#EF4444",
  "#F97316",
  "#FACC15",
  "#22C55E",
  "#06B6D4",
  "#3B82F6",
  "#A855F7",
  // Row 3: Soft & Pastel
  "#FB7185",
  "#FB923C",
  "#A3E635",
  "#2DD4BF",
  "#60A5FA",
  "#C084FC",
  "#F472B6",
  // Row 4: Navi & Modern
  "#191C1F",
  "#475569",
  "#868E96",
  "#6366F1",
  "#00D2D3",
  "#54A0FF",
  "#FF9FF3",
];

interface CategorySectionProps {
  names: string[];
  title: string;
  accentColor: string;
  configMap: Record<string, CategoryConfig>;
  onSelect: (name: string) => void;
}

function CategorySection({ names, title, accentColor, configMap, onSelect }: CategorySectionProps) {
  return (
    <section className="space-y-8">
      <div className="flex items-center gap-4 px-2">
        <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: accentColor }} />
        <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
          {title}
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {names.sort().map((name) => {
          const config = configMap[name];
          const color = config?.color || "#494fdf";

          return (
            <button
              type="button"
              key={name}
              className="navi-card flex items-center justify-between p-6 text-left group"
              onClick={() => onSelect(name)}
            >
              <div className="flex items-center gap-5 flex-1 min-w-0 relative z-10">
                <CategoryMark category={name} config={config} color={color} size="lg" />
                <div className="min-w-0">
                  <p className="font-display font-medium text-[18px] text-navi-dark truncate">
                    {name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-sans font-medium uppercase tracking-widest text-navi-gray/60">
                      {config?.icon || "Default Branded"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative z-10 size-10 rounded-full bg-navi-surface flex items-center justify-center text-navi-dark opacity-0 group-hover:opacity-100 transition-opacity">
                <Check className="size-4" strokeWidth={1.2} />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function CategoriesContent({
  expenseCategories,
  incomeCategories,
  configMap,
}: CategoriesContentProps) {
  const queryClient = useQueryClient();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [draftColor, setDraftColor] = useState<string>("#494fdf");
  const [draftIcon, setDraftIcon] = useState<string | null>(null);

  const upsertMutation = useMutation({
    mutationFn: (data: { name: string; color: string; icon: string | null }) =>
      addAdminCategory({ data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setIsPickerOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminCategory({ data: id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  useEffect(() => {
    if (!activeCategory) return;
    const config = configMap[activeCategory];
    setDraftColor(config?.color || "#494fdf");
    setDraftIcon(config?.icon || null);
  }, [activeCategory, configMap]);

  const handleSave = () => {
    if (activeCategory) {
      upsertMutation.mutate({ name: activeCategory, color: draftColor, icon: draftIcon });
    }
  };

  const handleDelete = () => {
    if (!activeCategory) return;
    const config = configMap[activeCategory];
    if (!config?.id) return;
    if (confirm(`Are you sure you want to delete "${activeCategory}"?`)) {
      deleteMutation.mutate(config.id);
      setIsPickerOpen(false);
    }
  };

  return (
    <div className="w-full min-h-dvh flex flex-col bg-white antialiased">
      {/* High-Impact Header */}
      <section className="bg-navi-dark pt-[calc(env(safe-area-inset-top,0px)+64px)] pb-20 px-6 md:px-12 flex flex-col gap-4 relative overflow-hidden text-white">
        <div className="space-y-4 relative z-10">
          <p className="text-[12px] font-display font-medium uppercase tracking-[0.25em] opacity-50">
            Interface Customization
          </p>
          <h1 className="text-[64px] md:text-[80px] font-display font-medium leading-[0.9] tracking-[-0.04em]">
            Categories
          </h1>
        </div>
      </section>

      <div className="p-6 md:p-12 space-y-20">
        <CategorySection
          names={expenseCategories}
          title="Expense Categories"
          accentColor="#494fdf"
          configMap={configMap}
          onSelect={(name) => {
            setActiveCategory(name);
            setIsPickerOpen(true);
          }}
        />
        <CategorySection
          names={incomeCategories}
          title="Income Categories"
          accentColor="#00a87e"
          configMap={configMap}
          onSelect={(name) => {
            setActiveCategory(name);
            setIsPickerOpen(true);
          }}
        />
      </div>

      <Sheet open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <SheetContent
          side="bottom"
          className="h-full max-h-[90dvh] sm:h-fit sm:max-h-[95dvh] sm:side-right border-t sm:border-l rounded-t-[40px] sm:rounded-l-[40px] p-0 shadow-none border-none overflow-hidden flex flex-col bg-white"
        >
          <div className="p-6 sm:p-8 pb-2 text-left shrink-0">
            <h2 className="text-[28px] sm:text-[32px] md:text-[48px] font-display font-medium tracking-tight uppercase italic text-navi-dark">
              Customize {activeCategory}
            </h2>
            <p className="ml-1 text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-navi-gray/60">
              Update visual configuration for this category
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-0 space-y-8 sm:space-y-12">
            <div className="pb-10 space-y-8 sm:space-y-12">
              {/* Refined Preview */}
              <div className="navi-card flex items-center justify-between p-6 sm:p-8 overflow-hidden relative">
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-[0.1] pointer-events-none">
                  <CategoryIcon
                    category={activeCategory || ""}
                    config={{ name: activeCategory || "", color: draftColor, icon: draftIcon }}
                    className="size-32 -rotate-12"
                    color={draftColor}
                    strokeWidth={1}
                  />
                </div>
                <div className="relative z-10 pl-12 sm:pl-20">
                  <p className="text-[10px] font-sans font-medium uppercase tracking-[0.25em] text-navi-gray">
                    Live Preview
                  </p>
                  <p className="text-[24px] font-display font-medium text-navi-dark mt-1">
                    {activeCategory}
                  </p>
                </div>
                <CategoryMark
                  category={activeCategory || ""}
                  config={{ name: activeCategory || "", color: draftColor, icon: draftIcon }}
                  color={draftColor}
                  size="xl"
                  className="relative z-10"
                />
              </div>

              {/* Color Picker */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <Label
                    id="color-palette-label"
                    className="text-[11px] font-display font-medium uppercase tracking-[0.25em] text-navi-gray/60"
                  >
                    Color Palette
                  </Label>
                  <span className="text-[10px] font-mono text-navi-gray/60">{draftColor}</span>
                </div>
                <div
                  className="grid grid-cols-7 gap-3 sm:gap-4"
                  role="group"
                  aria-labelledby="color-palette-label"
                >
                  {PRESET_COLORS.map((color) => {
                    const selected = draftColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setDraftColor(color)}
                        className={cn(
                          "size-10 rounded-full transition-all flex items-center justify-center relative",
                          selected ? "scale-110" : "hover:scale-105",
                        )}
                        style={{ backgroundColor: color }}
                      >
                        {selected && (
                          <div className="absolute inset-0 rounded-full ring-2 ring-navi-dark ring-offset-4" />
                        )}
                        {selected && (
                          <Check
                            className="size-5 text-white mix-blend-difference"
                            strokeWidth={1.2}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Picker */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <Label
                    id="icon-selection-label"
                    className="text-[11px] font-display font-medium uppercase tracking-[0.25em] text-navi-gray/60"
                  >
                    Icon Selection
                  </Label>
                  <span className="text-[10px] font-display font-medium uppercase tracking-widest text-navi-gray/60">
                    {draftIcon || "Default"}
                  </span>
                </div>
                <div
                  className="grid grid-cols-4 gap-3 sm:gap-4 max-h-[300px] overflow-y-auto pr-2"
                  role="group"
                  aria-labelledby="icon-selection-label"
                >
                  <button
                    type="button"
                    onClick={() => setDraftIcon(null)}
                    className={cn(
                      "flex items-center justify-center p-4 sm:p-5 rounded-card border transition-all active:scale-[0.98]",
                      draftIcon === null
                        ? "bg-white border-navi-dark shadow-sm"
                        : "bg-navi-surface border-transparent hover:bg-white/50",
                    )}
                  >
                    <div
                      className="size-12 sm:size-14 rounded-[16px] sm:rounded-[18px] flex items-center justify-center border"
                      style={{
                        backgroundColor:
                          draftIcon === null ? withAlpha(draftColor, 0.05) : "transparent",
                        borderColor:
                          draftIcon === null ? withAlpha(draftColor, 0.1) : "transparent",
                        color: draftIcon === null ? draftColor : "#191c1f",
                      }}
                    >
                      <LayoutListIcon className="size-6" strokeWidth={1.2} />
                    </div>
                  </button>
                  {CATEGORY_ICON_OPTIONS.filter((option) => option.value !== "LayoutList").map(
                    (option) => {
                      const Icon = option.icon;
                      const selected = draftIcon === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDraftIcon(option.value)}
                          className={cn(
                            "flex items-center justify-center p-4 sm:p-5 rounded-card border transition-all active:scale-[0.98]",
                            selected
                              ? "bg-white border-navi-dark shadow-sm"
                              : "bg-navi-surface border-transparent hover:bg-white/50",
                          )}
                        >
                          <div
                            className="size-12 sm:size-14 rounded-[16px] sm:rounded-[18px] flex items-center justify-center border"
                            style={{
                              backgroundColor: selected
                                ? withAlpha(draftColor, 0.05)
                                : "transparent",
                              borderColor: selected ? withAlpha(draftColor, 0.1) : "transparent",
                              color: selected ? draftColor : "#191c1f",
                            }}
                          >
                            <Icon className="size-6" strokeWidth={1.2} />
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Actions */}
          <div className="p-6 sm:p-8 border-t border-navi-border/20 bg-white shrink-0">
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="secondary"
                className="h-16 rounded-full"
                onClick={() => setIsPickerOpen(false)}
              >
                <X className="size-5" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
              <Button
                className="h-16 rounded-full bg-navi-dark text-white"
                onClick={handleSave}
                disabled={upsertMutation.isPending}
              >
                <Save className="size-5" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              <Button
                variant="destructive"
                className="h-16 rounded-full"
                onClick={handleDelete}
                disabled={
                  upsertMutation.isPending ||
                  deleteMutation.isPending ||
                  !configMap[activeCategory || ""]?.id
                }
              >
                <Trash2 className="size-5" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

const LayoutListIcon = CATEGORY_ICON_OPTIONS.find((option) => option.value === "LayoutList")!.icon;
