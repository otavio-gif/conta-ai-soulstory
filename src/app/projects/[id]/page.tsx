import { ProjectPanel } from "@/components/project-panel";

export default async function ProjetoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectPanel projectId={id} />;
}
