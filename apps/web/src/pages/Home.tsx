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
  score?: number | null;
  gameStats?: { pts: number; reb: number; ast: number; stl: number; blk: number; to: number } | null;
  seasonStats?: { ppg: number; rpg: number; apg: number };
}


const todayStr = () => new Date().toISOString().slice(0, 10);

/** 筛选出：当前日、前一日、后一日，共 3 个赛日；默认当前日 */
function getDisplayDays(days: GameDay[]): { displayDays: GameDay[]; defaultDay: GameDay | null } {
  if (!days.length) return { displayDays: [], defaultDay: null };
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const today = todayStr();
  let idx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < sorted.length; i++) {
    const diff = Math.abs(new Date(sorted[i].date).getTime() - new Date(today).getTime());
    if (diff < minDiff) {
      minDiff = diff;
      idx = i;
    }
  }
  const indices = [
    Math.max(0, idx - 1),
    idx,
    Math.min(sorted.length - 1, idx + 1),
  ];
  const displayDays = [...new Set(indices)].map((i) => sorted[i]).sort((a, b) => a.date.localeCompare(b.date));
  return { displayDays, defaultDay: sorted[idx] };
}

export function Home() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const [allDays, setAllDays] = useState<GameDay[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [officialRoom, setOfficialRoom] = useState<{ id: number } | null>(null);
  const [posFilter, setPosFilter] = useState(LINEUP_POSITIONS[0]);
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
    populateFromLineup,
    isValid,
    setSalaryCap,
  } = useLineupStore();

  const [existingLineupId, setExistingLineupId] = useState<number | null>(null);
  const [myLineup, setMyLineup] = useState<{
    totalScore: number | null;
    players: Record<string, { id: number; name: string; team: string; cost: number; actualScore: number | null }>;
  } | null>(null);

  const selectedDay = useMemo(
    () => (selectedDayId ? allDays.find((d) => d.id === selectedDayId) ?? null : null),
    [allDays, selectedDayId],
  );

  const displayDays = useMemo(() => getDisplayDays(allDays).displayDays, [allDays]);

  useEffect(() => {
    gameDaysApi
      .list()
      .then((list: GameDay[]) => {
        setAllDays(list);
        const { defaultDay } = getDisplayDays(list);
        setSelectedDayId(defaultDay?.id ?? null);
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
  }, [selectedDayId, officialRoom?.id, setSalaryCap]);

  useEffect(() => {
    if (!selectedDayId || !officialRoom?.id) return;
    if (!isAuthenticated) {
      reset();
      setExistingLineupId(null);
      setMyLineup(null);
      return;
    }
    lineupsApi
      .my(selectedDayId, officialRoom.id)
      .then(
        (data: {
          id: number;
          totalScore: number | null;
          players: Record<string, { id: number; name: string; team: string; cost: number; actualScore: number | null }>;
        }) => {
          setExistingLineupId(data.id);
          setMyLineup({ totalScore: data.totalScore, players: data.players });
          populateFromLineup(data.players);
        },
      )
      .catch(() => {
        setExistingLineupId(null);
        setMyLineup(null);
        reset();
      });
  }, [selectedDayId, officialRoom?.id, isAuthenticated, populateFromLineup, reset]);

  const filteredPlayers = players.filter((p) => p.position === posFilter);

  const handleSubmit = async () => {
    if (!isValid()) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!selectedDayId || !officialRoom?.id) return;

    const payload = {
      pgId: selections['PG']!.id,
      sgId: selections['SG']!.id,
      sfId: selections['SF']!.id,
      pfId: selections['PF']!.id,
      cId: selections['C']!.id,
    };

    setSubmitting(true);
    setError('');
    try {
      if (existingLineupId) {
        await lineupsApi.update(existingLineupId, payload);
      } else {
        await lineupsApi.create({
          gameDayId: selectedDayId,
          roomId: officialRoom.id,
          ...payload,
        });
      }
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
  /** playing | finish → 只读展示（阵容+得分）；prepare → 可选人、可提交 */
  const isViewMode = selectedDay?.status === 'playing' || selectedDay?.status === 'finish';

  /** 赛日状态展示：inactive | preparing | playing | finish */
  const gameDayStatusLabel =
    selectedDay == null
      ? 'inactive'
      : (selectedDay.games?.length ?? 0) === 0
        ? 'inactive'
        : selectedDay.status === 'prepare'
          ? 'preparing'
          : selectedDay.status === 'playing'
            ? 'playing'
            : selectedDay.status === 'finish'
              ? 'finish'
              : 'inactive';

  if (success) {
    return (
      <div className="page page-home" style={{ textAlign: 'center', paddingTop: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--success)' }}>Lineup Submitted!</h2>
        <p className="text-muted mt-6" style={{ fontSize: 13 }}>Your lineup has been saved.</p>
        <button onClick={() => setSuccess(false)} className="btn btn-primary btn-full mt-14">
          Build Another
        </button>
      </div>
    );
  }

  return (
    <div className="page page-home">
      {/* Header + game day + room */}
      <div className="home-header">
        <h1 className="home-title">Fantasy NBA</h1>
        <p className="home-subtitle text-muted">Build your lineup</p>

        {displayDays.length > 0 && (
          <div className="home-day-chips">
            {displayDays.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`home-day-chip${selectedDayId === d.id ? ' active' : ''}`}
                onClick={() => setSelectedDayId(d.id)}
              >
                {d.date}
              </button>
            ))}
          </div>
        )}
        {selectedDay && (
          <div className={`home-status-badge status-${gameDayStatusLabel}`}>
            {gameDayStatusLabel}
          </div>
        )}
      </div>

      {!selectedDay && displayDays.length === 0 && !loading && (
        <div className="card home-empty">
          <div className="home-empty-icon">📅</div>
          <p className="text-muted">No game days yet.</p>
        </div>
      )}

      {selectedDay && (
        <>
          {/* ── My Lineup (upper) ── */}
          <div className="card home-lineup-card">
            <h3 className="home-section-title">My Lineup</h3>
            {isViewMode && myLineup && (
              <div className="home-total-score">
                Total:{' '}
                <strong>
                  {(myLineup.totalScore ??
                    Object.values(myLineup.players).reduce(
                      (sum, p) => sum + (p?.actualScore ?? 0),
                      0,
                    )
                  ).toFixed(1)}{' '}
                  pts
                </strong>
              </div>
            )}
            {!isViewMode && (
              <div className="salary-tracker home-salary-tracker">
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
            )}

            {LINEUP_POSITIONS.map((pos) => {
              const slot = isViewMode && myLineup ? myLineup.players[pos] : selections[pos];
              const picked = slot
                ? {
                    name: slot.name ?? 'Unknown',
                    team: slot.team ?? '',
                    cost: slot.cost ?? 0,
                    actualScore: slot && 'actualScore' in slot ? (slot as { actualScore?: number | null }).actualScore : null,
                  }
                : null;
              const isSelectedPos = posFilter === pos;
              return (
                <div
                  key={pos}
                  className={`pos-slot home-pos-slot${isSelectedPos ? ' selected-pos' : ''} clickable-slot`}
                  role="button"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.home-remove-btn')) return;
                    setPosFilter(pos);
                  }}
                >
                  <span className="pos-label">{pos}</span>
                  {picked ? (
                    <div className="home-pos-content">
                      <div className="home-player-name">{picked.name}</div>
                      <div className="text-muted home-player-meta">
                        {picked.team} · ${picked.cost.toLocaleString()}
                        {picked.actualScore != null && (
                          <span className="home-player-score"> · {picked.actualScore.toFixed(1)} pts</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted home-pick-placeholder">
                      {isViewMode ? '—' : `Pick a ${pos}`}
                    </span>
                  )}
                  {!isViewMode && picked && (
                    <button
                      type="button"
                      onClick={() => removePlayer(pos)}
                      className="home-remove-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}

            {error && <div className="alert alert-error home-alert">{error}</div>}

            {!isViewMode && (
              <>
                <button
                  onClick={handleSubmit}
                  disabled={!isValid() || submitting}
                  className={`btn btn-full btn-sm home-submit-btn ${isValid() ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {submitting
                    ? (existingLineupId ? 'Updating…' : 'Submitting…')
                    : (existingLineupId ? 'Update Lineup' : 'Submit Lineup')}
                </button>
                {!isAuthenticated && (
                  <p className="text-muted home-login-hint">Login required to submit</p>
                )}
              </>
            )}
          </div>

          {/* ── Player Pool (lower)，位置筛选通过上方阵容槽点击切换 ── */}
          <div className="home-players-section">
            <h3 className="home-section-title">Players</h3>

            <div className="card home-player-list">
              {loading ? (
                <div className="loading home-loading">Loading players…</div>
              ) : filteredPlayers.length === 0 ? (
                <div className="empty">No players found</div>
              ) : (
                filteredPlayers.map((player) => {
                  const inLineup = isViewMode
                    ? myLineup && Object.values(myLineup.players).some((p) => p?.id === player.id)
                    : LINEUP_POSITIONS.some((p) => selections[p]?.id === player.id);
                  return (
                    <div
                      key={player.id}
                      className={`player-item${inLineup ? ' selected' : ''}${isViewMode ? ' readonly' : ''}`}
                      onClick={
                        isViewMode
                          ? undefined
                          : () =>
                              inLineup
                                ? removePlayer(player.position)
                                : selectPlayer(player.position, player)
                      }
                    >
                      <span className="player-pos-badge">{player.position}</span>
                      <div className="player-info">
                        <div className="player-name">{player.name}</div>
                        <div className="player-sub">
                          {player.nameCn ? `${player.nameCn} · ` : ''}{player.team}
                          {player.gameStats
                            ? ` · ${player.gameStats.pts}pt ${player.gameStats.reb}rb ${player.gameStats.ast}as`
                            : player.seasonStats
                              ? ` · ${player.seasonStats.ppg}pt ${player.seasonStats.rpg}rb ${player.seasonStats.apg}as`
                              : ''}
                          {player.score != null && (
                            <span className="home-player-score"> · {player.score.toFixed(1)} pts</span>
                          )}
                        </div>
                      </div>
                      <div className="player-right">
                        {player.score != null && (
                          <span className="player-score">{player.score.toFixed(1)} pts</span>
                        )}
                        <span className="player-cost">${player.cost.toLocaleString()}</span>
                      </div>
                      {inLineup && !isViewMode && <span className="player-check">✓</span>}
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
