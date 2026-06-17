import { useState, useEffect, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export function ChartWrapper({ children, className }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(id);
  }, []);

  return <div className={className}>{ready ? children : null}</div>;
}
