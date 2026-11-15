import { AppStorageState, MatchHistoryItem, PlayerId, PlayerProgress, WorldData, WorldId } from './types';

const STORAGE_KEY = 'razmik_gayane_habla_y_gana_v1';

export function createInitialPlayer(id: PlayerId, name: string): PlayerProgress {
  return {
    id,
    name,
    points: 0,
    wins: 0,
    correctAnswers: 0,
    errors: 0,
    streak: 0,
    bestStreak: 0,
    learnedWords: [],
    hardWords: [],
    completedLessons: [],
    completedMissions: [],
    bestTimes: {},
    medals: [],
    dailyCompletedDates: [],
  };
}

export function createDefaultStorageState(): AppStorageState {
  return {
    version: 1,
    razmik: createInitialPlayer('razmik', 'Razmik'),
    gayane: createInitialPlayer('gayane', 'Gayane'),
    history: [],
    lastWorld: 'aeropuerto',
    lastSection: 'home',
    teacherConfig: {
      selectedWorld: 'todos',
      selectedGame: 'responde_rapido',
      roundsCount: 6,
      timerSeconds: 30,
      difficulty: 1,
      timerMode: 'contrarreloj',
    },
  };
}

export function loadProgress(): AppStorageState {
  if (typeof window === 'undefined') return createDefaultStorageState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultStorageState();
    const parsed = JSON.parse(raw) as Partial<AppStorageState>;
    const defaults = createDefaultStorageState();
    return {
      ...defaults,
      ...parsed,
      razmik: { ...defaults.razmik, ...(parsed.razmik || {}) },
      gayane: { ...defaults.gayane, ...(parsed.gayane || {}) },
      history: Array.isArray(parsed.history) ? parsed.history : [],
      teacherConfig: { ...defaults.teacherConfig, ...(parsed.teacherConfig || {}) },
    };
  } catch {
    return createDefaultStorageState();
  }
}

export function saveProgress(state: AppStorageState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage quota ignored gracefully
  }
}

export function evaluateMedals(player: PlayerProgress): string[] {
  const medals = new Set(player.medals);
  if (player.wins >= 1) medals.add('primera_victoria');
  if (player.learnedWords.length >= 25) medals.add('maestro_palabras');
  if (player.points >= 100) medals.add('gran_orador');
  if (player.correctAnswers >= 10) medals.add('oido_fino');
  if (player.completedMissions.length >= 4) medals.add('viajero_experto');
  if (player.bestStreak >= 5) medals.add('racha_oro');
  return Array.from(medals);
}

export function getAchievementLevel(points: number): { level: number; titleEs: string; titleHy: string; nextPoints: number } {
  if (points < 50) return { level: 1, titleEs: 'Explorador Novato', titleHy: 'Սկսնակ հետազոտող', nextPoints: 50 };
  if (points < 150) return { level: 2, titleEs: 'Viajero Curioso', titleHy: 'Հետաքրքրասեր ճանապարհորդ', nextPoints: 150 };
  if (points < 300) return { level: 3, titleEs: 'Hablante Seguro', titleHy: 'Վստահ խոսող', nextPoints: 300 };
  if (points < 500) return { level: 4, titleEs: 'Campeón Bilingüe', titleHy: 'Երկլեզու չեմպիոն', nextPoints: 500 };
  return { level: 5, titleEs: 'Leyenda del Español', titleHy: 'Իսպաներենի լեգենդ', nextPoints: 1000 };
}

export function getWorldCompletionPercent(
  world: WorldData,
  razmik: PlayerProgress,
  gayane: PlayerProgress
): number {
  const vocabTotal = world.vocab.length;
  const lessonsTotal = world.grammar.length + 2; // grammar + expressions + dialogues
  const totalUnits = vocabTotal + lessonsTotal + 1; // +1 for world mission

  const uniqueWords = new Set([
    ...razmik.learnedWords.filter((id) => world.vocab.some((v) => v.id === id)),
    ...gayane.learnedWords.filter((id) => world.vocab.some((v) => v.id === id)),
  ]);
  const uniqueLessons = new Set([
    ...razmik.completedLessons.filter((id) => id.startsWith(world.id)),
    ...gayane.completedLessons.filter((id) => id.startsWith(world.id)),
  ]);
  const missionDone =
    razmik.completedMissions.includes(world.id) || gayane.completedMissions.includes(world.id) ? 1 : 0;

  const done = uniqueWords.size + uniqueLessons.size + missionDone;
  return Math.min(100, Math.round((done / totalUnits) * 100));
}

export function recordMatchResult(
  state: AppStorageState,
  entry: Omit<MatchHistoryItem, 'id' | 'dateIso'>
): AppStorageState {
  const newItem: MatchHistoryItem = {
    ...entry,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    dateIso: new Date().toISOString(),
  };

  const nextRazmik: PlayerProgress = {
    ...state.razmik,
    points: state.razmik.points + entry.razmikScore,
    wins: state.razmik.wins + (entry.winner === 'razmik' ? 1 : 0),
  };
  const nextGayane: PlayerProgress = {
    ...state.gayane,
    points: state.gayane.points + entry.gayaneScore,
    wins: state.gayane.wins + (entry.winner === 'gayane' ? 1 : 0),
  };

  if (entry.razmikTimeSec > 0) {
    const prevBest = nextRazmik.bestTimes[entry.gameId];
    if (!prevBest || entry.razmikTimeSec < prevBest) {
      nextRazmik.bestTimes = { ...nextRazmik.bestTimes, [entry.gameId]: entry.razmikTimeSec };
    }
  }
  if (entry.gayaneTimeSec > 0) {
    const prevBest = nextGayane.bestTimes[entry.gameId];
    if (!prevBest || entry.gayaneTimeSec < prevBest) {
      nextGayane.bestTimes = { ...nextGayane.bestTimes, [entry.gameId]: entry.gayaneTimeSec };
    }
  }

  nextRazmik.medals = evaluateMedals(nextRazmik);
  nextGayane.medals = evaluateMedals(nextGayane);

  const nextState: AppStorageState = {
    ...state,
    razmik: nextRazmik,
    gayane: nextGayane,
    history: [newItem, ...state.history].slice(0, 60),
  };
  saveProgress(nextState);
  return nextState;
}

export function exportProgressJson(state: AppStorageState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `razmik-gayane-espanol-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const WORLD_ORDER: WorldId[] = ['aeropuerto', 'hotel', 'restaurante', 'supermercado'];
