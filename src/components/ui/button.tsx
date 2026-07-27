import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" && "h-8 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-5 text-base",
        variant === "primary" &&
          "bg-accent text-accent-foreground hover:bg-teal-800 shadow-sm",
        variant === "secondary" &&
          "bg-white text-foreground border border-border hover:bg-slate-50",
        variant === "ghost" && "text-muted hover:bg-slate-100 hover:text-foreground",
        variant === "danger" && "bg-danger text-white hover:bg-red-800",
        className,
      )}
      {...props}
    />
  );
}
