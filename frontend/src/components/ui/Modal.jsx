import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, eyebrow, children, className = "" }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && panelRef.current) {
        const focusable = [...panelRef.current.querySelectorAll("button, a, input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter((item) => !item.disabled);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.body.classList.add("modal-open");
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => panelRef.current?.querySelector("button, input, select, textarea")?.focus());
    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  const titleId = "ui-modal-title";
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={panelRef} className={`ui-modal ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="ui-modal__header">
          <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id={titleId}>{title}</h2></div>
          <button type="button" className="ui-icon-button" aria-label={`Close ${title}`} onClick={onClose}><X size={18} /></button>
        </header>
        <div className="ui-modal__body">{children}</div>
      </div>
    </div>
  );
}