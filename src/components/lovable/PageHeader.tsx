import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-4 mb-8">
      <div className="flex-1 min-w-0">
        <div className="eyebrow mb-3">{eyebrow}</div>
        <h1 className="text-3xl font-light leading-[1.05] tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
