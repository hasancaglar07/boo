import Link from "next/link";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthAlertVariant = "success" | "error" | "info" | "warning";

type AuthAlertProps = {
  variant: AuthAlertVariant;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

const variantStyles: Record<
  AuthAlertVariant,
  { wrapper: string; icon: string; role: "alert" | "status"; iconNode: React.ReactNode }
> = {
  success: {
    wrapper: "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-400",
    role: "status",
    iconNode: <CheckCircle2 className="size-5" />,
  },
  error: {
    wrapper: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: "text-destructive",
    role: "alert",
    iconNode: <AlertCircle className="size-5" />,
  },
  info: {
    wrapper: "border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-300",
    icon: "text-sky-600 dark:text-sky-400",
    role: "status",
    iconNode: <Info className="size-5" />,
  },
  warning: {
    wrapper: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300",
    icon: "text-amber-600 dark:text-amber-400",
    role: "alert",
    iconNode: <TriangleAlert className="size-5" />,
  },
};

export function AuthAlert({
  variant,
  title,
  description,
  actionHref,
  actionLabel,
  className,
}: AuthAlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      role={styles.role}
      aria-live="polite"
      className={cn(
        "rounded-2xl border px-4 py-4 shadow-sm backdrop-blur-sm",
        styles.wrapper,
        className,
      )}
    >
      <div className="flex gap-3">
        <div className={cn("mt-0.5 shrink-0", styles.icon)}>{styles.iconNode}</div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold leading-6">{title}</p>
          <p className="text-sm leading-6 opacity-90">{description}</p>
          {actionHref && actionLabel ? (
            <Link href={actionHref} className="inline-flex pt-1 text-sm font-semibold underline underline-offset-4">
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
