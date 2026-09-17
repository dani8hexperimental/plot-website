import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold">Interactive Plot Viewer</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Explore land development projects through an interactive map.
      </p>
      <Link
        href="/project/green-valley"
        className="rounded-lg bg-foreground px-6 py-3 font-medium text-background hover:opacity-90"
      >
        View Green Valley
      </Link>
    </main>
  );
}
