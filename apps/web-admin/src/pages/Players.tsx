import { useEffect, useState } from 'react';
import { adminClient } from '../api/client';

interface SeasonStats { cost: number; ppg: number; rpg: number; apg: number; fantasyScore: number }
interface Player {
  id: number; name: string; nameCn: string | null; position: string;
  team: string; jerseyNumber: string; isActive: boolean;
  seasonStats: SeasonStats[];
}

const POS_COLORS: Record<string, string> = { PG: '#3498db', SG: '#9b59b6', SF: '#27ae60', PF: '#f39c12', C: '#e94560' };
const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

function Badge({ text, color }: { text: string; color: string }) {
  return <span style={{ background: color + '22', color, border: `1px solid ${color}55`, padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{text}</span>;
}

export function Players() {
  const [all, setAll] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const load = (s = search, pos = posFilter) => {
    const params = new URLSearchParams();
    if (s) params.set('search', s);
    if (pos) params.set('position', pos);
    adminClient.get(`/players?${params}`).then((r) => { setAll(r.data); setPage(1); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(); };

  const handleRecalculate = async () => {
    if (!confirm('Recalculate costs for all players?')) return;
    setRecalculating(true);
    try {
      const res = await adminClient.post('/players/recalculate-costs');
      alert(res.data.message);
      load();
    } catch { alert('Failed to recalculate costs'); }
    finally { setRecalculating(false); }
  };

  const handleDeactivate = async (id: number, name: string) => {
    if (!confirm(`Deactivate ${name}?`)) return;
    await adminClient.delete(`/players/${id}`);
    load();
  };

  const totalPages = Math.ceil(all.length / PAGE_SIZE);
  const visible = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', color: '#4a6380', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' };
  const tdBase: React.CSSProperties = { padding: '9px 14px', fontSize: 13, borderBottom: '1px solid #1a2332' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>Players</h1>
          <p style={{ color: '#4a6380', fontSize: 12, marginTop: 2 }}>{all.length} results</p>
        </div>
        <button onClick={handleRecalculate} disabled={recalculating}
          style={{ background: '#f39c12', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 7, fontWeight: 600, cursor: 'pointer', fontSize: 13, opacity: recalculating ? 0.7 : 1 }}>
          {recalculating ? 'Recalculating...' : '↺ Recalculate Costs'}
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} style={{ background: '#131f2e', borderRadius: 10, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="Search name (EN/CN)…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 200px', padding: '7px 12px', borderRadius: 6, border: '1px solid #2d3f55', background: '#0f1923', color: '#e0e0e0', fontSize: 13, minWidth: 160 }}
        />
        <select value={posFilter} onChange={(e) => { setPosFilter(e.target.value); load(search, e.target.value); }}
          style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #2d3f55', background: '#0f1923', color: '#e0e0e0', fontSize: 13 }}>
          <option value="">All Positions</option>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button type="submit" style={{ background: '#3498db', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          Search
        </button>
        {(search || posFilter) && (
          <button type="button" onClick={() => { setSearch(''); setPosFilter(''); load('', ''); }}
            style={{ background: '#2d3f55', color: '#8899aa', border: 'none', padding: '7px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            Clear
          </button>
        )}
      </form>

      {loading ? <div style={{ color: '#4a6380', padding: 20 }}>Loading...</div> : (
        <>
          <div style={{ background: '#131f2e', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d1820' }}>
                  {['#', 'English Name', 'Chinese Name', 'Pos', 'Team', 'Jersey', 'Cost', 'Fantasy', 'Active', ''].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => {
                  const stats = p.seasonStats?.[0];
                  return (
                    <tr key={p.id} style={{ background: 'transparent' }}>
                      <td style={{ ...tdBase, color: '#2d3f55' }}>{p.id}</td>
                      <td style={{ ...tdBase, color: '#fff', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ ...tdBase, color: '#8899aa' }}>{p.nameCn ?? '—'}</td>
                      <td style={{ ...tdBase }}>
                        <Badge text={p.position} color={POS_COLORS[p.position] ?? '#888'} />
                      </td>
                      <td style={{ ...tdBase, color: '#ccc' }}>{p.team}</td>
                      <td style={{ ...tdBase, color: '#4a6380' }}>{p.jerseyNumber}</td>
                      <td style={{ ...tdBase, color: '#f39c12', fontWeight: 600 }}>
                        {stats ? `$${stats.cost.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ ...tdBase, color: '#9b59b6' }}>
                        {stats ? Number(stats.fantasyScore).toFixed(1) : '—'}
                      </td>
                      <td style={{ ...tdBase }}>
                        <Badge text={p.isActive ? 'Active' : 'Off'} color={p.isActive ? '#27ae60' : '#e94560'} />
                      </td>
                      <td style={{ ...tdBase }}>
                        {p.isActive && (
                          <button onClick={() => handleDeactivate(p.id, p.name)}
                            style={{ background: 'transparent', color: '#e94560', border: '1px solid #e9456044', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center', justifyContent: 'center' }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ background: '#131f2e', color: '#8899aa', border: '1px solid #2d3f55', padding: '5px 14px', borderRadius: 6, cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                ‹ Prev
              </button>
              <span style={{ color: '#4a6380', fontSize: 13 }}>Page {page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ background: '#131f2e', color: '#8899aa', border: '1px solid #2d3f55', padding: '5px 14px', borderRadius: 6, cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
                Next ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
