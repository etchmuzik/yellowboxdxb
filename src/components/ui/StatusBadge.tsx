
import { cn } from "@/lib/utils";
import { TestStatus, ApplicationStage } from "@/types";

interface TestStatusBadgeProps {
  status: TestStatus;
  className?: string;
}

export function TestStatusBadge({ status, className }: TestStatusBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        status === "Pass" && "bg-green-100 text-green-800",
        status === "Fail" && "bg-red-100 text-red-800",
        status === "Pending" && "bg-yellow-100 text-yellow-800",
        className
      )}
    >
      {status}
    </div>
  );
}

interface StageBadgeProps {
  stage: ApplicationStage;
  className?: string;
  size?: "default" | "large";
}

export function StageBadge({ stage, className, size = "default" }: StageBadgeProps) {
  // Define color mapping for stages
  const stageColors: Record<ApplicationStage, { bg: string; text: string }> = {
    "Applied": { bg: "bg-slate-100", text: "text-slate-800" },
    "Docs Verified": { bg: "bg-blue-100", text: "text-blue-800" },
    "Theory Test": { bg: "bg-purple-100", text: "text-purple-800" },
    "Road Test": { bg: "bg-indigo-100", text: "text-indigo-800" },
    "Medical": { bg: "bg-cyan-100", text: "text-cyan-800" },
    "ID Issued": { bg: "bg-teal-100", text: "text-teal-800" },
    "Active": { bg: "bg-green-100", text: "text-green-800" },
  };

  // Provide fallback for unknown stages
  const colorConfig = stageColors[stage] || { bg: "bg-gray-100", text: "text-gray-800" };
  const { bg, text } = colorConfig;
  
  // Log warning if unknown stage is encountered
  if (!stageColors[stage]) {
    console.warn(`Unknown application stage: "${stage}". Using default colors.`);
  }

  return (
    <div
      className={cn(
        "inline-flex items-center px-2 py-1 rounded font-medium",
        size === "default" ? "text-xs" : "text-sm px-3 py-1.5",
        bg,
        text,
        className
      )}
    >
      {stage}
    </div>
  );
}
