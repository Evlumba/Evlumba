import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export type Designer = {
  id: string;
  name: string;
  city: string;
  specialty: string;
  rating: number;
  projects: number;
  coverUrl: string;
  avatarUrl: string;
};

export default function DesignerCard({ d }: { d: Designer }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-100">
          <img
            src={d.coverUrl}
            alt={`${d.name} kapak`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="absolute left-4 bottom-4 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl overflow-hidden border border-white/60 shadow">
            <img
              src={d.avatarUrl}
              alt={`${d.name} avatar`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="rounded-2xl bg-white/75 backdrop-blur px-3 py-2 border border-white/70">
            <div className="text-sm font-semibold text-neutral-900">{d.name}</div>
            <div className="text-xs text-neutral-600">
              {d.city} • {d.specialty}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between text-xs text-neutral-600">
          <span>⭐ {d.rating.toFixed(1)}</span>
          <span>{d.projects} proje</span>
        </div>

        <div className="mt-4 flex gap-2">
          <Button href="/tasarimcilar" variant="secondary" className="flex-1">
            Profili Gör
          </Button>
          <Button href="/tasarimcilar" variant="primary" className="flex-1">
            Takip Et
          </Button>
        </div>
      </div>
    </Card>
  );
}
