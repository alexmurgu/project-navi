import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Check, Save, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addAdminCategory, deleteAdminCategory } from "../actions";
import {
  CATEGORY_ICON_OPTIONS,
  CategoryIcon,
  type CategoryConfig,
  withAlpha,
} from "@/lib/category-visuals";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface CategoriesContentProps {
  expenseCategories: string[];
  incomeCategories: string[];
  configMap: Record<string, CategoryConfig>;
}

export function CategoriesContent({
  expenseCategories,
  incomeCategories,
  configMap,
}: CategoriesContentProps) {
  const queryClient = useQueryClient();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [draftColor, setDraftColor] = useState<string>("#F59E0B");
  const [draftIcon, setDraftIcon] = useState<string | null>(null);

  const colors = useMemo(
    () => [
      "#F87171",
      "#FB923C",
      "#FBBF24",
      "#34D399",
      "#22D3EE",
      "#38BDF8",
      "#818CF8",
      "#A78BFA",
      "#F472B6",
      "#EF4444",
      "#F97316",
      "#F59E0B",
      "#10B981",
      "#06B6D4",
      "#0EA5E9",
      "#6366F1",
      "#8B5CF6",
      "#EC4899",
      "#B91C1C",
      "#C2410C",
      "#B45309",
      "#047857",
      "#0E7490",
      "#0369A1",
      "#4338CA",
      "#6D28D9",
      "#BE185D",
    ],
    [],
  );

  const upsertMutation = useMutation({
    mutationFn: (data: { name: string; color: string; icon: string | null }) =>
      addAdminCategory({ data }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["dashboard"], type: "active" });
      setIsPickerOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminCategory({ data: id }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["dashboard"], type: "active" });
    },
  });

  useEffect(() => {
    if (!activeCategory) return;
    const config = configMap[activeCategory];
    setDraftColor(config?.color || "#F59E0B");
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

  const renderCategoryTable = (names: string[], title: string) => (
    <div className="space-y-6">
      <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40 ml-2">
        {title}
      </h3>
      <div className="grid gap-4">
        {names.sort().map((name) => {
          const config = configMap[name];
          const color = config?.color || "#191c1f";

          return (
            <button
              type="button"
              key={name}
              className="relative flex items-center justify-between p-6 rounded-[20px] transition-all cursor-pointer border border-transparent active:scale-[0.99] group overflow-hidden text-left bg-navi-surface"
              style={{ backgroundColor: withAlpha(color, 0.05) }}
              onClick={() => {
                setActiveCategory(name);
                setIsPickerOpen(true);
              }}
            >
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none transition-transform duration-700">
                <CategoryIcon
                  category={name}
                  config={config}
                  className="size-24 -rotate-12"
                  color={color}
                  strokeWidth={1}
                />
              </div>

              <div className="relative z-10 pl-16 flex-1 min-w-0">
                <p className="font-display font-medium text-lg text-navi-dark truncate">
                  {name}
                </p>
                <p className="text-[10px] font-display font-medium uppercase tracking-widest text-navi-gray/60 mt-1">
                  {config?.icon || "Default Icon"}
                </p>
              </div>

              <div className="relative z-10 flex items-center justify-center size-10 rounded-full bg-white/50 text-navi-dark opacity-0 group-hover:opacity-100 transition-opacity">
                <Check className="size-4" strokeWidth={1} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-4 pt-6 md:p-8 bg-background text-foreground antialiased">
      <div className="grid gap-8 lg:grid-cols-2 items-start">
        {renderCategoryTable(expenseCategories, "Expense Categories")}
        {renderCategoryTable(incomeCategories, "Income Categories")}
      </div>

      <Sheet open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <SheetContent
          side="bottom"
          className="h-[95vh] sm:h-fit sm:max-h-[95vh] sm:side-right border-t sm:border-l rounded-t-[40px] sm:rounded-l-[40px] p-0 shadow-none border-none overflow-hidden flex flex-col bg-white"
        >
          <div className="h-full overflow-y-auto">
            <SheetHeader className="p-8 pb-4 text-left shrink-0">
              <SheetTitle className="text-[32px] md:text-[48px] font-display font-medium tracking-tight uppercase italic text-navi-dark">
                Customize {activeCategory}
              </SheetTitle>
              <SheetDescription className="ml-1 text-[11px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60">
                Update visual configuration for this category
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-12 p-8">
              {/* Refined Preview */}
              <div className="flex items-center justify-between bg-navi-surface p-8 rounded-[32px] border border-navi-border/20 overflow-hidden relative">
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-[0.1] pointer-events-none">
                  <CategoryIcon
                    category={activeCategory || ""}
                    config={{ name: activeCategory || "", color: draftColor, icon: draftIcon }}
                    className="size-32 -rotate-12"
                    color={draftColor}
                    strokeWidth={1}
                  />
                </div>
                <div className="relative z-10 pl-20">
                  <p className="text-[10px] font-display font-medium uppercase tracking-[0.25em] text-navi-gray">
                    Live Preview
                  </p>
                  <p className="text-[24px] font-display font-medium text-navi-dark mt-1">
                    {activeCategory}
                  </p>
                </div>
                <div 
                  className="size-16 rounded-full flex items-center justify-center relative z-10"
                  style={{ backgroundColor: withAlpha(draftColor, 0.1), color: draftColor }}
                >
                  <CategoryIcon
                    category={activeCategory || ""}
                    config={{ name: activeCategory || "", color: draftColor, icon: draftIcon }}
                    className="size-8"
                    color={draftColor}
                    strokeWidth={1}
                  />
                </div>
              </div>

              {/* Color Picker */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[11px] font-display font-medium uppercase tracking-[0.25em] text-navi-gray/60">
                    Color Palette
                  </p>
                  <span className="text-[10px] font-mono text-navi-gray/60">{draftColor}</span>
                </div>
                <div className="grid grid-cols-7 gap-4">
                  {colors.map((color) => {
                    const selected = draftColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setDraftColor(color)}
                        className={cn(
                          "size-10 rounded-full transition-all flex items-center justify-center",
                          selected ? "ring-2 ring-navi-dark ring-offset-4 scale-110" : "hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                      >
                        {selected && <Check className="size-5 text-white mix-blend-difference" strokeWidth={1} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Picker */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[11px] font-display font-medium uppercase tracking-[0.25em] text-navi-gray/60">
                    Icon Selection
                  </p>
                  <span className="text-[10px] font-display font-medium uppercase tracking-widest text-navi-gray/60">
                    {draftIcon || "Default"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-2">
                  <button
                    type="button"
                    onClick={() => setDraftIcon(null)}
                    className={cn(
                      "flex flex-col items-center gap-4 p-6 rounded-[24px] border-2 transition-all",
                      draftIcon === null 
                        ? "bg-navi-dark text-white border-navi-dark" 
                        : "bg-navi-surface border-transparent hover:bg-white"
                    )}
                  >
                    <LayoutListIcon className="size-6" strokeWidth={1} />
                    <span className="text-[10px] font-display font-medium uppercase tracking-widest">
                      Default
                    </span>
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
                            "flex flex-col items-center gap-4 p-6 rounded-[24px] border-2 transition-all",
                            selected
                              ? "bg-navi-dark text-white border-navi-dark"
                              : "bg-navi-surface border-transparent hover:bg-white"
                          )}
                        >
                          <Icon className="size-6" strokeWidth={1} />
                          <span className="text-[10px] font-display font-medium uppercase tracking-widest">
                            {option.label}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-navi-border/20 pt-8">
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant="secondary"
                    className="h-16 rounded-full"
                    onClick={() => setIsPickerOpen(false)}
                  >
                    <X className="size-5" />
                    <span>Cancel</span>
                  </Button>
                  <Button
                    className="h-16 rounded-full bg-navi-dark text-white"
                    onClick={handleSave}
                    disabled={upsertMutation.isPending}
                  >
                    <Save className="size-5" />
                    <span>Save</span>
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
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

const LayoutListIcon = CATEGORY_ICON_OPTIONS.find((option) => option.value === "LayoutList")!.icon;
