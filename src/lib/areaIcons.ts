import {TrendingUp, Workflow, FileStack, Activity, type LucideIcon} from "lucide-react";

export const AREA_ICONS: Record<string, LucideIcon> = {
  "trending-up": TrendingUp,
  workflow: Workflow,
  "file-stack": FileStack,
  activity: Activity,
};

export const areaIcon = (key?: string): LucideIcon => AREA_ICONS[key ?? ""] ?? Activity;
