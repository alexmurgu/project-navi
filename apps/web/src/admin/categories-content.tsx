import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Check, Save, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CATEGORY_ICON_OPTIONS, CategoryIcon, type CategoryConfig, withAlpha } from "@/lib/category-visuals";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface CategoriesContentProps {
    expenseCategories: string[];
    incomeCategories: string[];
    configMap: Record<string, CategoryConfig>;
}

export function CategoriesContent({ expenseCategories, incomeCategories, configMap }: CategoriesContentProps) {
    const queryClient = useQueryClient();
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [draftColor, setDraftColor] = useState<string>("#F59E0B");
    const [draftIcon, setDraftIcon] = useState<string | null>(null);

    const colors = useMemo(() => [
        "#F87171", "#FB923C", "#FBBF24", "#34D399", "#22D3EE", "#38BDF8", "#818CF8", "#A78BFA", "#F472B6",
        "#EF4444", "#F97316", "#F59E0B", "#10B981", "#06B6D4", "#0EA5E9", "#6366F1", "#8B5CF6", "#EC4899",
        "#B91C1C", "#C2410C", "#B45309", "#047857", "#0E7490", "#0369A1", "#4338CA", "#6D28D9", "#BE185D"
    ], []);

    const upsertMutation = useMutation({
        mutationFn: (data: { name: string, color: string, icon: string | null }) => axios.post('/api/admin/categories', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setIsPickerOpen(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => axios.delete(`/api/admin/categories/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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
        <Card className="rounded-xl shadow-sm border bg-card overflow-hidden">
            <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-6">Category</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {names.sort().map((name) => {
                            const config = configMap[name];
                            return (
                                <TableRow
                                    key={name}
                                    className="group cursor-pointer transition-colors hover:bg-muted/50"
                                    onClick={() => { setActiveCategory(name); setIsPickerOpen(true); }}
                                >
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-4 py-1.5">
                                            <div
                                                className="size-11 rounded-xl shadow-sm flex items-center justify-center shrink-0"
                                                style={{
                                                    backgroundColor: config?.color ? withAlpha(config.color, 0.12) : "#E5E7EB",
                                                    color: config?.color || "#6B7280"
                                                }}
                                            >
                                                <CategoryIcon category={name} config={config} className="size-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm tracking-tight text-foreground truncate">{name}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    return (
        <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-4 pt-6 md:p-8 bg-background text-foreground antialiased">
            <div className="grid gap-8 lg:grid-cols-2 items-start">
                {renderCategoryTable(expenseCategories, "Expense Categories")}
                {renderCategoryTable(incomeCategories, "Income Categories")}
            </div>

            <Sheet open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                <SheetContent side="bottom" className="h-[90vh] sm:h-fit sm:side-right border-t sm:border-l rounded-t-2xl sm:rounded-l-2xl p-0 shadow-2xl border-none">
                    <div className="h-full overflow-y-auto">
                        <SheetHeader className="border-b pb-5">
                            <SheetTitle className="text-lg font-semibold">Customize {activeCategory}</SheetTitle>
                            <SheetDescription>Tap a color and icon for {activeCategory}</SheetDescription>
                        </SheetHeader>
                        <div className="space-y-8 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
                                    <p className="text-sm font-medium text-foreground/70">{activeCategory}</p>
                                </div>
                                <div
                                    className="flex items-center gap-3 rounded-full border px-3 py-2"
                                    style={{
                                        borderColor: withAlpha(draftColor, 0.22),
                                        backgroundColor: withAlpha(draftColor, 0.08),
                                        color: draftColor
                                    }}
                                >
                                    <div
                                        className="size-9 rounded-full flex items-center justify-center shadow-sm"
                                        style={{
                                            backgroundColor: withAlpha(draftColor, 0.16),
                                            color: draftColor
                                        }}
                                    >
                                        {draftIcon ? (
                                            <CategoryIcon category={activeCategory || ""} config={{ name: activeCategory || "", color: draftColor, icon: draftIcon }} className="size-4" />
                                        ) : (
                                            <CategoryIcon category={activeCategory || ""} config={{ name: activeCategory || "", color: draftColor }} className="size-4" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-[10px] font-black uppercase tracking-[0.22em]">{activeCategory}</p>
                                        <p className="truncate text-[10px] text-muted-foreground">{draftIcon || "Default"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Color</p>
                                    <span className="text-[10px] font-mono text-muted-foreground">{draftColor}</span>
                                </div>
                                <div className="grid grid-cols-6 gap-3 sm:grid-cols-9">
                                    {colors.map((color) => {
                                        const selected = draftColor === color;
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                aria-label={`Choose color ${color}`}
                                                onClick={() => setDraftColor(color)}
                                                className={cn(
                                                    "size-10 rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                                    selected ? "scale-110 ring-2 ring-foreground ring-offset-2" : "hover:scale-105"
                                                )}
                                                style={{
                                                    backgroundColor: color,
                                                    boxShadow: selected ? "0 0 0 1px rgba(255,255,255,0.8), 0 8px 20px rgba(0,0,0,0.12)" : "0 4px 10px rgba(0,0,0,0.08)"
                                                }}
                                            >
                                                {selected && <Check className="mx-auto size-4 text-white mix-blend-difference" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Icon</p>
                                    <span className="text-[10px] font-mono text-muted-foreground">{draftIcon || "Default"}</span>
                                </div>
                                <div className="grid max-h-[34vh] grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4 md:grid-cols-6">
                                    <button
                                        type="button"
                                        aria-label="Choose default icon"
                                        onClick={() => setDraftIcon(null)}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                            draftIcon === null ? "border-foreground bg-foreground text-background shadow-sm" : "bg-background hover:bg-muted/30"
                                        )}
                                    >
                                        <div className={cn("size-9 rounded-full flex items-center justify-center", draftIcon === null ? "bg-white/10" : "bg-muted/20")}>
                                            <LayoutListIcon className="size-4" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.16em]">Default</span>
                                    </button>
                                    {CATEGORY_ICON_OPTIONS.filter((option) => option.value !== "LayoutList").map((option) => {
                                        const Icon = option.icon;
                                        const selected = draftIcon === option.value;
                                        return (
                                            <button
                                                type="button"
                                                aria-label={`Choose icon ${option.label}`}
                                                key={option.value}
                                                onClick={() => setDraftIcon(option.value)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                                    selected ? "border-foreground bg-foreground text-background shadow-sm" : "bg-background hover:bg-muted/30"
                                                )}
                                            >
                                                <div className={cn("size-9 rounded-full flex items-center justify-center", selected ? "bg-white/10" : "bg-muted/20")}>
                                                    <Icon className="size-4" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.16em] leading-none">{option.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="grid grid-cols-[1fr_1fr_1.15fr] gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-14 w-full rounded-2xl font-black uppercase tracking-[0.18em]"
                                        onClick={() => setIsPickerOpen(false)}
                                    >
                                        <X className="size-4" />
                                        <span>Cancel</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        className="h-14 w-full rounded-2xl font-black uppercase tracking-[0.18em]"
                                        onClick={handleSave}
                                        disabled={upsertMutation.isPending}
                                    >
                                        <Save className="size-4" />
                                        <span>Save</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        className="h-14 w-full rounded-2xl font-black uppercase tracking-[0.18em]"
                                        onClick={handleDelete}
                                        disabled={upsertMutation.isPending || deleteMutation.isPending || !configMap[activeCategory || ""]?.id}
                                    >
                                        <Trash2 className="size-4" />
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
