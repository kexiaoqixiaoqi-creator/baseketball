import { Position } from '@fantasy-nba/shared';

const POSITION_MAP: Record<string, Position> = {
  '控球后卫': 'PG',
  '后卫': 'PG',
  '得分后卫': 'SG',
  '小前锋': 'SF',
  '前锋': 'SF',
  '大前锋': 'PF',
  '中锋': 'C',
};

export function parsePosition(chinesePosition: string): Position {
  return POSITION_MAP[chinesePosition?.trim()] ?? 'SF';
}

export function parseMinutes(minutesStr: string): number {
  if (!minutesStr) return 0;
  const [min] = minutesStr.split(':');
  return parseInt(min, 10) || 0;
}
