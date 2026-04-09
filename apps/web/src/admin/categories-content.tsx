import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface CategoriesContentProps {
    expenseCategories: string[];
    incomeCategories: string[];
    configMap: Record<string, { id: string, name: string, color: string }>;
}

export function CategoriesContent({ expenseCategories, incomeCategories, configMap }: CategoriesContentProps) {
    const queryClient = useQueryClient();
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const colors = [
        "#F87171", "#FB923C", "#FBBF24", "#34D399", "#22D3EE", "#38BDF8", "#818CF8", "#A78BFA", "#F472B6",
        "#EF4444", "#F97316", "#F59E0B", "#10B981", "#06B6D4", "#0EA5E9", "#6366F1", "#8B5CF6", "#EC4899",
        "#B91C1C", "#C2410C", "#B45309", "#047857", "#0E7490", "#0369A1", "#4338CA", "#6D28D9", "#BE185D"
    ];

    const upsertMutation = useMutation({
        mutationFn: (data: { name: string, color: string }) => axios.post('/api/admin/categories', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setIsPickerOpen(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => axios.delete(`/api/admin/categories/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    });

    const handleColorSelect = (color: string) => {
        if (activeCategory) {
            upsertMutation.mutate({ name: activeCategory, color });
        }
    };

    const renderCategoryTable = (names: string[], title: string, description: string) => (
        <Card className="rounded-xl shadow-sm border bg-card overflow-hidden">
            <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-6">Category</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Visual Marker</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {names.sort().map((name) => {
                            const config = configMap[name];
                            return (
                                <TableRow key={name} className="transition-colors group hover:bg-muted/50">
                                    <TableCell className="font-medium text-sm pl-6">{name}</TableCell>
                                    <TableCell>
                                        <button 
                                            onClick={() => { setActiveCategory(name); setIsPickerOpen(true); }}
                                            className="group relative flex items-center gap-3 rounded-lg border p-1 pr-3 hover:bg-background transition-colors shadow-sm"
                                        >
                                            <div 
                                                className="size-6 rounded-md shadow-sm transition-transform"
                                                style={{ backgroundColor: config?.color || "#E5E7EB" }}
                                            />
                                            <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                                                {config?.color || "DEFAULT"}
                                            </span>
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        {config ? (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => {
                                                    if (confirm(`Reset visual configuration for "${name}"?`)) {
                                                        deleteMutation.mutate(config.id);
                                                    }
                                                }}
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors h-9 w-9"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest mr-2">No Config</span>
                                        )}
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
                {renderCategoryTable(expenseCategories, "Outflow Classifications", "Visual identifiers for your spending")}
                {renderCategoryTable(incomeCategories, "Inflow Classifications", "Visual identifiers for your earnings")}
            </div>

            <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                <DialogContent className="rounded-xl border shadow-sm max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Select Marker Color</DialogTitle>
                        <DialogDescription>Choose a color for {activeCategory}</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-6 gap-3 p-4">
                        {colors.map((color) => (
                            <button
                                key={color}
                                onClick={() => handleColorSelect(color)}
                                className="size-8 rounded-full border shadow-sm transition-transform hover:scale-110 active:scale-95 flex items-center justify-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                style={{ backgroundColor: color }}
                            >
                                {configMap[activeCategory || ""]?.color === color && <Check className="h-4 w-4 text-white mix-blend-difference" />}
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
