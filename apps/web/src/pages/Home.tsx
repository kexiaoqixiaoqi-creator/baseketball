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

/** 阵容网格中的单个位置卡片（头像占 2 行左侧，信息分两行右侧） */
function LineupSlotCard({
  pos,
  isViewMode,
  myLineup,
  selections,
  posFilter,
  setPosFilter,
  removePlayer,
  getPerformanceTag,
}: {
  pos: string;
  isViewMode: boolean;
  myLineup: { totalScore: number | null; players: Record<string, { id: number; name: string; team: string; cost: number; actualScore: number | null; avatarUrl?: string | null }> } | null;
  selections: Record<string, { id: number; name: string; team: string; cost: number; avatarUrl?: string | null } | null>;
  posFilter: string;
  setPosFilter: (pos: string) => void;
  removePlayer: (pos: string) => void;
  getPerformanceTag: (score: number | null | undefined, cost: number) => '爆' | '猛' | null;
}) {
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
  const perfTag = isViewMode && picked ? getPerformanceTag(picked.actualScore, picked.cost) : null;

  return (
    <div
      className={`home-lineup-grid-card home-lineup-slot-card${isSelectedPos ? ' selected-pos' : ''} clickable-slot`}
      role="button"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('.home-remove-btn')) return;
        setPosFilter(pos);
      }}
    >
      {picked ? (
        <div className="home-lineup-slot-inner">
          <div className="home-lineup-slot-avatar-wrap">
            <div className="home-lineup-slot-avatar">
              {picked.avatarUrl ? (
                <img src={picked.avatarUrl} alt="" />
              ) : (
                <div className="home-lineup-slot-avatar-placeholder" />
              )}
            </div>
            <span className="home-lineup-card-label pos-label">{pos}</span>
          </div>
          <div className="home-lineup-slot-info">
            <span className="home-player-name">{picked.name}</span>
            <span className="team-badge home-slot-team">{picked.team}</span>
            <span className="home-pos-cost-meta home-slot-cost">${picked.cost.toLocaleString()}</span>
            {isViewMode ? (
              <div className="home-lineup-slot-score-cell">
                {perfTag && <span className={`perf-tag perf-tag-${perfTag}`}>{perfTag}</span>}
                <span className="home-pos-score home-pos-score-emphasis">
                  {(picked.actualScore ?? 0).toFixed(1)} 分
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePlayer(pos);
                }}
                className="home-remove-btn home-slot-remove"
              >
                移除
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="home-lineup-slot-empty">
          <span className="home-lineup-card-label pos-label">{pos}</span>
          <span className="text-muted home-pick-placeholder">
            {isViewMode ? '—' : `选择 ${pos}`}
          </span>
        </div>
      )}
    </div>
  );
}

