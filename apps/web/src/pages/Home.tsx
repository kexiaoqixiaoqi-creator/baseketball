import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LINEUP_POSITIONS } from '@fantasy-nba/shared';
import { gameDaysApi } from '../api/game-days.api';
import { roomsApi } from '../api/rooms.api';
import { lineupsApi } from '../api/lineups.api';
import { useLineupStore } from '../stores/lineup.store';
import { useAuthStore } from '../stores/auth.store';

interface GameDay {
  id: number;
  date: string;
  status: string;
  salaryCap: number;
  games: { id: number; homeTeam: string; awayTeam: string; status: string }[];
}

interface Player {
  id: number;
  name: string;
  nameCn?: string | null;
  position: string;
  team: string;
  cost: number;
  seasonStats?: { ppg: number; rpg: number; apg: number };
}


/** 选择离当前日期最近的赛日 */
function pickClosestToToday(days: GameDay[]): GameDay | null {
  if (!days.length) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let closest = days[0];
  let minDiff = Infinity;
  for (const d of days) {
    const dDate = new Date(d.date);
    dDate.setHours(0, 0, 0, 0);
    const diff = Math.abs(dDate.getTime() - today.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = d;
    }
  }
  return closest;
}

export function Home() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const [allDays, setAllDays] = useState<GameDay[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [officialRoom, setOfficialRoom] = useState<{ id: number } | null>(null);
  const [posFilter, setPosFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    selections,
    totalCost,
    salaryCap,
    selectPlayer,
    removePlayer,
    reset,
    isValid,
    setSalaryCap,
  } = useLineupStore();

  const selectedDay = useMemo(
    () => (selectedDayId ? allDays.find((d) => d.id === selectedDayId) ?? null : null),
    [allDays, selectedDayId],
  );

  useEffect(() => {
    gameDaysApi
      .list()
      .then((list: GameDay[]) => {
        setAllDays(list);
        const closest = pickClosestToToday(list);
        setSelectedDayId(closest?.id ?? null);
      })
      .catch(() => setAllDays([]));
    roomsApi
      .official()
      .then((r: { id: number }) => {
        setOfficialRoom({ id: r.id });
      })
      .catch(() => setOfficialRoom(null));
  }, []);

  useEffect(() => {
    if (!selectedDayId) {
      setPlayers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    gameDaysApi
      .players(selectedDayId, officialRoom?.id ?? undefined)
      .then((res: { players: Player[]; salaryCap: number }) => {
        setPlayers(res.players);
        setSalaryCap(res.salaryCap);
        setLoading(false);
      })
      .catch(() => {
        setPlayers([]);
        setLoading(false);
      });
    reset();
  }, [selectedDayId, officialRoom?.id, reset, setSalaryCap]);

  const filteredPlayers = posFilter === 'ALL' ? players : players.filter((p) => p.position === posFilter);

  const handleSubmit = async () => {
    if (!isValid()) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!selectedDayId) return;

    setSubmitting(true);
    setError('');
    try {
      await lineupsApi.create({
        gameDayId: selectedDayId,
        roomId: officialRoom?.id ?? 1,
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

  const capPercent = salaryCap > 0 ? Math.min(100, (totalCost / salaryCap) * 100) : 0;
  const overCap = totalCost > salaryCap;

  if (success) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>Lineup Submitted!</h2>
        <p className="text-muted mt-8" style={{ fontSize: 14 }}>Your lineup has been saved.</p>
        <button onClick={() => setSuccess(false)} className="btn btn-primary btn-full mt-20">
          Build Another
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header + game day + room */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Fantasy NBA</h1>
        <p className="text-muted mt-4" style={{ fontSize: 13 }}>Build your lineup</p>

        {allDays.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {allDays.map((d) => (
              <button
                key={d.id}
                type="button"
                className="badge"
                style={{
                  padding: '6px 12px',
                  cursor: 'pointer',
                  border: selectedDayId === d.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: 6,
                  background: selectedDayId === d.id ? 'var(--primary)' : 'var(--bg-card)',
                  color: selectedDayId === d.id ? 'white' : 'inherit',
                }}
                onClick={() => setSelectedDayId(d.id)}
              >
                {d.date}
              </button>
            ))}
          </div>
        )}

      </div>

      {!selectedDay && allDays.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
          <p className="text-muted">No game days yet.</p>
        </div>
      )}

      {selectedDay && (
        <>
          {/* ── My Lineup (upper) ── */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>My Lineup</h3>
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

            {LINEUP_POSITIONS.map((pos) => {
              const picked = selections[pos];
              return (
                <div key={pos} className="pos-slot">
                  <span className="pos-label">{pos}</span>
                  {picked ? (
                    <>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
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
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          fontSize: 18,
                          padding: '4px 6px',
                          minWidth: 32,
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
              className={`btn btn-full mt-14 ${isValid() ? 'btn-primary' : 'btn-ghost'}`}
            >
              {submitting ? 'Submitting…' : 'Submit Lineup'}
            </button>
            {!isAuthenticated && (
              <p className="text-muted mt-6" style={{ fontSize: 12 }}>
                Login required to submit
              </p>
            )}
          </div>

          {/* ── Player Pool (lower) ── */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Players</h3>
            <div className="pos-tabs" style={{ marginBottom: 10 }}>
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

            <div className="card" style={{ padding: 0, overflow: 'hidden', maxHeight: 400, overflowY: 'auto' }}>
              {loading ? (
                <div className="loading" style={{ padding: 32 }}>Loading players…</div>
              ) : filteredPlayers.length === 0 ? (
                <div className="empty">No players found</div>
              ) : (
                filteredPlayers.map((player) => {
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
                          {player.seasonStats
                            ? ` · ${player.seasonStats.ppg}pt ${player.seasonStats.rpg}rb ${player.seasonStats.apg}as`
                            : ''}
                        </div>
                      </div>
                      <span className="player-cost">${player.cost.toLocaleString()}</span>
                      {alreadySelected && <span className="player-check">✓</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
