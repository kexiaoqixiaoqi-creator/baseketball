interface RankEntry {
  rank: number;
  username: string;
  totalScore: number;
  lineupId: number;
}

interface Props {
  rankings: RankEntry[];
  currentUserId?: number;
}

export function RankingsTable({ rankings }: Props) {
  if (!rankings.length) {
    return <p style={{ color: '#aaa', textAlign: 'center' }}>No rankings yet</p>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#16213e' }}>
          <th style={{ padding: '10px 16px', textAlign: 'left', color: '#aaa', fontSize: 13 }}>Rank</th>
          <th style={{ padding: '10px 16px', textAlign: 'left', color: '#aaa', fontSize: 13 }}>Player</th>
          <th style={{ padding: '10px 16px', textAlign: 'right', color: '#aaa', fontSize: 13 }}>Score</th>
        </tr>
      </thead>
      <tbody>
        {rankings.map((entry) => (
          <tr key={entry.lineupId} style={{ borderBottom: '1px solid #1a1a2e' }}>
            <td style={{ padding: '10px 16px', color: entry.rank <= 3 ? '#f39c12' : '#fff', fontWeight: entry.rank <= 3 ? 700 : 400 }}>
              {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
            </td>
            <td style={{ padding: '10px 16px', color: '#fff' }}>{entry.username}</td>
            <td style={{ padding: '10px 16px', textAlign: 'right', color: '#27ae60', fontWeight: 600 }}>
              {entry.totalScore.toFixed(1)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
