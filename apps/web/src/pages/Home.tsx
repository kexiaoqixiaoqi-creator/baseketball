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
  avatarUrl?: string | null;
  score?: number | null;
  gameStats?: { pts: number; reb: number; ast: number; stl: number; blk: number; to: number } | null;
  seasonStats?: { ppg: number; rpg: number; apg: number; spg: number; bpg: number; topg: number };
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
    players: Record<string, { id: number; name: string; team: string; cost: number; actualScore: number | null; avatarUrl?: string | null }>;
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
          players: Record<string, { id: number; name: string; team: string; cost: number; actualScore: number | null; avatarUrl?: string | null }>;
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
  const anchoredPlayerId = posFilter ? selections[posFilter]?.id : null;

  useEffect(() => {
    if (!anchoredPlayerId) return;
    const el = document.querySelector(`[data-player-id="${anchoredPlayerId}"]`);
    if (el) {
      const timer = setTimeout(() => {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [anchoredPlayerId, filteredPlayers]);

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
      setError(e.response?.data?.message ?? '提交阵容失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
    if (selectedDayId && officialRoom?.id) {
      gameDaysApi.players(selectedDayId, officialRoom.id).then(
        (res: { players: Player[]; salaryCap: number }) => {
          setPlayers(res.players);
          setSalaryCap(res.salaryCap);
        },
      );
      if (isAuthenticated) {
        lineupsApi
          .my(selectedDayId, officialRoom.id)
          .then(
            (data: {
              id: number;
              totalScore: number | null;
              players: Record<string, { id: number; name: string; team: string; cost: number; actualScore: number | null; avatarUrl?: string | null }>;
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
      }
    }
  };

  const capPercent = salaryCap > 0 ? Math.min(100, (totalCost / salaryCap) * 100) : 0;
  const overCap = totalCost > salaryCap;
  /** playing | finish → 只读展示（阵容+得分）；prepare → 可选人、可提交 */
  const isViewMode = selectedDay?.status === 'playing' || selectedDay?.status === 'finish';

  /** 赛日状态展示 */
  const gameDayStatusLabel =
    selectedDay == null
      ? '未激活'
      : (selectedDay.games?.length ?? 0) === 0
        ? '未激活'
        : selectedDay.status === 'prepare'
          ? '准备中'
          : selectedDay.status === 'playing'
            ? '进行中'
            : selectedDay.status === 'finish'
              ? '已结束'
              : '未激活';

  return (
    <div className="page page-home">
      {/* Header + game day + room */}
      <div className="home-header">
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
        <div className="home-header-bottom">
          <h1 className="home-title">Fantasy NBA</h1>
          <span className="home-subtitle text-muted">组建你的阵容</span>
          {selectedDay && (
            <span className={`home-status-badge status-${gameDayStatusLabel}`}>
              {gameDayStatusLabel}
            </span>
          )}
        </div>
      </div>

      {!selectedDay && displayDays.length === 0 && !loading && (
        <div className="card home-empty">
          <div className="home-empty-icon">📅</div>
          <p className="text-muted">暂无赛日。</p>
        </div>
      )}

      {selectedDay && (
        <>
          {/* ── My Lineup (upper) ── */}
          <div className="card home-lineup-card">
            <h3 className="home-section-title">我的阵容</h3>
            {isViewMode && myLineup && (
              <div className="home-total-score">
                总分：{' '}
                <strong>
                  {(myLineup.totalScore ??
                    Object.values(myLineup.players).reduce(
                      (sum, p) => sum + (p?.actualScore ?? 0),
                      0,
                    )
                  ).toFixed(1)}{' '}
                  分
                </strong>
              </div>
            )}
            {!isViewMode && (
              <div className="salary-tracker home-salary-tracker">
                <div className="salary-tracker-header">
                  <span className="text-muted">已用薪资</span>
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
                    name: slot.name ?? '未知',
                    team: slot.team ?? '',
                    cost: slot.cost ?? 0,
                    actualScore: slot && 'actualScore' in slot ? (slot as { actualScore?: number | null }).actualScore : null,
                    avatarUrl: slot && 'avatarUrl' in slot ? (slot as { avatarUrl?: string | null }).avatarUrl : null,
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
                      {picked.avatarUrl && (
                        <div className="home-pos-avatar">
                          <img src={picked.avatarUrl} alt="" />
                        </div>
                      )}
                      <div className="home-pos-text">
                        <span className="home-player-name">{picked.name}</span>
                        <span className="home-player-meta">
                          {picked.team} · ${picked.cost.toLocaleString()}
                        </span>
                      </div>
                      {picked.actualScore != null && (
                        <span className="home-pos-score">{picked.actualScore.toFixed(1)}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted home-pick-placeholder">
                      {isViewMode ? '—' : `选择 ${pos}`}
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
                    ? (existingLineupId ? '更新中…' : '提交中…')
                    : (existingLineupId ? '更新阵容' : '提交阵容')}
                </button>
                {!isAuthenticated && (
                  <p className="text-muted home-login-hint">需登录后才能提交</p>
                )}
              </>
            )}
          </div>

          {/* ── Player Pool (lower)，位置筛选通过上方阵容槽点击切换 ── */}
          <div className="home-players-section">
            <h3 className="home-section-title">球员池</h3>

            <div className="card home-player-list">
              {loading ? (
                <div className="loading home-loading">加载球员中…</div>
              ) : filteredPlayers.length === 0 ? (
                <div className="empty">暂无球员</div>
              ) : (
                filteredPlayers.map((player) => {
                  const inLineup = isViewMode
                    ? myLineup && Object.values(myLineup.players).some((p) => p?.id === player.id)
                    : LINEUP_POSITIONS.some((p) => selections[p]?.id === player.id);
                  return (
                    <div
                      key={player.id}
                      data-player-id={player.id}
                      className={`player-item player-item-two-row${inLineup ? ' selected' : ''}${!isViewMode && posFilter && selections[posFilter]?.id === player.id ? ' anchored' : ''}${isViewMode ? ' readonly' : ''}`}
                      onClick={
                        isViewMode
                          ? undefined
                          : () =>
                              inLineup
                                ? removePlayer(player.position)
                                : selectPlayer(player.position, player)
                      }
                    >
                      <div className="player-item-row1">
                        {player.avatarUrl && (
                          <div className="home-player-avatar">
                            <img src={player.avatarUrl} alt="" />
                          </div>
                        )}
                        <span className="player-pos-badge">{player.position}</span>
                        <span className="player-name">{player.nameCn ?? player.name}</span>
                        <span className="player-team">{player.team}</span>
                        <div className="player-right">
                          <span className="player-cost">${player.cost.toLocaleString()}</span>
                        </div>
                        {inLineup && !isViewMode && <span className="player-check">✓</span>}
                      </div>
                      <div className="player-item-row2">
                        {player.score != null && (
                          <span className="player-score-inline">{player.score.toFixed(1)}分</span>
                        )}
                        {(player.gameStats || player.seasonStats) && (
                          <span className="player-stats">
                            {player.score != null && ' · '}
                            {player.gameStats
                              ? `${player.gameStats.pts}分 ${player.gameStats.reb}板 ${player.gameStats.ast}助 ${player.gameStats.stl}断 ${player.gameStats.blk}帽 ${player.gameStats.to}误`
                              : player.seasonStats
                                ? `${Number(player.seasonStats.ppg).toFixed(1)}分 ${Number(player.seasonStats.rpg).toFixed(1)}板 ${Number(player.seasonStats.apg).toFixed(1)}助 ${Number(player.seasonStats.spg ?? 0).toFixed(1)}断 ${Number(player.seasonStats.bpg ?? 0).toFixed(1)}帽 ${Number(player.seasonStats.topg ?? 0).toFixed(1)}误`
                                : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {success && (
        <div className="home-success-overlay" onClick={handleCloseSuccess}>
          <div className="home-success-modal card" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--success)' }}>
              {existingLineupId ? '阵容已更新！' : '阵容已提交！'}
            </h2>
            <p className="text-muted mt-6" style={{ fontSize: 13 }}>你的阵容已保存。</p>
            <button onClick={handleCloseSuccess} className="btn btn-primary btn-full mt-10">
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
