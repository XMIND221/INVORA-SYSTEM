import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

interface NextActionCardProps {
  label?: string;
  title: string;
  description: string;
  to: string;
  cta?: string;
}

export function NextActionCard({
  label = 'Prochaine action',
  title,
  description,
  to,
  cta = 'Continuer',
}: NextActionCardProps) {
  return (
    <Link
      to={to}
      className="block p-5 mb-6 rounded-2xl bg-gradient-to-br from-primary to-white/90 text-primary-foreground active:scale-[0.99] transition"
    >
      <p className="text-[10px] uppercase tracking-[0.25em] opacity-60 mb-2">{label}</p>
      <p className="font-serif italic text-xl leading-tight mb-1">{title}</p>
      <p className="text-xs opacity-70 mb-3">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{cta}</span>
        <span className="size-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
