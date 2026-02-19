interface Props {
  totalCost: number;
  salaryCap: number;
}

export function SalaryCapTracker({ totalCost, salaryCap }: Props) {
  const remaining = salaryCap - totalCost;
  const pct = Math.min((totalCost / salaryCap) * 100, 100);
  const color = pct > 100 ? '#e94560' : pct > 85 ? '#f39c12' : '#27ae60';

  return (
    <div style={{ background: '#16213e', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
        <span style={{ color: '#aaa' }}>Salary Cap</span>
        <span style={{ color: '#fff', fontWeight: 700 }}>${salaryCap.toLocaleString()}</span>
      </div>
      <div style={{ background: '#0f3460', borderRadius: 4, height: 12, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: '#aaa' }}>Used: <strong style={{ color: '#fff' }}>${totalCost.toLocaleString()}</strong></span>
        <span style={{ color: remaining < 0 ? '#e94560' : '#27ae60' }}>
          {remaining < 0 ? `Over cap: $${Math.abs(remaining).toLocaleString()}` : `Remaining: $${remaining.toLocaleString()}`}
        </span>
      </div>
    </div>
  );
}
