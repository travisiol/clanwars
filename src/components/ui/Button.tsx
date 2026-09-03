import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/*
 * One filled button, in gold, because gold on this site means "a war is
 * open" and the filled button is how you open one. Everything else is an
 * outline.
 *
 * A disabled button keeps its label and states its reason underneath. A grey
 * rectangle with no explanation is the failure this page is arranged against.
 */
const base =
  "type-label inline-flex items-center justify-center gap-2 px-4 py-3 transition-colors duration-150 disabled:cursor-not-allowed";

export function Button({
  children,
  variant = "solid",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "solid" | "outline";
}) {
  return (
    <button
      type="button"
      className={clsx(
        base,
        variant === "solid"
          ? "bg-gold text-void hover:bg-gold-bright disabled:bg-transparent disabled:text-chalk-muted disabled:ring-1 disabled:ring-rule-strong disabled:ring-inset"
          : "text-chalk ring-1 ring-rule-strong ring-inset hover:bg-chalk hover:text-void disabled:text-chalk-muted",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  className,
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <a href={href} className={clsx(base, "bg-gold text-void hover:bg-gold-bright", className)}>
      {children}
    </a>
  );
}
