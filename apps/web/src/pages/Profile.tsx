import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { lineupsApi } from '../api/lineups.api';

interface LineupHistory {
  id: number;
  gameDayId: number;
  gameDayDate: string | null;
  roomId: number;
  roomName: string | null;
  totalCost: number;
  totalScore: number | null;
  createdAt: string;
}

export function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [history, setHistory] = useState<LineupHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lineupsApi
      .history()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = user?.username?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="page">
      {/* User info card */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 20, flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{user?.username}</div>
            <div className="text-muted mt-4" style={{ fontSize: 13 }}>{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-outline btn-sm">
          退出
        </button>
      </div>

      {/* Lineup history */}
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
        我的阵容
        {history.length > 0 && (
          <span className="text-muted fw-600" style={{ fontSize: 13, marginLeft: 8 }}>
            ({history.length})
          </span>
        )}
      </h3>

      {loading ? (
        <div className="loading">加载阵容中…</div>
      ) : history.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          暂无阵容记录，快去组建第一套阵容吧！
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((l) => (
            <div
              key={l.id}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                borderLeft: `3px solid ${l.totalScore !== null ? 'var(--success)' : 'var(--border)'}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {l.gameDayDate ?? `Day #${l.gameDayId}`}
                </div>
                <div className="text-muted mt-4" style={{ fontSize: 13 }}>
                  {l.roomName ?? '房间'} · ${l.totalCost.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {l.totalScore !== null ? (
                  <>
                    <div style={{ color: 'var(--success)', fontWeight: 800, fontSize: 20 }}>
                      {l.totalScore.toFixed(1)}
                    </div>
                    <div className="text-muted" style={{ fontSize: 11 }}>分</div>
                  </>
                ) : (
                  <span className="badge badge-pending">待结算</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
