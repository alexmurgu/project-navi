import React from "react";
import { User as UserIcon, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  name: string;
  email?: string;
}

interface UserSelectorProps {
  users: User[];
  selectedUserId: string;
  onSelect: (userId: string) => void;
}

export function UserSelector({ users, selectedUserId, onSelect }: UserSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <Label id="assign-member-label" className="text-[11px] font-display font-medium uppercase tracking-[0.25em] text-navi-gray/60">
          Assign Member
        </Label>
        <span className="text-[10px] font-display font-medium uppercase tracking-widest text-navi-blue">
          {selectedUserId === "family" ? "Family Wide" : users.find(u => u.id === selectedUserId)?.name}
        </span>
      </div>
      <div className="flex flex-wrap gap-3" role="group" aria-labelledby="assign-member-label">
        <button
          type="button"
          onClick={() => onSelect("family")}
          className={cn(
            "flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all active:scale-[0.98]",
            selectedUserId === "family"
              ? "bg-navi-dark border-navi-dark text-white shadow-lg shadow-navi-dark/20"
              : "bg-navi-surface border-transparent text-navi-dark hover:bg-white/50"
          )}
        >
          <div className={cn(
            "size-8 rounded-full flex items-center justify-center",
            selectedUserId === "family" ? "bg-white/20" : "bg-white shadow-sm"
          )}>
            <Users className="size-4" strokeWidth={1.2} />
          </div>
          <span className="text-sm font-display font-medium">Family</span>
        </button>

        {users.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => onSelect(user.id)}
            className={cn(
              "flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all active:scale-[0.98]",
              selectedUserId === user.id
                ? "bg-navi-dark border-navi-dark text-white shadow-lg shadow-navi-dark/20"
                : "bg-navi-surface border-transparent text-navi-dark hover:bg-white/50"
            )}
          >
            <div className={cn(
              "size-8 rounded-full flex items-center justify-center",
              selectedUserId === user.id ? "bg-white/20" : "bg-white shadow-sm"
            )}>
              <UserIcon className="size-4" strokeWidth={1.2} />
            </div>
            <span className="text-sm font-display font-medium truncate max-w-[100px]">
              {user.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
