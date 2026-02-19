import { Position } from '@fantasy-nba/shared';

/**
 * Maps Sina Sports Chinese position strings to our internal 5-position enum.
 * Generic positions (后卫, 前锋) fall back to the dominant fantasy position.
 */
const POSITION_MAP: Record<string, Position> = {
  '控球后卫': 'PG',
  '后卫':     'PG', // generic guard — default to PG
  '得分后卫': 'SG',
  '小前锋':   'SF',
  '前锋':     'SF', // generic forward — default to SF
  '大前锋':   'PF',
  '中锋':     'C',
};

export function parsePosition(chinesePosition: string): Position {
  return POSITION_MAP[chinesePosition?.trim()] ?? 'SF';
}

/** Parse a Sina minutes string like '35:00' to a plain integer. */
export function parseMinutes(minutesStr: string): number {
  if (!minutesStr) return 0;
  const [min] = minutesStr.split(':');
  return parseInt(min, 10) || 0;
}
