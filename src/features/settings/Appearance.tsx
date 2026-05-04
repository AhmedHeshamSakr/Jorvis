import { useUI, type Theme, type Font } from '../../state/ui';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const FONTS: { value: Font; label: string; sample: string }[] = [
  { value: 'lexend', label: 'Lexend', sample: 'Aa — dyslexia-friendly default' },
  { value: 'opendyslexic', label: 'OpenDyslexic', sample: 'Aa — heavier baseline' },
];

export function Appearance() {
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const font = useUI((s) => s.font);
  const setFont = useUI((s) => s.setFont);

  return (
    <section className="glass p-5">
      <SectionTitle>Appearance</SectionTitle>

      <Field label="Theme">
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <Pill key={t.value} active={theme === t.value} onClick={() => setTheme(t.value)}>
              {t.label}
            </Pill>
          ))}
        </div>
      </Field>

      <Field label="Font">
        <div className="grid grid-cols-2 gap-2">
          {FONTS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFont(f.value)}
              className={`text-left p-3 rounded-md border transition ${
                font === f.value ? 'ring-2' : ''
              }`}
              style={{
                borderColor: 'var(--border)',
                background: font === f.value ? 'var(--surface)' : 'transparent',
                fontFamily: f.value === 'opendyslexic' ? 'OpenDyslexic, sans-serif' : 'Lexend Variable, sans-serif',
              }}
            >
              <div className="text-sm font-semibold mb-0.5">{f.label}</div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {f.sample}
              </div>
            </button>
          ))}
        </div>
      </Field>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold tracking-tight mb-4">{children}</h2>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <div
        className="text-[10px] uppercase tracking-wider mb-2"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm border transition ${active ? 'ring-2' : ''}`}
      style={{
        borderColor: 'var(--border)',
        background: active ? 'var(--surface)' : 'transparent',
      }}
    >
      {children}
    </button>
  );
}
