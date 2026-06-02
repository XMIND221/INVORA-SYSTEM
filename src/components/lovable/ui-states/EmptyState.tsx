import { Link } from 'react-router-dom';

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaTo,
}: {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaTo?: string;
}) {
  return (
    <div className="py-12 px-4 text-center border border-dashed border-border rounded-2xl">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">{description}</p>
      {ctaLabel && ctaTo ? (
        <Link
          to={ctaTo}
          className="inline-block mt-4 text-xs uppercase tracking-[0.2em] text-foreground hover:opacity-80"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
