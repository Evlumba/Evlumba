export function SectionTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold tracking-wide text-neutral-500">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-neutral-900">
        {title}
      </h2>
      {desc ? (
        <p className="mt-3 text-sm md:text-base text-neutral-600 leading-relaxed">
          {desc}
        </p>
      ) : null}
    </div>
  );
}
