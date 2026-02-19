interface Player {
  id: number;
  name: string;
  position: string;
  team: string;
  cost: number;
  seasonStats?: {
    ppg: number;
    rpg: number;
    apg: number;
  };
}

interface Props {
  player: Player;
  onSelect?: (player: Player) => void;
  onRemove?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export function PlayerCard({ player, onSelect, onRemove, selected, disabled }: Props) {
  return (
    <div style={{
      background: selected ? '#0f3460' : '#16213e',
      border: `1px solid ${selected ? '#e94560' : '#1a1a2e'}`,
      borderRadius: 8,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
      opacity: disabled ? 0.5 : 1,
    }}>
      <div style={{ background: '#e94560', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700, minWidth: 28, textAlign: 'center' }}>
        {player.position}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#fff', fontWeight: 600 }}>{player.name}</div>
        <div style={{ color: '#aaa', fontSize: 13 }}>{player.team}</div>
        {player.seasonStats && (
          <div style={{ color: '#888', fontSize: 12 }}>
            {player.seasonStats.ppg}pt / {player.seasonStats.rpg}reb / {player.seasonStats.apg}ast
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ color: '#f39c12', fontWeight: 700, fontSize: 15 }}>${player.cost.toLocaleString()}</div>
        {onSelect && !selected && (
          <button
            onClick={() => onSelect(player)}
            disabled={disabled}
            style={{ marginTop: 4, background: '#e94560', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12 }}
          >
            Select
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            style={{ marginTop: 4, background: '#333', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
