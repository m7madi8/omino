export default function AppLoading() {
  return (
    <div className="max-w-6xl space-y-6 animate-pulse motion-reduce:animate-none">
      <div className="space-y-3">
        <div className="h-3 w-24 bg-hairline/80 rounded" />
        <div className="h-9 w-64 bg-hairline/80 rounded" />
        <div className="h-4 w-48 bg-hairline/60 rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-hairline/70 rounded-md" />
        ))}
      </div>
      <div className="h-48 bg-hairline/60 rounded-md" />
    </div>
  );
}
