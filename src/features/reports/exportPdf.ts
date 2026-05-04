import { marked } from 'marked';
import DOMPurify, { type Config } from 'dompurify';

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

const SANITIZE_CONFIG: Config = {
  USE_PROFILES: { html: true },
  ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel|#|\/)/i,
  FORBID_TAGS: ['style', 'iframe', 'object', 'embed', 'form', 'script'],
  FORBID_ATTR: ['style', 'srcset', 'onerror', 'onload'],
};

export function exportPdf(title: string, markdown: string): void {
  const rawHtml = marked.parse(markdown, { async: false }) as string;
  const safeHtml = DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG) as unknown as string;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  document.body.appendChild(iframe);

  const idoc = iframe.contentDocument;
  const iwin = iframe.contentWindow;
  if (!idoc || !iwin) {
    iframe.remove();
    alert('Could not initialize print frame.');
    return;
  }

  while (idoc.documentElement.firstChild) {
    idoc.documentElement.removeChild(idoc.documentElement.firstChild);
  }
  const head = idoc.createElement('head');
  const body = idoc.createElement('body');
  idoc.documentElement.appendChild(head);
  idoc.documentElement.appendChild(body);

  const titleEl = idoc.createElement('title');
  titleEl.textContent = title;
  head.appendChild(titleEl);

  const styleEl = idoc.createElement('style');
  styleEl.textContent = PRINT_CSS;
  head.appendChild(styleEl);

  const parsed = new DOMParser().parseFromString(safeHtml, 'text/html');
  const container = idoc.createElement('article');
  for (const node of Array.from(parsed.body.childNodes)) {
    container.appendChild(idoc.adoptNode(node));
  }
  body.appendChild(container);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        iwin.focus();
        iwin.print();
      } catch {
        /* print dialog dismissed */
      }
      setTimeout(() => iframe.remove(), 1000);
    });
  });
}
