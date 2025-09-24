import { ReactNode } from "react";
import { cn } from "@/lib/utils"; // className merge helper

type DashboardCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  colorClass: string; // e.g. "orange" or "destructive"
  onClick: () => void;
};

const DashboardCard = ({ icon, title, description, colorClass, onClick }: DashboardCardProps) => {
  return (
    <div
      className="interactive-card group cursor-pointer"
      onClick={onClick}
    >
      <div className="text-center">
        {/* Icon circle */}
        <div
          className={cn(
            "w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors",
            `bg-${colorClass}/10 group-hover:bg-${colorClass}/20`
          )}
        >
          {icon}
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
};

export default DashboardCard;
