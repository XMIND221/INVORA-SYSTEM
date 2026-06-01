import eventHero from "@/assets/event-hero.jpg";

interface EventCardProps {
  title?: string;
  date?: string;
  location?: string;
  tag?: string;
  image?: string;
}

export function EventCard({
  title = "Obsidian Gala",
  date = "24 DÉC",
  location = "Paris, FR",
  tag = "Privé",
  image = eventHero,
}: EventCardProps) {
  return (
    <article className="relative p-1 rounded-[28px] bg-gradient-to-b from-white/[0.12] to-transparent">
      <div className="relative bg-surface rounded-[24px] overflow-hidden border border-white/5">
        {/* Image with smart overlay for legibility */}
        <div className="relative w-full aspect-[4/5] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            width={1024}
            height={1280}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

          {/* Top meta */}
          <div className="absolute top-0 inset-x-0 p-5 flex items-start justify-between">
            <span className="eyebrow text-white/70">Invora Pass</span>
            <span className="px-2.5 py-1 border border-white/25 rounded-full text-[10px] uppercase tracking-widest font-medium text-white/90 backdrop-blur-sm">
              {tag}
            </span>
          </div>

          {/* Bottom content */}
          <div className="absolute bottom-0 inset-x-0 p-6">
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/70 mb-2">
              {date} · {location}
            </p>
            <h3 className="font-serif italic text-3xl leading-none text-white mb-5">
              {title}
            </h3>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">
                  Statut
                </p>
                <span className="text-xs font-medium text-white/95">Confirmé</span>
              </div>
              <div className="p-2 bg-white rounded-lg">
                <div className="size-10 grid grid-cols-4 gap-[2px] p-[2px]">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-[1px] ${i % 3 === 0 || i === 5 || i === 10 ? "bg-black" : "bg-black/10"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tear-off footer */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex-1 hairline" />
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-muted-foreground">
            Invora · Pass #4827
          </span>
          <div className="flex-1 hairline" />
        </div>
      </div>
    </article>
  );
}
