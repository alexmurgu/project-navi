import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownCircle,
  Briefcase,
  Car,
  CircleDollarSign,
  Coffee,
  CreditCard,
  Dumbbell,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Landmark,
  LayoutList,
  Plane,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Store,
  Tag,
  Utensils,
  Wallet,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryKind = "expense" | "income";

export interface CategoryConfig {
  id?: string;
  name: string;
  color: string;
  icon?: string | null;
}

export type CategoryIconOption = {
  value: string;
  label: string;
  icon: LucideIcon;
};

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { value: "Tag", label: "Tag", icon: Tag },
  { value: "LayoutList", label: "Default", icon: LayoutList },
  { value: "CircleDollarSign", label: "Money", icon: CircleDollarSign },
  { value: "Wallet", label: "Wallet", icon: Wallet },
  { value: "PiggyBank", label: "Savings", icon: PiggyBank },
  { value: "ReceiptText", label: "Receipt", icon: ReceiptText },
  { value: "ShoppingBag", label: "Shopping", icon: ShoppingBag },
  { value: "Store", label: "Store", icon: Store },
  { value: "Coffee", label: "Coffee", icon: Coffee },
  { value: "Utensils", label: "Food", icon: Utensils },
  { value: "Home", label: "Home", icon: Home },
  { value: "Car", label: "Car", icon: Car },
  { value: "Plane", label: "Travel", icon: Plane },
  { value: "Gift", label: "Gift", icon: Gift },
  { value: "Heart", label: "Health", icon: Heart },
  { value: "Dumbbell", label: "Fitness", icon: Dumbbell },
  { value: "GraduationCap", label: "Education", icon: GraduationCap },
  { value: "Briefcase", label: "Work", icon: Briefcase },
  { value: "Landmark", label: "Income", icon: Landmark },
  { value: "CreditCard", label: "Card", icon: CreditCard },
  { value: "ShieldCheck", label: "Bills", icon: ShieldCheck },
  { value: "Shirt", label: "Style", icon: Shirt },
  { value: "Zap", label: "Utilities", icon: Zap }
];

const CATEGORY_ICON_MAP = Object.fromEntries(
  CATEGORY_ICON_OPTIONS.map((option) => [option.value, option.icon])
) as Record<string, LucideIcon>;

const DEFAULT_EXPENSE_ICON: LucideIcon = LayoutList;
const DEFAULT_INCOME_ICON: LucideIcon = ArrowDownCircle;

const stripHex = (color: string) => color.replace("#", "");

export const withAlpha = (color: string, alpha: number) => {
  const hex = stripHex(color).trim();
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    const expanded = hex.split("").map((char) => char + char).join("");
    return `rgba(${parseInt(expanded.slice(0, 2), 16)}, ${parseInt(expanded.slice(2, 4), 16)}, ${parseInt(expanded.slice(4, 6), 16)}, ${alpha})`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `rgba(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}, ${alpha})`;
  }
  return color;
};

export const getCategoryConfig = (
  configMap: Record<string, CategoryConfig | undefined>,
  category: string
) => configMap[category] ?? configMap[category.toLowerCase()] ?? configMap[category.trim()];

export const getCategoryIconComponent = (iconName?: string | null, kind?: CategoryKind) => {
  if (iconName && CATEGORY_ICON_MAP[iconName]) return CATEGORY_ICON_MAP[iconName];
  return kind === "income" ? DEFAULT_INCOME_ICON : DEFAULT_EXPENSE_ICON;
};

export const getCategoryFallbackIcon = (category: string, kind?: CategoryKind) => {
  const c = category.toLowerCase();
  if (kind === "income") {
    if (c.includes("salary") || c.includes("wage") || c.includes("work")) return Briefcase;
    if (c.includes("investment") || c.includes("dividend")) return Landmark;
    if (c.includes("gift") || c.includes("bonus")) return Gift;
    return DEFAULT_INCOME_ICON;
  }

  if (c.includes("food") || c.includes("eat") || c.includes("restaurant")) return Utensils;
  if (c.includes("shopping") || c.includes("cloth")) return ShoppingBag;
  if (c.includes("coffee") || c.includes("drink")) return Coffee;
  if (c.includes("housing") || c.includes("rent")) return Home;
  if (c.includes("transport") || c.includes("car")) return Car;
  if (c.includes("utility") || c.includes("bill")) return Zap;
  if (c.includes("health") || c.includes("med")) return Heart;
  return DEFAULT_EXPENSE_ICON;
};

export const CategoryIcon = ({
  category,
  config,
  kind,
  className = "size-5",
  fallbackClassName = "size-5",
  color
}: {
  category: string;
  config?: CategoryConfig;
  kind?: CategoryKind;
  className?: string;
  fallbackClassName?: string;
  color?: string;
}) => {
  const Icon = config?.icon ? getCategoryIconComponent(config.icon, kind) : getCategoryFallbackIcon(category, kind);
  return <Icon className={cn(className, !config?.icon && fallbackClassName)} style={{ color: color || config?.color || "currentColor" }} />;
};
