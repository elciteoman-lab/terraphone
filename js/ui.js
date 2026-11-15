/** Disclosure and dialog behavior for the quiet interface. No map/audio state. */
export function initCalmUI() {
  const explore = document.getElementById('explore-menu');
  const mixer = document.getElementById('hud-bottom-right');
  const mixerButton = document.getElementById('btn-mobile-mixer');

  document.addEventListener('click', (event) => {
    if (explore?.open && !explore.contains(event.target)) explore.open = false;
    if (event.target.closest('.explore-panel > button')) {
      explore.open = false;
      if (explore.contains(document.activeElement)) document.getElementById('btn-explore').focus();
    }
  });

  const dialogs = [...document.querySelectorAll('.modal-backdrop')];
  const returnFocus = new WeakMap();
  const focusable = 'button, a[href], input, select, textarea, [tabindex="0"]';
  for (const dialog of dialogs) {
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    const title = dialog.querySelector('.modal-title');
    if (title) {
      title.id ||= `${dialog.id}-title`;
      dialog.setAttribute('aria-labelledby', title.id);
    }
    new MutationObserver(() => {
      if (dialog.classList.contains('open')) {
        returnFocus.set(dialog, explore?.contains(document.activeElement)
          ? document.getElementById('btn-explore') : document.activeElement);
        dialog.querySelector(focusable)?.focus();
      } else {
        returnFocus.get(dialog)?.focus({ preventScroll: true });
      }
    }).observe(dialog, { attributes: true, attributeFilter: ['class'] });
  }

  document.addEventListener('keydown', (event) => {
    const dialog = dialogs.findLast((item) => item.classList.contains('open'));
    if (dialog) {
      event.stopPropagation();
      if (event.key === 'Escape') dialog.classList.remove('open');
      if (event.key === 'Tab') {
        const controls = [...dialog.querySelectorAll(focusable)].filter((item) => item.getClientRects().length);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
      return;
    }
    if (event.key !== 'Escape') return;
    if (explore?.open) {
      explore.open = false;
      document.getElementById('btn-explore')?.focus();
    } else if (document.getElementById('rain-readout').open) {
      const reading = document.getElementById('rain-readout');
      reading.open = false;
      reading.querySelector('summary').focus();
    } else if (mixer?.classList.contains('mobile-open')) {
      mixer.classList.remove('mobile-open');
      mixerButton?.setAttribute('aria-expanded', 'false');
      mixerButton?.focus();
    }
  });
}
