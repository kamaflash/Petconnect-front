export const CONSENT_STYLES = `
    .consent-overlay { position: fixed; inset: 0; z-index: 1200; display: flex;
      align-items: flex-end; justify-content: center; padding: 1rem; background: rgba(0,0,0,.45); }
    .consent-dialog { width: min(560px, 100%); background: var(--surface-card, #fff);
      color: var(--text-color, #1a1a1a); border-radius: 16px; padding: 1.5rem;
      box-shadow: 0 24px 64px rgba(0,0,0,.3); max-height: min(85vh, 640px); overflow: auto; }
    .consent-dialog:focus-visible { outline: 3px solid var(--primary-color, #f97316); outline-offset: 2px; }
    .consent-title { font-size: 1.25rem; margin: 0 0 .5rem; }
    .consent-text { margin: 0 0 1rem; line-height: 1.5; }
    .consent-subtitle { font-weight: 700; margin-bottom: .75rem; }
    .consent-categories { border: 0; padding: 0; margin: 0 0 1rem; display: grid; gap: 1rem; }
    .consent-category { border: 1px solid var(--surface-border, #e5e7eb); border-radius: 12px; padding: .875rem 1rem; }
    .consent-category-head { display: flex; justify-content: space-between; align-items: center; gap: .5rem; }
    .consent-category-name { font-weight: 600; }
    .consent-always { font-size: .75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .04em; color: var(--primary-color, #f97316); }
    .consent-category-desc { margin: .5rem 0; font-size: .9rem; line-height: 1.5; opacity: .9; }
    .consent-check { display: flex; align-items: center; gap: .5rem; cursor: pointer; }
    .consent-check-locked { cursor: not-allowed; opacity: .8; }
    .consent-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
    @media (min-width: 640px) { .consent-overlay { align-items: center; } }
`;
