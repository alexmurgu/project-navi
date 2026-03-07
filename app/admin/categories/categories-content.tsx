"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Palette, Save, Plus, Check } from "lucide-react";
import { upsertCategoryColor, deleteCategoryConfig } from "./actions";
import { cn } from "@/lib/utils";

interface CategoriesContentProps {
    allCategoryNames: string[];
    configMap: Record<string, { id: string; name: string; color: string }>;
}

const PRESET_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
    "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
    "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
    "#ec4899", "#f43f5e", "#94a3b8", "#ffffff", "#475569"
];

export function CategoriesContent({ allCategoryNames, configMap: initialConfigMap }: CategoriesContentProps) {
    const [selectedColor, setSelectedColor] = useState("#F59E0B");
    const [categoryName, setCategoryName] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [targetCategory, setTargetCategory] = useState<string | null>(null);

    const handleQuickColor = async (name: string, color: string) => {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("color", color);
        await upsertCategoryColor(formData);
        setModalOpen(false);
    };

    return (
        <div className="relative z-10 mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 pt-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="glass-panel col-span-4 h-fit border-white/10 lg:col-span-3 rounded-none">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"></div>
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2 text-xl text-white font-black uppercase tracking-tighter">
                            <Plus className="h-5 w-5 text-amber-400" />
                            New Category
                        </CardTitle>
                        <CardDescription className="text-white/60">
                            Create a new category and assign a color.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <form action={upsertCategoryColor} className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="name" className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">
                                    Category Name
                                </Label>
                                <Input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    placeholder="e.g. Groceries"
                                    className="h-12 border-white/10 bg-black/20 text-white text-base rounded-none uppercase"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">
                                    Pick Color
                                </Label>
                                <div className="grid grid-cols-5 gap-2">
                                    {PRESET_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setSelectedColor(c)}
                                            className={cn(
                                                "h-10 w-full border border-white/10 transition-all hover:scale-110 flex items-center justify-center",
                                                selectedColor === c ? "border-white ring-2 ring-white/20" : "opacity-60 hover:opacity-100"
                                            )}
                                            style={{ backgroundColor: c }}
                                        >
                                            {selectedColor === c && <Check className="h-4 w-4 text-white mix-blend-difference" />}
                                        </button>
                                    ))}
                                </div>
                                <input type="hidden" name="color" value={selectedColor} />
                            </div>

                            <Button
                                type="submit"
                                size="xl"
                                className="mt-4 w-full bg-amber-600 transition-all hover:bg-amber-500 rounded-none shadow-[0_0_30px_rgba(245,158,11,0.1)]"
                            >
                                <Save className="mr-2 h-5 w-5" /> Save Category
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="glass-panel col-span-4 border-white/10 rounded-none">
                    <CardHeader className="text-left">
                        <CardTitle className="text-xl text-white font-black uppercase tracking-tighter">Manage Categories</CardTitle>
                        <CardDescription className="text-white/60">
                            Click a row to quickly change its color from the palette.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-hidden border-t border-white/5 bg-black/20">
                            <Table>
                                <TableHeader className="bg-white/5">
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead>Category</TableHead>
                                        <TableHead>Color Preview</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allCategoryNames.map((name) => {
                                        const config = initialConfigMap[name];
                                        return (
                                            <TableRow 
                                                key={name} 
                                                className="group border-white/10 transition-colors hover:bg-white/5 cursor-pointer"
                                                onClick={() => {
                                                    setTargetCategory(name);
                                                    setModalOpen(true);
                                                }}
                                            >
                                                <TableCell className="font-bold text-white uppercase tracking-wider">
                                                    {name}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                            className="h-6 w-12 border border-white/20 shadow-xl" 
                                                            style={{ backgroundColor: config?.color || '#F59E0B' }}
                                                        />
                                                        <span className="font-mono text-white/50 text-xs">{config?.color || 'Default (#F59E0B)'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {config && (
                                                        <form action={deleteCategoryConfig} onClick={(e) => e.stopPropagation()}>
                                                            <input type="hidden" name="id" value={config.id} />
                                                            <Button
                                                                type="submit"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-10 w-10 text-white/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-400/10 hover:text-red-400 rounded-none"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </Button>
                                                        </form>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="glass-panel border-white/10 sm:max-w-md rounded-none shadow-2xl">
                    <DialogHeader className="text-left">
                        <DialogTitle className="text-white uppercase font-black tracking-tighter">Choose Color for {targetCategory}</DialogTitle>
                        <DialogDescription className="text-white/40">
                            Select a new theme color for this category.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-5 gap-3 py-6">
                        {PRESET_COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => targetCategory && handleQuickColor(targetCategory, c)}
                                className={cn(
                                    "h-14 w-full border border-white/10 transition-all hover:scale-110 hover:z-10 flex items-center justify-center",
                                    initialConfigMap[targetCategory!]?.color === c ? "border-white ring-2 ring-white/20" : "opacity-80 hover:opacity-100"
                                )}
                                style={{ backgroundColor: c }}
                            >
                                {initialConfigMap[targetCategory!]?.color === c && <Check className="h-6 w-6 text-white mix-blend-difference" />}
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