/** 增强标签：score - cost/1000 > 20 → 爆；> 10 → 猛 */
function getPerformanceTag(score: number | null | undefined, cost: number): '爆' | '猛' | null {
  const val = (score ?? 0) - cost / 1000;
  if (val > 20) return '爆';
  if (val > 10) return '猛';
  return null;
}

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
  /** playing/finish 时按 score 从高到低排序 */
  const displayedPlayers = useMemo(() => {
    const viewMode = selectedDay?.status === 'playing' || selectedDay?.status === 'finish';
    if (!viewMode) return filteredPlayers;
    return [...filteredPlayers].sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0),
    );
  }, [filteredPlayers, selectedDay?.status]);

  const anchoredPlayerId = posFilter ? selections[posFilter]?.id : null;

  useEffect(() => {
    if (!anchoredPlayerId) return;
    const el = document.querySelector(`[data-player-id="${anchoredPlayerId}"]`);
    if (el) {
      const timer = setTimeout(() => {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [anchoredPlayerId, displayedPlayers]);

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

  /** 赛日状态展示：label 用于显示，key 用于 CSS class */
  const { gameDayStatusLabel, gameDayStatusKey } = (() => {
    if (selectedDay == null || (selectedDay.games?.length ?? 0) === 0) {
      return { gameDayStatusLabel: '未激活', gameDayStatusKey: 'inactive' };
    }
    switch (selectedDay.status) {
      case 'prepare': return { gameDayStatusLabel: '准备中', gameDayStatusKey: 'preparing' };
      case 'playing': return { gameDayStatusLabel: '进行中', gameDayStatusKey: 'playing' };
      case 'finish': return { gameDayStatusLabel: '已结束', gameDayStatusKey: 'finish' };
      default: return { gameDayStatusLabel: '未激活', gameDayStatusKey: 'inactive' };
    }
  })();

  return (
    <div className="page page-home">
      {/* Header + game day（随整页滚动） */}
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
            <span className={`home-status-badge status-${gameDayStatusKey}`}>
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
          {/* ── 我的阵容（sticky 吸顶）── */}
          <div className="card home-lineup-card home-lineup-sticky">
            <div className="home-lineup-header">
              <h3 className="home-section-title">我的阵容</h3>
              {isViewMode && myLineup ? (
                <div className="home-lineup-total-header">
                  <span className="home-lineup-total-value">
                    {(
                      myLineup.totalScore ??
                      Object.values(myLineup.players).reduce(
                        (sum, p) => sum + (p?.actualScore ?? 0),
                        0,
                      )
                    ).toFixed(1)}
                  </span>
                  <span className="home-lineup-total-unit">分</span>
                </div>
              ) : (
                <div className="home-lineup-actions">
                  <span
                    className="home-salary-inline"
                    style={{ color: overCap ? 'var(--primary)' : 'var(--text)' }}
                  >
                    ${totalCost.toLocaleString()}/${salaryCap.toLocaleString()}
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={!isValid() || submitting}
                    className={`btn btn-xs home-submit-inline ${isValid() ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {submitting
                      ? '…'
                      : existingLineupId
                        ? '更新'
                        : '提交'}
                  </button>
                </div>
              )}
            </div>
            {!isViewMode && (
              <div className="salary-tracker home-salary-tracker">
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

            <div className="home-lineup-grid">
              {/* 第一行：C 居中 */}
              <div className="home-lineup-c-row-wrap">
                <LineupSlotCard
                  pos="C"
                  isViewMode={isViewMode}
                  myLineup={myLineup}
                  selections={selections}
                  posFilter={posFilter}
                  setPosFilter={setPosFilter}
                  removePlayer={removePlayer}
                  getPerformanceTag={getPerformanceTag}
                />
              </div>
              {/* 第二行：PF、SF */}
              {(['PF', 'SF'] as const).map((pos) => (
                <LineupSlotCard
                  key={pos}
                  pos={pos}
                  isViewMode={isViewMode}
                  myLineup={myLineup}
                  selections={selections}
                  posFilter={posFilter}
                  setPosFilter={setPosFilter}
                  removePlayer={removePlayer}
                  getPerformanceTag={getPerformanceTag}
                />
              ))}
              {/* 第三行：SG、PG */}
              {(['SG', 'PG'] as const).map((pos) => (
                <LineupSlotCard
                  key={pos}
                  pos={pos}
                  isViewMode={isViewMode}
                  myLineup={myLineup}
                  selections={selections}
                  posFilter={posFilter}
                  setPosFilter={setPosFilter}
                  removePlayer={removePlayer}
                  getPerformanceTag={getPerformanceTag}
                />
              ))}
            </div>

            {error && <div className="alert alert-error home-alert">{error}</div>}

            {!isViewMode && !isAuthenticated && (
              <p className="text-muted home-login-hint">需登录后才能提交</p>
            )}
          </div>

          {/* ── Player Pool (lower)，位置筛选通过上方阵容槽点击切换 ── */}
          <div className="home-players-section">
            <h3 className="home-section-title">球员池</h3>

            <div className="card home-player-list">
              {loading ? (
                <div className="loading home-loading">加载球员中…</div>
              ) : displayedPlayers.length === 0 ? (
                <div className="empty">暂无球员</div>
              ) : (
                displayedPlayers.map((player) => {
                  const inLineup = isViewMode
                    ? myLineup && Object.values(myLineup.players).some((p) => p?.id === player.id)
                    : LINEUP_POSITIONS.some((p) => selections[p]?.id === player.id);
                  const perfTag = isViewMode ? getPerformanceTag(player.score, player.cost) : null;
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
                        {!isViewMode && <span className="team-badge">{player.team}</span>}
                        {perfTag && <span className={`perf-tag perf-tag-${perfTag}`}>{perfTag}</span>}
                        {isViewMode ? (
                          <div className="player-right">
                            <span className="player-score-emphasis">{(player.score ?? 0).toFixed(1)}分</span>
                          </div>
                        ) : (
                          <div className="player-right">
                            <span className="player-cost">${player.cost.toLocaleString()}</span>
                          </div>
                        )}
                        {inLineup && !isViewMode && <span className="player-check">✓</span>}
                      </div>
                      {(isViewMode || player.seasonStats) && (
                        <div className="player-item-row2">
                          {isViewMode ? (
                            <>
                              <span className="team-badge">{player.team}</span>
                              <span className="player-cost-inline">${player.cost.toLocaleString()}</span>
                              <span className="player-stats">
                                {' · '}
                                {player.gameStats
                                  ? `${player.gameStats.pts}分 ${player.gameStats.reb}板 ${player.gameStats.ast}助 ${player.gameStats.stl}断 ${player.gameStats.blk}帽 ${player.gameStats.to}误`
                                  : '0分 0板 0助 0断 0帽 0误'}
                              </span>
                            </>
                          ) : (
                            <span className="player-stats">
                              {`${Number(player.seasonStats!.ppg).toFixed(1)}分 ${Number(player.seasonStats!.rpg).toFixed(1)}板 ${Number(player.seasonStats!.apg).toFixed(1)}助 ${Number(player.seasonStats!.spg ?? 0).toFixed(1)}断 ${Number(player.seasonStats!.bpg ?? 0).toFixed(1)}帽 ${Number(player.seasonStats!.topg ?? 0).toFixed(1)}误`}
                            </span>
                          )}
                        </div>
                      )}
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
