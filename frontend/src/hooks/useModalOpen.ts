import { useEffect, useState } from "react";

let _openCount = 0;
let _listeners: Array<() => void> = [];

function notify() {
  for (const l of _listeners) l();
}

export function registerModalOpen() {
  _openCount++;
  notify();
}

export function registerModalClose() {
  _openCount = Math.max(0, _openCount - 1);
  notify();
}

export function useAnyModalOpen() {
  const [open, setOpen] = useState(_openCount > 0);

  useEffect(() => {
    const listener = () => setOpen(_openCount > 0);
    _listeners.push(listener);
    return () => {
      _listeners = _listeners.filter((l) => l !== listener);
    };
  }, []);

  return open;
}

export function useModalRegistration(open: boolean) {
  useEffect(() => {
    if (open) {
      registerModalOpen();
      return () => registerModalClose();
    }
  }, [open]);
}
