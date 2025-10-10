
export type StatKey = 
  | 'FGM' | 'FGA' | 'TPM' | 'TPA' | 'FTM' | 'FTA'
  | 'OREB' | 'DREB' | 'AST' | 'STL' | 'BLK' | 'TOV' | 'PF';

export interface Stats {
  FGM: number;
  FGA: number;
  TPM: number;
  TPA: number;
  FTM: number;
  FTA: number;
  OREB: number;
  DREB: number;
  AST: number;
  STL: number;
  BLK: number;
  TOV: number;
  PF: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  actionText: string;
  statChanges: Partial<Stats>;
}

export interface Player {
  id: string;
  name: string;
  photo: string | null;
}

export interface Game {
  id: string;
  stats: Stats;
  log: LogEntry[];
  opposition: string;
  gameDate: string;
  summary: string;
}
