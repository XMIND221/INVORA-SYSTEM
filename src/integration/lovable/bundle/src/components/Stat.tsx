interface StatProps {
  label: string;
  value: string;
  trend?: string;
}

export function Stat({ label, value, trend }: StatProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <span className="font-serif text-2xl leading-none">{value}</span>
      {trend ? (
        <span className="font-mono text-[10px] text-muted-foreground">{trend}</span>
      ) : null}
    </div>
  );
}
