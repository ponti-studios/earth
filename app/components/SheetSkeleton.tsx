function Bone({ className }: { className: string }) {
  return <div className={`bg-border animate-pulse rounded ${className}`} />;
}

export default function SheetSkeleton() {
  return (
    <div className="space-y-3">
      {/* ← Cameras | status */}
      <div className="flex items-center justify-between">
        <Bone className="h-3 w-16" />
        <Bone className="h-3 w-10" />
      </div>

      {/* Camera name + id */}
      <div className="space-y-1.5">
        <Bone className="h-4 w-48" />
        <Bone className="h-2.5 w-36" />
      </div>

      {/* Metadata rows */}
      <div className="space-y-1.5 pt-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <Bone className="h-2.5 w-20" />
            <Bone className="h-2.5 w-28" />
          </div>
        ))}
      </div>

      {/* Image */}
      <Bone className="aspect-video w-full rounded-md" />
    </div>
  );
}
