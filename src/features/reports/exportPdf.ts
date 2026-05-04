import { marked } from 'marked';
import DOMPurify from 'dompurify';

const PRINT_CSS = `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; color: #23262e; max-width: 720px; margin: 32px auto; padding: 0 16px; line-height: 1.5; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #eee; }
  h3 { font-size: 13px; margin: 16px 0 6px; color: #555; }
  p, li { font-size: 12px; }
  ul { padding-left: 20px; }
  code { background: #f5f5f3; padding: 1px 4px; border-radius: 3px; font-size: 11px; }
  em { color: #777; }
  @media print { body { margin: 0; max-width: none; } }
`;

export function exportPdf(title: string, markdown: string): void {
  const rawHtml = marked.parse(markdown, { async: false }) as string;
  const safeHtml = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });

  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    alert('Popup blocked. Please allow popups for this site to export PDF.');
    return;
  }

  const doc = win.document;
  doc.title = title;

  const head = doc.head ?? doc.documentElement.appendChild(doc.createElement('head'));
  const body = doc.body ?? doc.documentElement.appendChild(doc.createElement('body'));

  while (head.firstChild) head.removeChild(head.firstChild);
  while (body.firstChild) body.removeChild(body.firstChild);

  const titleEl = doc.createElement('title');
  titleEl.textContent = title;
  head.appendChild(titleEl);

  const styleEl = doc.createElement('style');
  styleEl.textContent = PRINT_CSS;
  head.appendChild(styleEl);

  const parsed = new DOMParser().parseFromString(safeHtml, 'text/html');
  const container = doc.createElement('article');
  for (const node of Array.from(parsed.body.childNodes)) {
    container.appendChild(doc.adoptNode(node));
  }
  body.appendChild(container);

  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      /* user closed window */
    }
  }, 100);
}
