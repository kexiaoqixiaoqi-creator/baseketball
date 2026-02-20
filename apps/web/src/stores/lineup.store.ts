import { create } from 'zustand';
import { LINEUP_POSITIONS } from '@fantasy-nba/shared';

export interface PlayerSlot {
  id: number;
  name: string;
  nameCn?: string | null;
  team: string;
  position: string;
  cost: number;
}

type Selections = Record<string, PlayerSlot | null>;

interface LineupState {
  selections: Selections;
  salaryCap: number;
  totalCost: number;
  setSalaryCap: (cap: number) => void;
  selectPlayer: (position: string, player: PlayerSlot) => void;
  removePlayer: (position: string) => void;
  reset: () => void;
  populateFromLineup: (players: Record<string, { id: number; name: string; team: string; cost: number }>) => void;
  isComplete: () => boolean;
  isUnderCap: () => boolean;
  isValid: () => boolean;
}

const emptySelections = (): Selections =>
  Object.fromEntries(LINEUP_POSITIONS.map((p) => [p, null]));

export const useLineupStore = create<LineupState>()((set, get) => ({
  selections: emptySelections(),
  salaryCap: 50_000,
  totalCost: 0,

  setSalaryCap: (cap) => set({ salaryCap: cap }),

  selectPlayer: (position, player) =>
    set((state) => {
      const selections = { ...state.selections, [position]: player };
      const totalCost = Object.values(selections).reduce(
        (sum, p) => sum + (p?.cost ?? 0),
        0,
      );
      return { selections, totalCost };
    }),

  removePlayer: (position) =>
    set((state) => {
      const selections = { ...state.selections, [position]: null };
      const totalCost = Object.values(selections).reduce(
        (sum, p) => sum + (p?.cost ?? 0),
        0,
      );
      return { selections, totalCost };
    }),

  reset: () => set({ selections: emptySelections(), totalCost: 0 }),

  populateFromLineup: (players) =>
    set((state) => {
      const selections = { ...state.selections };
      let totalCost = 0;
      for (const pos of LINEUP_POSITIONS) {
        const p = players[pos];
        if (p) {
          selections[pos] = {
            id: p.id,
            name: p.name,
            team: p.team,
            position: pos,
            cost: p.cost,
          };
          totalCost += p.cost;
        }
      }
      return { selections, totalCost };
    }),

  isComplete: () => LINEUP_POSITIONS.every((pos) => get().selections[pos] !== null),

  isUnderCap: () => get().totalCost <= get().salaryCap,

  isValid: () => get().isComplete() && get().isUnderCap(),
}));
