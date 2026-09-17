import type { Project } from "@/schemas/project.schema";

interface ProjectHeaderProps {
  project: Project;
}

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div className="pointer-events-auto w-64 rounded-2xl border border-zinc-200/70 bg-white/90 p-4 shadow-lg shadow-zinc-950/15 backdrop-blur-md dark:border-zinc-700/70 dark:bg-zinc-900/90 sm:w-72">
      <h1 className="text-lg font-bold leading-tight sm:text-xl">
        {project.name}
      </h1>
      <p className="mt-1.5 line-clamp-3 text-xs leading-snug text-zinc-600 dark:text-zinc-400">
        {project.description}
      </p>
      <div className="mt-2.5 flex flex-col gap-0.5 border-t border-zinc-200/70 pt-2.5 text-xs text-zinc-600 dark:border-zinc-700/70 dark:text-zinc-400">
        <p>{project.contact.phone}</p>
        <p>{project.contact.email}</p>
      </div>
    </div>
  );
}
