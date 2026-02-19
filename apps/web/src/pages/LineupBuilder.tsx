import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LINEUP_POSITIONS } from '@fantasy-nba/shared';
import { gameDaysApi } from '../api/game-days.api';
import { lineupsApi } from '../api/lineups.api';
import { roomsApi } from '../api/rooms.api';
import { useLineupStore } from '../stores/lineup.store';

interface Player {
  id: number;
  name: string;
  nameCn?: string | null;
  position: string;
  team: string;
  cost: number;
  seasonStats?: { ppg: number; rpg: number; apg: number };
}

interface Room {
  id: number;
  name: string;
  salaryCap: number;
  isOfficial: boolean;
}

export function LineupBuilder() {
  const { gameDayId } = useParams<{ gameDayId: string }>();
  const navigate = useNavigate();

  const [players, setPlayers] = useState<Player[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<number>(1);
  const [posFilter, setPosFilter] = useState('ALL');
  const [gameDay, setGameDay] = useState<{ date: string; status: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'lineup' | 'pool'>('lineup');

  const { selections, totalCost, salaryCap, selectPlayer, removePlayer, reset, isValid, setSalaryCap } =
    useLineupStore();

  useEffect(() => {
    if (!gameDayId) return;
    Promise.all([
      gameDaysApi.get(Number(gameDayId)),
      gameDaysApi.players(Number(gameDayId)),
      roomsApi.list(),
    ]).then(([gd, ps, rs]) => {
      setGameDay(gd);
      setPlayers(ps);
      setRooms(rs);
      if (rs.length > 0) {
        const officialRoom = rs.find((r: Room) => r.isOfficial) ?? rs[0];
        setSelectedRoom(officialRoom.id);
        setSalaryCap(officialRoom.salaryCap);
      }
    });
    return () => reset();
  }, [gameDayId]);

  const handleRoomChange = (roomId: number) => {
    setSelectedRoom(roomId);
    const room = rooms.find((r) => r.id === roomId);
    if (room) setSalaryCap(room.salaryCap);
    reset();
  };

  const filtered = posFilter === 'ALL' ? players : players.filter((p) => p.position === posFilter);

  const handleSubmit = async () => {
    if (!isValid()) return;
    setSubmitting(true);
    setError('');
    try {
      await lineupsApi.create({
        gameDayId: Number(gameDayId),
        roomId: selectedRoom,
        pgId: selections['PG']!.id,
        sgId: selections['SG']!.id,
        sfId: selections['SF']!.id,
        pfId: selections['PF']!.id,
        cId: selections['C']!.id,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Failed to submit lineup');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="page-narrow" style={{ textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>Lineup Submitted!</h2>
        <p className="text-muted mt-8" style={{ fontSize: 15 }}>Your lineup has been saved successfully.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary btn-full mt-24">
          Back to Home
        </button>
      </div>
    );
  }

  const capPercent = Math.min(100, (totalCost / salaryCap) * 100);
  const overCap = totalCost > salaryCap;

  return (
    <div className="page" style={{ paddingTop: 14 }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Lineup Builder</h2>
        {gameDay && (
          <p className="text-muted mt-4" style={{ fontSize: 13 }}>{gameDay.date}</p>
        )}
      </div>

      {/* Room selector */}
      <div style={{ marginBottom: 14 }}>
        <select
          className="input"
          value={selectedRoom}
          onChange={(e) => handleRoomChange(Number(e.target.value))}
          style={{ fontSize: 14 }}
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — Cap ${r.salaryCap.toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile tabs */}
      <div className="tabs builder-tabs">
        <div
          className={`tab${activeTab === 'lineup' ? ' active' : ''}`}
          onClick={() => setActiveTab('lineup')}
        >
          My Lineup
        </div>
        <div
          className={`tab${activeTab === 'pool' ? ' active' : ''}`}
          onClick={() => setActiveTab('pool')}
        >
          Player Pool
        </div>
      </div>

      <div className="lineup-builder-grid">
        {/* ── Lineup panel ── */}
        <div className={`builder-panel${activeTab === 'lineup' ? ' active' : ''}`}>
          {/* Salary cap tracker */}
          <div className="salary-tracker">
            <div className="salary-tracker-header">
              <span className="text-muted">Salary Used</span>
              <span style={{ fontWeight: 700, color: overCap ? 'var(--primary)' : 'var(--text)' }}>
                ${totalCost.toLocaleString()} / ${salaryCap.toLocaleString()}
              </span>
            </div>
            <div className="salary-tracker-bar">
              <div
                className="salary-tracker-fill"
                style={{
                  width: `${capPercent}%`,
                  background: overCap ? 'var(--primary)' : 'var(--success)',
                }}
              />
            </div>
          </div>

          {/* Position slots */}
          {LINEUP_POSITIONS.map((pos) => {
            const picked = selections[pos];
            return (
              <div key={pos} className="pos-slot">
                <span className="pos-label">{pos}</span>
                {picked ? (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {picked.name}
                      </div>
                      {picked.nameCn && (
                        <div className="text-muted" style={{ fontSize: 12 }}>{picked.nameCn}</div>
                      )}
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {picked.team} · ${picked.cost.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => removePlayer(pos)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--primary)',
                        cursor: 'pointer', fontSize: 18, padding: '4px 6px', minWidth: 32,
                      }}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <span className="text-muted" style={{ fontSize: 14 }}>Pick a {pos}</span>
                )}
              </div>
            );
          })}

          {error && <div className="alert alert-error mt-12">{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={!isValid() || submitting}
            className={`btn btn-full mt-16 ${isValid() ? 'btn-primary' : 'btn-ghost'}`}
          >
            {submitting ? 'Submitting…' : 'Submit Lineup'}
          </button>

          <button
            className="btn btn-outline btn-full mt-8 mobile-only"
            onClick={() => setActiveTab('pool')}
          >
            Browse Players →
          </button>
        </div>

        {/* ── Player pool panel ── */}
        <div className={`builder-panel${activeTab === 'pool' ? ' active' : ''}`}>
          <div className="pos-tabs" style={{ marginBottom: 12 }}>
            {['ALL', ...LINEUP_POSITIONS].map((pos) => (
              <button
                key={pos}
                className={`pos-tab${posFilter === pos ? ' active' : ''}`}
                onClick={() => setPosFilter(pos)}
              >
                {pos}
              </button>
            ))}
          </div>

          <div
            className="card"
            style={{ padding: 0, overflow: 'hidden', maxHeight: 'calc(100dvh - 260px)', overflowY: 'auto' }}
          >
            {filtered.length === 0 ? (
              <div className="empty">No players found</div>
            ) : (
              filtered.map((player) => {
                const alreadySelected = LINEUP_POSITIONS.some((p) => selections[p]?.id === player.id);
                const positionFilled = selections[player.position] !== null && !alreadySelected;
                return (
                  <div
                    key={player.id}
                    className={`player-item${alreadySelected ? ' selected' : ''}${positionFilled ? ' disabled' : ''}`}
                    onClick={() => !positionFilled && selectPlayer(player.position, player)}
                  >
                    <span className="player-pos-badge">{player.position}</span>
                    <div className="player-info">
                      <div className="player-name">{player.name}</div>
                      <div className="player-sub">
                        {player.nameCn ? `${player.nameCn} · ` : ''}{player.team}
                        {player.seasonStats ? ` · ${player.seasonStats.ppg}pt ${player.seasonStats.rpg}rb ${player.seasonStats.apg}as` : ''}
                      </div>
                    </div>
                    <span className="player-cost">${player.cost.toLocaleString()}</span>
                    {alreadySelected && <span className="player-check">✓</span>}
                  </div>
                );
              })
            )}
          </div>

          <button
            className="btn btn-ghost btn-full mt-8 mobile-only"
            onClick={() => setActiveTab('lineup')}
          >
            ← View My Lineup
          </button>
        </div>
      </div>
    </div>
  );
}
