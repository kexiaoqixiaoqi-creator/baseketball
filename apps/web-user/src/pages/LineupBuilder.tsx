import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LINEUP_POSITIONS } from '@fantasy-nba/shared';
import { gameDaysApi } from '../api/game-days.api';
import { lineupsApi } from '../api/lineups.api';
import { roomsApi } from '../api/rooms.api';
import { useLineupStore } from '../stores/lineup.store';
import { PlayerCard } from '../components/PlayerCard';
import { SalaryCapTracker } from '../components/SalaryCapTracker';

interface Player {
  id: number;
  name: string;
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

  const { selections, totalCost, salaryCap, selectPlayer, removePlayer, reset, isValid, setSalaryCap } = useLineupStore();

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
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: 24 }}>
        <h2 style={{ color: '#27ae60' }}>Lineup Submitted!</h2>
        <p style={{ color: '#aaa' }}>Your lineup has been saved successfully.</p>
        <button onClick={() => navigate('/')} style={{ background: '#e94560', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ color: '#fff' }}>Lineup Builder — {gameDay?.date}</h2>

      {/* Room selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ color: '#aaa', fontSize: 14 }}>Room: </label>
        <select value={selectedRoom} onChange={(e) => handleRoomChange(Number(e.target.value))}
          style={{ background: '#16213e', color: '#fff', border: '1px solid #333', padding: '6px 12px', borderRadius: 4, marginLeft: 8 }}>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name} (Cap: ${r.salaryCap.toLocaleString()})</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>
        {/* Left: current lineup */}
        <div>
          <h3 style={{ color: '#fff', marginBottom: 12 }}>Your Lineup</h3>
          <SalaryCapTracker totalCost={totalCost} salaryCap={salaryCap} />

          {LINEUP_POSITIONS.map((pos) => (
            <div key={pos} style={{ background: '#16213e', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>{pos}</div>
              {selections[pos] ? (
                <PlayerCard
                  player={selections[pos]!}
                  onRemove={() => removePlayer(pos)}
                  selected
                />
              ) : (
                <div style={{ color: '#555', fontSize: 14, padding: '8px 0' }}>Empty — pick a {pos}</div>
              )}
            </div>
          ))}

          {error && <div style={{ background: '#e94560', color: '#fff', padding: 12, borderRadius: 6, marginTop: 8 }}>{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={!isValid() || submitting}
            style={{
              width: '100%', marginTop: 16, background: isValid() ? '#e94560' : '#555',
              color: '#fff', border: 'none', padding: '14px', borderRadius: 8,
              fontWeight: 700, fontSize: 16, cursor: isValid() ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Lineup'}
          </button>
        </div>

        {/* Right: player pool */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['ALL', ...LINEUP_POSITIONS].map((pos) => (
              <button key={pos} onClick={() => setPosFilter(pos)}
                style={{ background: posFilter === pos ? '#e94560' : '#16213e', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13 }}>
                {pos}
              </button>
            ))}
          </div>

          <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {filtered.map((player) => {
              const alreadySelected = LINEUP_POSITIONS.some((pos) => selections[pos]?.id === player.id);
              const positionFilled = selections[player.position] !== null;
              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onSelect={() => selectPlayer(player.position, player)}
                  selected={alreadySelected}
                  disabled={alreadySelected || (positionFilled && !alreadySelected)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
