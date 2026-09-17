import { loadProject } from "@/lib/project-loader";

const slug = process.argv[2] ?? "green-valley";

try {
  loadProject(slug);
  console.log(`✅ Project "${slug}" data is valid.`);
  process.exit(0);
} catch (error) {
  console.error(`❌ Validation failed for "${slug}":`);
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
}
