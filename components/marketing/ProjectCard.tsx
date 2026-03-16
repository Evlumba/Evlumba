import { Card } from "@/components/ui/Card";

export type Project = {
  id: string;
  title: string;
  tag: string;
  imageUrl: string;
};

export default function ProjectCard({ p }: { p: Project }) {
  return (
    <Card className="overflow-hidden hover:-translate-y-0.5 transition">
      <div className="aspect-4/3 bg-neutral-100 overflow-hidden">
        <img
          src={p.imageUrl}
          alt={p.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <div className="text-xs text-neutral-500">{p.tag}</div>
        <div className="mt-1 text-sm font-semibold text-neutral-900">
          {p.title}
        </div>
      </div>
    </Card>
  );
}
