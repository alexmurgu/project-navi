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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CategoryComboboxProps {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function CategoryCombobox({
  value,
  options,
  onChange,
  className,
  placeholder = "Select category...",
  style,
}: CategoryComboboxProps) {
  const listboxId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const showAddNew =
    searchValue !== "" &&
    !options.some((c) => c.toLowerCase() === searchValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-controls={listboxId}
            aria-expanded={open}
            className={cn(
              "flex h-14 w-full items-center justify-between rounded-xl border-none bg-secondary/30 px-6 text-base font-black shadow-inner focus:ring-primary/20",
              className
            )}
            style={style}
          >
            <span className={cn(value ? "text-foreground" : "text-muted-foreground opacity-30 uppercase text-[10px] tracking-widest font-black")}>
              {value || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-30" />
          </Button>
        }
      />
      <PopoverContent
        className="glass-panel w-(--radix-popover-trigger-width) rounded-xl border-muted/20 p-2 shadow-2xl bg-card/80 backdrop-blur-xl"
        align="start"
        >
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Search categories..."
              value={searchValue}
            onValueChange={setSearchValue}
            className="h-10 border-none bg-transparent text-sm font-bold"
          />
          <CommandList id={listboxId} className="max-h-[300px] overflow-y-auto text-left">
            <CommandEmpty className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
              {!showAddNew && "No results"}
            </CommandEmpty>
            <CommandGroup>
              {options.map((cat) => (
                <CommandItem
                  key={cat}
                  value={cat}
                  onSelect={(val) => {
                    onChange(val);
                    setOpen(false);
                    setSearchValue("");
                  }}
                  className="cursor-pointer rounded-lg px-4 py-3 text-left text-sm font-bold hover:bg-muted/50 aria-selected:bg-muted/50 transition-colors"
                >
                  <Check
                    className={cn(
                      "mr-3 h-4 w-4",
                      value === cat ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {cat}
                </CommandItem>
              ))}
            </CommandGroup>
            {showAddNew && (
              <CommandGroup heading="New Category" className="text-left py-2 border-t border-muted/10 mt-2">
                <CommandItem
                  value={searchValue}
                  onSelect={(val) => {
                    onChange(val);
                    setOpen(false);
                    setSearchValue("");
                  }}
                  className="cursor-pointer rounded-lg px-4 py-3 text-left font-black text-primary text-[10px] uppercase tracking-[0.2em] hover:bg-primary/5 aria-selected:bg-primary/5"
                >
                  <PlusCircle className="mr-3 h-4 w-4" />
                  Add &quot;{searchValue}&quot;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
