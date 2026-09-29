import { RefObject, useEffect, useRef } from 'react';

export function useModalAccessibility(ref: RefObject<HTMLDivElement | null>, isOpen: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const modal = ref.current;
    const selector = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    modal?.querySelector<HTMLElement>(selector)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== 'Tab' || !modal) return;
      const focusable = Array.from(modal.querySelectorAll<HTMLElement>(selector));
      if (!focusable.length) { event.preventDefault(); modal.focus(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); previous?.focus(); };
  }, [isOpen, ref]);
}
