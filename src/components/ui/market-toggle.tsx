
import React from "react";
import { Globe, IndianRupee } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMarket } from "@/hooks/use-market";

export function MarketToggle() {
  const { market, setMarket } = useMarket();

  return (
    <div className="flex items-center">
      <ToggleGroup type="single" value={market} onValueChange={(value) => value && setMarket(value as "global" | "india")}>
        <ToggleGroupItem value="global" aria-label="Global Markets" className="flex items-center gap-1">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Global</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="india" aria-label="Indian Markets" className="flex items-center gap-1">
          <IndianRupee className="h-4 w-4" />
          <span className="hidden sm:inline">India</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
