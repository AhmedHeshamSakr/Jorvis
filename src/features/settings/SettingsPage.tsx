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
      <footer
        className="max-w-4xl mt-8 pt-4 border-t text-xs flex justify-between"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        <span>
          Jorvis <code>v{__APP_VERSION__}</code>
        </span>
        <a
          href="https://github.com/AhmedHeshamSakr/Jorvis"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--text-muted)' }}
        >
          GitHub ↗
        </a>
      </footer>
    </>
  );
}
