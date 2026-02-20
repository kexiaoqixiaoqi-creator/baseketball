import { useEffect, useState } from 'react';
import { adminClient } from '../../api/admin-client';

interface Team { id: number; name: string; nameCn: string; market: string; marketCn: string | null }

export function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminClient.get('/teams').then((r) => setTeams(r.data)).finally(() => setLoading(false));
  }, []);

  const thStyle: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', color: '#4a6380', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 };
  const tdBase: React.CSSProperties = { padding: '10px 16px', fontSize: 13, borderBottom: '1px solid #1a2332' };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>球队管理</h1>
        <p style={{ color: '#4a6380', fontSize: 12, marginTop: 2 }}>共 {teams.length} 支 NBA 球队</p>
      </div>

      {loading ? <div style={{ color: '#4a6380' }}>加载中…</div> : (
        <div style={{ background: '#131f2e', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0d1820' }}>
                {['#', '英文名', '中文名', '城市(英)', '城市(中)'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id}>
                  <td style={{ ...tdBase, color: '#2d3f55' }}>{t.id}</td>
                  <td style={{ ...tdBase, color: '#fff', fontWeight: 600 }}>{t.name}</td>
                  <td style={{ ...tdBase, color: '#e0e0e0' }}>{t.nameCn}</td>
                  <td style={{ ...tdBase, color: '#8899aa' }}>{t.market}</td>
                  <td style={{ ...tdBase, color: '#8899aa' }}>{t.marketCn ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
