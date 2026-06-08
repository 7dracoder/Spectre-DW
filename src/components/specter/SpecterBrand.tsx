import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SpecterBrandProps {
  to?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showWordmark?: boolean;
}

const sizeMap = {
  sm: { frame: "h-7 w-7", text: "text-base" },
  md: { frame: "h-9 w-9", text: "text-xl" },
  lg: { frame: "h-12 w-12", text: "text-2xl" },
};

const SpecterBrand = ({
  to = "/",
  size = "md",
  className,
  showWordmark = true,
}: SpecterBrandProps) => {
  const s = sizeMap[size];
  const content = (
    <span className={cn("flex items-center gap-2", className)}>
      <span className={cn(s.frame, "relative block overflow-hidden")} aria-hidden="true">
        <img
          src="/specter-logo.png"
          alt=""
          className="absolute inset-0 h-full w-full scale-[2.65] object-contain"
        />
      </span>
      {showWordmark && (
        <span
          className={cn(
            s.text,
            "font-display font-semibold tracking-[-0.02em] text-foreground"
          )}
        >
          Specter
        </span>
      )}
    </span>
  );
  return to ? <Link to={to}>{content}</Link> : content;
};

export default SpecterBrand;
