import { useEffect, useState } from 'react';
import { adminClient } from '../../api/admin-client';

interface Room { id: number; name: string; isOfficial: boolean; salaryCapCoefficient: number; members: { id: number }[] }
interface Ranking { rank: number; user: { id: number; username: string }; totalScore: number | null; totalCost: number }
interface GameDay { id: number; date: string; status: string }

export function RoomsAdmin() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Room | null>(null);
  const [gameDays, setGameDays] = useState<GameDay[]>([]);
  const [gameDayId, setGameDayId] = useState('');
  const [rankings, setRankings] = useState<Ranking[] | null>(null);
  const [rankLoading, setRankLoading] = useState(false);
  const [editCoeff, setEditCoeff] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([adminClient.get('/rooms'), adminClient.get('/game-days')])
      .then(([r, gd]) => { setRooms(r.data); setGameDays(gd.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected) setEditCoeff(String(selected.salaryCapCoefficient));
  }, [selected]);

  const loadRankings = async (roomId: number, gdId: string) => {
    if (!gdId) return;
    setRankLoading(true);
    setRankings(null);
    try {
      const res = await adminClient.get(`/rooms/${roomId}/rankings?gameDayId=${gdId}`);
      setRankings(res.data);
    } catch { setRankings([]); }
    finally { setRankLoading(false); }
  };

  const handleView = (r: Room) => {
    setSelected(r);
    setEditCoeff(String(r.salaryCapCoefficient));
    setRankings(null);
    setGameDayId('');
  };

  const handleSaveCoeff = async () => {
    if (!selected) return;
    const v = parseFloat(editCoeff);
    if (isNaN(v) || v < 0.1) return;
    setSaving(true);
    try {
      const res = await adminClient.patch(`/rooms/${selected.id}`, {
        salaryCapCoefficient: v,
      });
      setRooms((prev) =>
        prev.map((r) => (r.id === selected.id ? { ...r, salaryCapCoefficient: res.data.salaryCapCoefficient } : r)),
      );
      setSelected({ ...selected, salaryCapCoefficient: res.data.salaryCapCoefficient });
    } finally {
      setSaving(false);
    }
  };

  const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', color: '#4a6380', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 };
  const tdBase: React.CSSProperties = { padding: '9px 14px', fontSize: 13, borderBottom: '1px solid #1a2332' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
      {/* Rooms list */}
      <div>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>房间管理</h1>
          <p style={{ color: '#4a6380', fontSize: 12, marginTop: 2 }}>共 {rooms.length} 个房间</p>
        </div>

        {loading ? <div style={{ color: '#4a6380' }}>加载中…</div> : (
          <div style={{ background: '#131f2e', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d1820' }}>
                  {['#', '名称', '类型', '系数', '成员', ''].map((h) => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id} style={{ background: selected?.id === r.id ? '#1e2d3d' : 'transparent' }}>
                    <td style={{ ...tdBase, color: '#2d3f55' }}>{r.id}</td>
                    <td style={{ ...tdBase, color: '#fff', fontWeight: 500 }}>{r.name}</td>
                    <td style={{ ...tdBase }}>
                      <span style={{ background: r.isOfficial ? '#e9456022' : '#1e2d3d', color: r.isOfficial ? '#e94560' : '#8899aa', border: `1px solid ${r.isOfficial ? '#e9456044' : '#2d3f55'}`, padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {r.isOfficial ? '官方' : '自定义'}
                      </span>
                    </td>
                    <td style={{ ...tdBase, color: '#f39c12' }}>{r.salaryCapCoefficient}</td>
                    <td style={{ ...tdBase, color: '#8899aa' }}>{r.members?.length ?? 0}</td>
                    <td style={{ ...tdBase }}>
                      <button onClick={() => handleView(r)}
                        style={{ background: '#1e2d3d', color: '#3498db', border: '1px solid #3498db44', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
                        排名
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rankings panel */}
      {selected && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>排名 — {selected.name}</h2>
              <p style={{ color: '#4a6380', fontSize: 12, marginTop: 2 }}>选择赛日查看排名</p>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'transparent', color: '#4a6380', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ color: '#8899aa', fontSize: 12 }}>薪资帽系数</span>
            <input
              type="number"
              min={0.1}
              step={0.01}
              value={editCoeff}
              onChange={(e) => setEditCoeff(e.target.value)}
              style={{ width: 72, padding: '5px 8px', borderRadius: 4, border: '1px solid #2d3f55', background: '#0f1923', color: '#e0e0e0', fontSize: 13 }}
            />
            <button
              onClick={handleSaveCoeff}
              disabled={
                saving ||
                !(parseFloat(editCoeff) >= 0.1 && parseFloat(editCoeff) !== selected.salaryCapCoefficient)
              }
              style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 4, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontSize: 12, fontWeight: 600 }}
            >
              {saving ? '保存中…' : '保存'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <select value={gameDayId} onChange={(e) => setGameDayId(e.target.value)}
              style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #2d3f55', background: '#0f1923', color: '#e0e0e0', fontSize: 13 }}>
              <option value="">选择赛日…</option>
              {gameDays.map((gd) => (
                <option key={gd.id} value={gd.id}>{gd.date} ({gd.status})</option>
              ))}
            </select>
            <button onClick={() => loadRankings(selected.id, gameDayId)} disabled={!gameDayId || rankLoading}
              style={{ background: '#3498db', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 6, cursor: gameDayId ? 'pointer' : 'default', opacity: gameDayId ? 1 : 0.5, fontSize: 13, fontWeight: 600 }}>
              加载
            </button>
          </div>

          {rankLoading && <div style={{ color: '#4a6380', padding: 12 }}>加载排名中…</div>}

          {rankings !== null && !rankLoading && (
            rankings.length === 0 ? (
              <div style={{ color: '#4a6380', background: '#131f2e', borderRadius: 10, padding: 20, textAlign: 'center' }}>本赛日暂无阵容。</div>
            ) : (
              <div style={{ background: '#131f2e', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#0d1820' }}>
                      {['排名', '用户', '薪资', '得分'].map((h) => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((r) => (
                      <tr key={r.rank}>
                        <td style={{ ...tdBase, fontWeight: 700, fontSize: 15, color: r.rank === 1 ? '#f39c12' : r.rank === 2 ? '#8899aa' : r.rank === 3 ? '#cd7f32' : '#4a6380' }}>#{r.rank}</td>
                        <td style={{ ...tdBase, color: '#fff', fontWeight: 500 }}>{r.user.username}</td>
                        <td style={{ ...tdBase, color: '#f39c12' }}>${r.totalCost.toLocaleString()}</td>
                        <td style={{ ...tdBase, color: r.totalScore !== null ? '#27ae60' : '#2d3f55', fontWeight: 600 }}>
                          {r.totalScore !== null ? r.totalScore.toFixed(2) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
