export const CONSENT_STYLES = `
    .cookie-blocker { position: fixed; inset: 0; z-index: 1199;
      background: rgba(0,0,0,.45); pointer-events: auto; }
    .consent-banner { position: fixed; inset-inline: 0; bottom: 0; z-index: 1200;
      background: var(--surface-card, #fff); color: var(--text-color, #1a1a1a);
      border-top: 1px solid var(--surface-border, #e5e7eb);
      box-shadow: 0 -4px 20px rgba(0,0,0,.12); }
    .consent-content { max-width: 1200px; margin: 0 auto; padding: 1rem 1.25rem;
      display: flex; flex-direction: column; gap: 1rem; }
    @media (min-width: 768px) {
      .consent-content { flex-direction: row; align-items: center; justify-content: space-between; }
    }
    .consent-text { display: flex; flex-direction: column; gap: .35rem; }
    .consent-title { font-size: 1rem; font-weight: 700; margin: 0; }
    .consent-desc { font-size: .875rem; line-height: 1.45; opacity: .95; margin: 0; }
    .consent-subtitle { font-weight: 700; margin: 0 0 .5rem; font-size: .95rem; }
    .consent-categories { border: 0; padding: 0; margin: 0 0 .75rem; display: grid; gap: .75rem; }
    .consent-category { border: 1px solid var(--surface-border, #e5e7eb); border-radius: 10px; padding: .75rem 1rem; }
    .consent-category-head { display: flex; justify-content: space-between; align-items: center; gap: .5rem; }
    .consent-category-name { font-weight: 600; font-size: .9rem; }
    .consent-always { font-size: .7rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .04em; color: var(--primary-color, #f97316); }
    .consent-category-desc { margin: .35rem 0 0; font-size: .82rem; line-height: 1.4; opacity: .9; }
    .consent-check { display: flex; align-items: center; gap: .5rem; cursor: pointer; }
    .consent-check-locked { cursor: not-allowed; opacity: .8; }
    .consent-actions { display: flex; flex-wrap: wrap; gap: .5rem;
      margin-top: auto; justify-content: flex-end; }
    @media (min-width: 768px) {
      .consent-actions { margin-top: 0; justify-content: flex-end; }
    }
`;
