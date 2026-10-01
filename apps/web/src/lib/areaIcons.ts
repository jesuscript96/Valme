import {
  TrendingUp,
  Workflow,
  FileStack,
  Activity,
  Compass,
  Megaphone,
  Search,
  Users,
  Palette,
  PenTool,
  MousePointerClick,
  Database,
  type LucideIcon,
} from "lucide-react";

export const AREA_ICONS: Record<string, LucideIcon> = {
  // Áreas de operaciones (/areas/*)
  "trending-up": TrendingUp,
  workflow: Workflow,
  "file-stack": FileStack,
  activity: Activity,
  // Las ocho funciones de marketing (home)
  compass: Compass,
  megaphone: Megaphone,
  search: Search,
  users: Users,
  palette: Palette,
  "pen-tool": PenTool,
  "mouse-pointer-click": MousePointerClick,
  database: Database,
};

export const areaIcon = (key?: string): LucideIcon => AREA_ICONS[key ?? ""] ?? Activity;
