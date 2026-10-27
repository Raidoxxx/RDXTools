export function AdSlot({ variant = 'horizontal' }: { variant?: 'horizontal' | 'sidebar' }) {
  return <aside className={`ad-slot ${variant}`} aria-label="Espaço reservado para publicidade">
    <span>PUBLICIDADE</span><span className="ad-rule" /><small>Espaço reservado</small>
  </aside>;
}
