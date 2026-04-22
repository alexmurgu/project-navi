"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CategoryIcon, type CategoryConfig, getCategoryConfig, withAlpha } from "@/lib/category-visuals";

interface CategoryComboboxProps {
  value: string;
  // Support both 'options' and 'categories' for backward compatibility
  options?: string[];
  categories?: string[];
  // Support both 'onChange' and 'onValueChange' for backward compatibility
  onChange?: (val: string) => void;
  onValueChange?: (val: string) => void;
  categoryConfigs?: CategoryConfig[];
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  kind?: "expense" | "income";
  id?: string;
}

export function CategoryCombobox({
  value,
  options: legacyOptions,
  categories,
  onChange: legacyOnChange,
  onValueChange,
  categoryConfigs = [],
  className,
  placeholder = "Select category...",
  style,
  id,
}: CategoryComboboxProps) {
  const finalOptions = categories || legacyOptions || [];
  const finalOnChange = onValueChange || legacyOnChange || (() => {});
  
  const listboxId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const categoryConfigMap = React.useMemo(() => {
    const map: Record<string, CategoryConfig> = {};
    categoryConfigs.forEach((config) => {
      map[config.name] = config;
    });
    return map;
  }, [categoryConfigs]);

  const config = getCategoryConfig(categoryConfigMap, value);
  const color = config?.color || "#494fdf";

  const showAddNew =
    searchValue !== "" && !finalOptions.some((c) => c.toLowerCase() === searchValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="secondary"
            role="combobox"
            aria-controls={listboxId}
            aria-expanded={open}
            className={cn(
              "flex h-14 flex-1 items-center justify-between rounded-2xl border-none bg-navi-surface px-6 text-base font-display font-medium transition-all hover:bg-white/50 shadow-sm",
              className,
            )}
            style={style}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {value && (
                <div 
                  className="size-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: withAlpha(color, 0.1), color: color }}
                >
                  <CategoryIcon category={value} config={config} className="size-3.5" color={color} strokeWidth={1.5} />
                </div>
              )}
              <span
                className={cn(
                  "truncate",
                  value ? "text-navi-dark" : "text-navi-gray/40 font-sans uppercase text-[10px] tracking-widest",
                )}
              >
                {value || placeholder}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-20" />
          </Button>
        }
      />
      <PopoverContent
        className="w-(--radix-popover-trigger-width) rounded-3xl border-none p-2 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.35)] bg-white/95 backdrop-blur-xl"
        align="start"
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Search categories..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-12 border-none bg-transparent text-sm font-display font-medium"
          />
          <CommandList id={listboxId} className="max-h-[300px] overflow-y-auto">
            <CommandEmpty className="px-6 py-8 text-center">
              {!showAddNew && (
                <p className="text-[10px] font-display font-medium uppercase tracking-widest text-navi-gray/40">
                  No results found
                </p>
              )}
            </CommandEmpty>
            <CommandGroup className="**:[[cmdk-group-items]]:space-y-1 p-1">
              {finalOptions.map((cat) => {
                const itemConfig = getCategoryConfig(categoryConfigMap, cat);
                const itemColor = itemConfig?.color || "#494fdf";
                return (
                  <CommandItem
                    key={cat}
                    value={cat}
                    onSelect={(val) => {
                      finalOnChange(val);
                      setOpen(false);
                      setSearchValue("");
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-navi-surface data-[selected=true]:bg-navi-surface transition-colors"
                  >
                    <div 
                      className="size-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: withAlpha(itemColor, 0.05), color: itemColor }}
                    >
                      <CategoryIcon category={cat} config={itemConfig} className="size-4" color={itemColor} strokeWidth={1.2} />
                    </div>
                    <span className="flex-1 font-display font-medium text-sm text-navi-dark">{cat}</span>
                    {value === cat && <Check className="size-4 text-navi-blue" strokeWidth={2} />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {showAddNew && (
              <CommandGroup className="p-1 border-t border-navi-border/10 mt-1">
                <CommandItem
                  value={searchValue}
                  onSelect={(val) => {
                    finalOnChange(val);
                    setOpen(false);
                    setSearchValue("");
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-navi-blue/5 data-[selected=true]:bg-navi-blue/5 text-navi-blue transition-colors"
                >
                  <div className="size-8 rounded-xl bg-navi-blue/10 flex items-center justify-center shrink-0">
                    <PlusCircle className="size-4" strokeWidth={1.5} />
                  </div>
                  <span className="flex-1 font-display font-medium text-sm">Create &quot;{searchValue}&quot;</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
