import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { DatabaseUser } from "@/database/schema";

interface BanDetailsCardProps {
  user: DatabaseUser;
}

export function BanDetailsCard({ user }: BanDetailsCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Badge variant="destructive" className="cursor-help">
          Banned
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Ban Details</h4>
            <p className="text-sm text-muted-foreground">
              {user.banReason || "No reason provided."}
            </p>
            <div className="flex items-center pt-2">
              <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
              <span className="text-xs text-muted-foreground">
                {user.banExpires
                  ? `Expires ${format(new Date(user.banExpires), "PPP")}`
                  : "Permanent Ban"}
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
