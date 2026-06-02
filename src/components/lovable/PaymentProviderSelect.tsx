import type { PaymentProvider } from '@/types/payments';

interface Props {
  providers: PaymentProvider[];
  value: string;
  onChange: (id: string) => void;
}

export function PaymentProviderSelect({ providers, value, onChange }: Props) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label="Mode de paiement">
      {providers.map((p) => (
        <label
          key={p.id}
          className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
            value === p.id ? 'border-border-strong bg-surface' : 'border-border bg-surface/50'
          }`}
        >
          <div>
            <div className="text-sm font-medium">{p.displayName}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
              {p.providerType === 'card' ? 'Carte' : 'Mobile money'}
            </div>
          </div>
          <input
            type="radio"
            name="provider"
            value={p.id}
            checked={value === p.id}
            onChange={() => onChange(p.id)}
            className="size-4 accent-foreground"
          />
        </label>
      ))}
    </div>
  );
}
