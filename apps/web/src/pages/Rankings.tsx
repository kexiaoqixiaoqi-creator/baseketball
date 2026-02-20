import { useEffect, useState } from 'react';
import { roomsApi } from '../api/rooms.api';
import { gameDaysApi } from '../api/game-days.api';

interface Room {
  id: number;
  name: string;
  isOfficial: boolean;
  memberCount?: number;
}

interface GameDay {
  id: number;
  date: string;
  status: string;
}

interface PlayerSlot {
  position: string;
  name: string;
  score: number | null;
}

interface RankEntry {
  rank: number;
  user: { id: number; username: string };
  totalScore: number | null;
  totalCost: number;
  players?: {
    PG: PlayerSlot;
    SG: PlayerSlot;
    SF: PlayerSlot;
    PF: PlayerSlot;
    C: PlayerSlot;
  };
}

export function Rankings() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [gameDays, setGameDays] = useState<GameDay[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankLoading, setRankLoading] = useState(false);

  useEffect(() => {
    Promise.all([roomsApi.forRankings(), gameDaysApi.list()])
      .then(([rList, gdList]) => {
        setRooms(rList);
        setGameDays(gdList);
        if (rList.length > 0 && !selectedRoomId) setSelectedRoomId(rList[0].id);
        if (gdList.length > 0 && !selectedDayId) {
          const sorted = [...gdList].sort((a, b) => b.date.localeCompare(a.date));
          setSelectedDayId(sorted[0].id);
        }
      })
      .catch(() => {
        setRooms([]);
        setGameDays([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedRoomId || !selectedDayId) {
      setRankings([]);
      return;
    }
    setRankLoading(true);
    roomsApi
      .rankings(selectedRoomId, selectedDayId)
      .then(setRankings)
      .catch(() => setRankings([]))
      .finally(() => setRankLoading(false));
  }, [selectedRoomId, selectedDayId]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const selectedDay = gameDays.find((d) => d.id === selectedDayId);

  if (loading) {
    return (
      <div className="page">
        <div className="loading">加载中…</div>
      </div>
    );
  }

  return (
    <div className="page page-rankings">
      <div className="rankings-header">
        <h1 className="rankings-title">榜单</h1>
        <p className="rankings-subtitle text-muted">查看各赛日房间排名</p>
      </div>

      {/* 筛选：房间 + 赛日（紧凑布局） */}
      <div className="card rankings-filters">
        <div className="rankings-filters-row">
          <div className="rankings-filter-item">
            <label className="form-label">房间</label>
            <select
              className="input"
              value={selectedRoomId ?? ''}
              onChange={(e) => setSelectedRoomId(Number(e.target.value))}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.isOfficial ? ' (官方)' : ''}
                </option>
              ))}
              {rooms.length === 0 && <option value="">暂无房间</option>}
            </select>
          </div>
          <div className="rankings-filter-item">
            <label className="form-label">赛日</label>
            <select
              className="input"
              value={selectedDayId ?? ''}
              onChange={(e) => setSelectedDayId(Number(e.target.value))}
            >
              {gameDays.map((gd) => (
                <option key={gd.id} value={gd.id}>
                  {gd.date}
                </option>
              ))}
              {gameDays.length === 0 && <option value="">暂无赛日</option>}
            </select>
          </div>
        </div>
      </div>

      {/* 榜单列表 */}
      <div className="card rankings-list-card">
        <div className="rankings-list-header">
          <h3 className="rankings-list-title">
            {selectedRoom?.name ?? '—'} · {selectedDay?.date ?? '—'}
          </h3>
        </div>
        {rankLoading ? (
          <div className="loading">加载排名中…</div>
        ) : rankings.length === 0 ? (
          <div className="empty">暂无排名数据</div>
        ) : (
          <div className="rankings-list">
            {rankings.map((entry) => (
              <div key={`${entry.user.id}-${entry.rank}`} className="rank-entry">
                <div className="rank-entry-header">
                  <span className={`rank-num rank-${entry.rank <= 3 ? entry.rank : 'other'}`}>
                    #{entry.rank}
                  </span>
                  <span className="rank-username">{entry.user.username}</span>
                  <span className="rank-score">
                    {entry.totalScore != null ? entry.totalScore.toFixed(1) : '—'}
                  </span>
                  <span className="rank-cost">${entry.totalCost.toLocaleString()}</span>
                </div>
                {entry.players && (
                  <div className="rank-entry-players">
                    {(['PG', 'SG', 'SF', 'PF', 'C'] as const).map((pos) => {
                      const slot = entry.players[pos];
                      if (!slot) return null;
                      return (
                        <div key={pos} className="rank-player-slot">
                          <span className="rank-player-pos">{pos}</span>
                          <span className="rank-player-name">{slot.name}</span>
                          <span className="rank-player-score">
                            {slot.score != null ? slot.score.toFixed(1) : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
