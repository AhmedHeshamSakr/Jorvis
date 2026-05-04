import { useParams } from 'react-router-dom';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <div className="text-2xl font-semibold tracking-tight">Project {id}</div>;
}
