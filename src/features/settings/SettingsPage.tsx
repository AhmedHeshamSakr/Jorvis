import { Appearance } from './Appearance';
import { TemplatesEditor } from './TemplatesEditor';
import { DataIO } from './DataIO';
import { ArchivedProjects } from './ArchivedProjects';

export default function SettingsPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
        <Appearance />
        <TemplatesEditor />
        <DataIO />
        <ArchivedProjects />
      </div>
    </>
  );
}
