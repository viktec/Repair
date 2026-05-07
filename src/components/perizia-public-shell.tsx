import { Wrench } from "lucide-react";

type Props = {
  orgName: string;
  logoUrl: string | null;
  primaryColor: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
};

export function PeriziaPublicShell({ orgName, logoUrl, primaryColor, children, maxWidth = "lg" }: Props) {
  const widthClass = maxWidth === "sm" ? "max-w-sm" : maxWidth === "md" ? "max-w-md" : "max-w-lg";

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className={`mx-auto ${widthClass}`}>
        {/* Header brandizzato */}
        <div className="flex flex-col items-center gap-2 mb-8">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={orgName}
              className="h-14 max-w-[200px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6" style={{ color: primaryColor }} />
              <span className="text-xl font-bold text-foreground">{orgName}</span>
            </div>
          )}
          {logoUrl && (
            <span className="text-base font-semibold text-foreground">{orgName}</span>
          )}
        </div>

        {/* Contenuto */}
        <div
          className="rounded-2xl bg-white border shadow-sm p-6"
          style={{ "--brand-color": primaryColor } as React.CSSProperties}
        >
          {children}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by{" "}
          <span className="font-medium" style={{ color: primaryColor }}>
            my-repair.it
          </span>
        </p>
      </div>
    </div>
  );
}

export function BrandAccent({ color, children }: { color: string; children: React.ReactNode }) {
  return <span style={{ color }}>{children}</span>;
}

export function BrandButton({
  color,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { color: string }) {
  return (
    <button
      {...props}
      className={`w-full rounded-xl py-3 px-6 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 ${className}`}
      style={{ backgroundColor: color }}
    >
      {children}
    </button>
  );
}
