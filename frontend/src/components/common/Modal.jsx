import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

// Native modal dialogs own focus trapping, background isolation, and Escape.
const Modal = ({ title, onClose, children, className = "" }) => {
  const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);
  return createPortal(<dialog ref={dialog} className={"app-dialog " + className} aria-label={title}
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="dialog-heading"><h2>{title}</h2><button type="button" className="icon-button" aria-label={"Close " + title.toLowerCase()} onClick={onClose}><FiX aria-hidden="true" /></button></div>
    {children}
  </dialog>, document.body);
};
export default Modal;

