import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
export function Button({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`af-button ${className}`} {...props} />
  );
}
export function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="af-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="af-badge">{children}</span>;
}
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  return (
    <Button
      aria-pressed={dark}
      onClick={() => {
        const next = !dark;
        document.documentElement.dataset.theme = next ? 'dark' : 'light';
        setDark(next);
      }}
    >
      Tema {dark ? 'claro' : 'escuro'}
    </Button>
  );
}
