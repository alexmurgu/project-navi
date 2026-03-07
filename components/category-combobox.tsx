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
}

export function CategoryCombobox({
  value,
  options,
  onChange,
  className,
  placeholder = "Select category...",
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const showAddNew =
    searchValue !== "" &&
    !options.some((c) => c.toLowerCase() === searchValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-12 w-full justify-between border-white/10 bg-black/20 text-white font-normal hover:bg-white/5",
            className
          )}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="glass-panel w-[200px] border-white/10 p-0 text-left shadow-2xl"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search categories..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-11 border-none bg-transparent text-white"
          />
          <CommandList className="max-h-[200px] overflow-y-auto text-left">
            <CommandEmpty className="px-4 py-2 text-left text-xs text-white/50">
              {!showAddNew && "No category found."}
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
                  className="cursor-pointer text-left text-white hover:bg-white/10 aria-selected:bg-white/10"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === cat ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {cat}
                </CommandItem>
              ))}
            </CommandGroup>
            {showAddNew && (
              <CommandGroup heading="New" className="text-left">
                <CommandItem
                  value={searchValue}
                  onSelect={(val) => {
                    onChange(val);
                    setOpen(false);
                    setSearchValue("");
                  }}
                  className="cursor-pointer text-left font-bold text-primary hover:bg-primary/10 aria-selected:bg-primary/10"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add "{searchValue}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
