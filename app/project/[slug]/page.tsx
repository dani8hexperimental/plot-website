import { Suspense } from "react";
import { notFound } from "next/navigation";
import { loadProject } from "@/lib/project-loader";
import ProjectPageClient from "@/components/Project/ProjectPageClient";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return [{ slug: "green-valley" }];
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params;
  try {
    const { project } = loadProject(slug);
    return {
      title: `${project.name} | Interactive Plot Viewer`,
      description: project.description,
    };
  } catch {
    return { title: "Project Not Found" };
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;

  let data;
  try {
    data = loadProject(slug);
  } catch {
    notFound();
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading map…</div>}>
      <ProjectPageClient
        project={data.project}
        plots={data.plots}
        roads={data.roads}
        amenities={data.amenities}
        zones={data.zones}
      />
    </Suspense>
  );
}
