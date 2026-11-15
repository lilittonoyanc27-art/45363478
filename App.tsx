import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  BookOpen,
  Trophy,
  Mic,
  Headphones,
  Users,
  BarChart3,
  Play,
  Sparkles,
  Volume2,
  Gamepad2,
  RotateCcw,
  Layers,
  AlertTriangle,
  Clock,
  LogOut,
  Loader2,
} from 'lucide-react';
import { ALL_WORLDS, WORLDS_MAP } from './dataGames';
import { speakEs } from './audio';
import {
  createDefaultStorageState,
  createInitialPlayer,
  evaluateMedals,
  getAchievementLevel,
  getTodayKey,
  getWorldCompletionPercent,
  loadProgress,
  recordMatchResult,
  saveProgress,
} from './storage';
import {
  AppStorageState,
  ASSETS,
  CloudAnswerSummary,
  CloudGameSession,
  CloudVoiceRecording,
  DifficultyLevel,
  GAME_CATALOG,
  GameId,
  LeaderboardEntry,
  MatchHistoryItem,
  PlayerId,
  TeacherConfig,
  UserProfileDoc,
  WorldId,
} from './types';
import {
  createGameSessionInCloud,
  fetchUserProfile,
  resetStudentCloudData,
  saveStudentProgressToCloud,
  signOutUser,
  subscribeAuth,
  subscribeGameSessions,
  subscribeLeaderboard,
  subscribeStudentProgress,
  subscribeVoiceRecordings,
  submitGameSessionToTeacher,
  updateLeaderboardInCloud,
} from './firebaseClient';
import { OralEvaluator, SpPhrase } from './ClickSpanish';
import { WorldScene } from './WorldScene';
import { TheorySection } from './TheorySection';
import { GameArena } from './GameArena';
import { GamesExtra } from './GamesExtra';
import { Reto30Arena } from './Reto30Arena';
import { StatsAndResults } from './StatsAndResults';
import { TeacherPanel } from './TeacherPanel';
import { ProfileGate } from './ProfileGate';

type TopView = 'home' | 'world' | 'games' | 'playing' | 'results' | 'teacher';

const GAMES_GROUP_1: GameId[] = [
  'responde_rapido',
  'cambio_papeles',
  'dialogo_loco',
  'escucha_gana',
  'encuentra_error',
  'compra_inteligente',
  'camarero_dia',
  'no_pierdas_avion',
];

export default function App() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileDoc | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [storage, setStorage] = useState<AppStorageState>(() => loadProgress());
  const storageRef = useRef<AppStorageState>(storage);
  storageRef.current = storage;

  const [leaderboard, setLeaderboard] = useState<Record<PlayerId, LeaderboardEntry | null>>({
    razmik: null,
    gayane: null,
  });
  const [cloudSessions, setCloudSessions] = useState<CloudGameSession[]>([]);
  const [cloudRecordings, setCloudRecordings] = useState<CloudVoiceRecording[]>([]);
  const [cloudStatsMap, setCloudStatsMap] = useState<Record<PlayerId, { totalTimeSec: number; gamesCompleted: number }>>({
    razmik: { totalTimeSec: 0, gamesCompleted: 0 },
    gayane: { totalTimeSec: 0, gamesCompleted: 0 },
  });
  const cloudStatsRef = useRef(cloudStatsMap);
  cloudStatsRef.current = cloudStatsMap;

  const [view, setView] = useState<TopView>('home');
  const [activeWorldId, setActiveWorldId] = useState<WorldId>(storage.lastWorld || 'aeropuerto');
  const [worldTab, setWorldTab] = useState<'explorar' | 'teoria' | 'juegos'>('explorar');
  const [theoryStudent, setTheoryStudent] = useState<PlayerId>('razmik');
  const [gameCategory, setGameCategory] = useState<'todos' | 'competir' | 'hablar' | 'escuchar' | 'juntos'>('todos');
  const [activeGameId, setActiveGameId] = useState<GameId>('responde_rapido');
  const [gameWorldFilter, setGameWorldFilter] = useState<WorldId | 'todos'>('todos');
  const [gameDifficulty, setGameDifficulty] = useState<DifficultyLevel>(storage.teacherConfig.difficulty || 1);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [dailyStudent, setDailyStudent] = useState<PlayerId>('razmik');
  const [confirmGlobalReset, setConfirmGlobalReset] = useState(false);
  const [resettingCloud, setResettingCloud] = useState(false);

  useEffect(() => {
    saveProgress(storage);
  }, [storage]);

  // Auth listener
  useEffect(() => {
    const unsub = subscribeAuth(async (user) => {
      setAuthUser(user);
      if (!user) {
        setUserProfile(null);
        setAuthReady(true);
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      try {
        const profile = await fetchUserProfile(user.uid);
        setUserProfile(profile);
        if (profile && (profile.role === 'razmik' || profile.role === 'gayane')) {
          setTheoryStudent(profile.role);
          setDailyStudent(profile.role);
        }
      } catch {
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  // Cloud subscriptions after authenticated + profile claimed
  useEffect(() => {
    if (!authUser || !userProfile) return;

    const unsubs: (() => void)[] = [];
    unsubs.push(subscribeLeaderboard(setLeaderboard));
    unsubs.push(subscribeGameSessions(userProfile.role, authUser.uid, setCloudSessions));
    unsubs.push(subscribeVoiceRecordings(userProfile.role, authUser.uid, setCloudRecordings));

    const bindStudentProgress = (sid: PlayerId) => {
      unsubs.push(
        subscribeStudentProgress(sid, (remote) => {
          if (!remote) return;
          const { totalTimeSec = 0, gamesCompleted = 0, lastWorld, ...playerData } = remote;
          setCloudStatsMap((prev) => ({
            ...prev,
            [sid]: { totalTimeSec, gamesCompleted },
          }));
          setStorage((prev) => ({
            ...prev,
            [sid]: playerData,
            lastWorld: lastWorld || prev.lastWorld,
          }));
        })
      );
    };

    if (userProfile.role === 'profesor') {
      bindStudentProgress('razmik');
      bindStudentProgress('gayane');
    } else {
      bindStudentProgress(userProfile.role);
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [authUser, userProfile?.uid, userProfile?.role]);

  // Prevent non-teachers from staying on teacher view
  useEffect(() => {
    if (view === 'teacher' && userProfile?.role !== 'profesor') {
      setView('home');
    }
  }, [view, userProfile?.role]);

  const activeWorld = WORLDS_MAP[activeWorldId];
  const todayKey = getTodayKey();

  const syncPlayerToCloud = useCallback(
    async (
      nextStorage: AppStorageState,
      studentId: PlayerId,
      deltaDurationSec = 0,
      deltaGamesCompleted = 0,
      lastSectionOverride?: string
    ) => {
      if (!authUser || !userProfile) return;
      // Students only write their own progress/leaderboard docs
      if (userProfile.role !== 'profesor' && userProfile.role !== studentId) return;

      const p = nextStorage[studentId];
      const prevMeta = cloudStatsRef.current[studentId] || { totalTimeSec: 0, gamesCompleted: 0 };
      const nextTotalTime = prevMeta.totalTimeSec + deltaDurationSec;
      const nextGamesCompleted = Math.max(prevMeta.gamesCompleted + deltaGamesCompleted, p.wins);

      setCloudStatsMap((prev) => ({
        ...prev,
        [studentId]: { totalTimeSec: nextTotalTime, gamesCompleted: nextGamesCompleted },
      }));

      const totalQ = p.correctAnswers + p.errors;
      const avgAccuracyPercent = totalQ > 0 ? Math.round((p.correctAnswers / totalQ) * 100) : 0;
      const bestTimesVals = Object.values(p.bestTimes || {}).filter((v) => typeof v === 'number' && v > 0);
      const bestTimeSec = bestTimesVals.length > 0 ? Math.min(...bestTimesVals) : 0;

      try {
        await saveStudentProgressToCloud(studentId, p, {
          totalTimeSec: nextTotalTime,
          gamesCompleted: nextGamesCompleted,
          lastWorld: nextStorage.lastWorld,
          lastSection: lastSectionOverride || nextStorage.lastSection,
        });
        await updateLeaderboardInCloud({
          studentId,
          name: p.name,
          gamesCompleted: nextGamesCompleted,
          correctAnswers: p.correctAnswers,
          totalQuestions: totalQ,
          avgAccuracyPercent,
          bestTimeSec,
          totalPoints: p.points,
          wins: p.wins,
        });
      } catch (err) {
        console.error('Error syncing student progress to cloud:', err);
      }
    },
    [authUser, userProfile]
  );

  // Pick deterministic daily speaking challenge
  const dailyPrompt = useMemo(() => {
    const allSpeaking = ALL_WORLDS.flatMap((w) => w.speakingPrompts);
    const dayNum = Number(todayKey.replace(/-/g, '')) || 1;
    return allSpeaking[dayNum % allSpeaking.length];
  }, [todayKey]);

  const openWorld = (wId: WorldId, tab: 'explorar' | 'teoria' | 'juegos' = 'explorar') => {
    setActiveWorldId(wId);
    setWorldTab(tab);
    setView('world');
    setStorage((prev) => ({ ...prev, lastWorld: wId, lastSection: tab }));
  };

  const launchGame = (
    gId: GameId,
    wFilter: WorldId | 'todos' = gameWorldFilter,
    diff: DifficultyLevel = gameDifficulty
  ) => {
    setActiveGameId(gId);
    setGameWorldFilter(wFilter);
    setGameDifficulty(diff);
    setView('playing');
  };

  const handleToggleLearnedWord = (player: PlayerId, wordId: string) => {
    const target: PlayerId = userProfile?.role === 'razmik' || userProfile?.role === 'gayane' ? userProfile.role : player;
    const prev = storageRef.current;
    const p = prev[target];
    const exists = p.learnedWords.includes(wordId);
    const learnedWords = exists ? p.learnedWords.filter((id) => id !== wordId) : [...p.learnedWords, wordId];
    const points = exists ? p.points : p.points + 2;
    const updated = { ...p, learnedWords, points };
    updated.medals = evaluateMedals(updated);
    const nextStorage = { ...prev, [target]: updated };
    setStorage(nextStorage);
    void syncPlayerToCloud(nextStorage, target);
  };

  const handleToggleHardWord = (player: PlayerId, wordId: string) => {
    const target: PlayerId = userProfile?.role === 'razmik' || userProfile?.role === 'gayane' ? userProfile.role : player;
    const prev = storageRef.current;
    const p = prev[target];
    const exists = p.hardWords.includes(wordId);
    const hardWords = exists ? p.hardWords.filter((id) => id !== wordId) : [...p.hardWords, wordId];
    const nextStorage = { ...prev, [target]: { ...p, hardWords } };
    setStorage(nextStorage);
    void syncPlayerToCloud(nextStorage, target);
  };

  const handleCompleteLesson = (player: PlayerId, lessonId: string) => {
    const target: PlayerId = userProfile?.role === 'razmik' || userProfile?.role === 'gayane' ? userProfile.role : player;
    const prev = storageRef.current;
    const p = prev[target];
    if (p.completedLessons.includes(lessonId)) return;
    const updated = {
      ...p,
      completedLessons: [...p.completedLessons, lessonId],
      points: p.points + 5,
    };
    updated.medals = evaluateMedals(updated);
    const nextStorage = { ...prev, [target]: updated };
    setStorage(nextStorage);
    void syncPlayerToCloud(nextStorage, target);
  };

  const handleRecordAnswer = (player: PlayerId, correct: boolean, worldId?: WorldId) => {
    const target: PlayerId = userProfile?.role === 'razmik' || userProfile?.role === 'gayane' ? userProfile.role : player;
    const prev = storageRef.current;
    const p = prev[target];
    const streak = correct ? p.streak + 1 : 0;
    const bestStreak = Math.max(p.bestStreak, streak);
    const completedMissions =
      worldId && correct && !p.completedMissions.includes(worldId)
        ? [...p.completedMissions, worldId]
        : p.completedMissions;
    const updated = {
      ...p,
      correctAnswers: p.correctAnswers + (correct ? 1 : 0),
      errors: p.errors + (correct ? 0 : 1),
      streak,
      bestStreak,
      completedMissions,
    };
    updated.medals = evaluateMedals(updated);
    const nextStorage = { ...prev, [target]: updated };
    setStorage(nextStorage);
    void syncPlayerToCloud(nextStorage, target);
  };

  const handleFinishMatch = async (
    result: Omit<MatchHistoryItem, 'id' | 'dateIso'>,
    sessionMeta?: {
      totalQuestions: number;
      correctCount: number;
      incorrectCount: number;
      durationSec: number;
      answersSummary: CloudAnswerSummary[];
    }
  ): Promise<string | null> => {
    const nextStorage = recordMatchResult(storageRef.current, result);
    setStorage(nextStorage);

    if (!authUser || !userProfile) return null;

    const targetStudentId: PlayerId =
      userProfile.role === 'razmik' || userProfile.role === 'gayane'
        ? userProfile.role
        : result.winner === 'gayane'
          ? 'gayane'
          : 'razmik';

    const durationSec =
      sessionMeta?.durationSec ??
      (targetStudentId === 'gayane' ? result.gayaneTimeSec : result.razmikTimeSec) ??
      0;

    await syncPlayerToCloud(nextStorage, targetStudentId, durationSec, 1, 'games');

    const score = targetStudentId === 'gayane' ? result.gayaneScore : result.razmikScore;
    const fallbackTotal = Math.max(1, (sessionMeta?.correctCount || 0) + (sessionMeta?.incorrectCount || 0));
    try {
      const sessionId = await createGameSessionInCloud({
        studentId: targetStudentId,
        gameId: result.gameId,
        gameTitleEs: result.gameTitleEs,
        world: result.world,
        totalQuestions: sessionMeta?.totalQuestions ?? fallbackTotal,
        correctCount: sessionMeta?.correctCount ?? (score > 0 ? 1 : 0),
        incorrectCount: sessionMeta?.incorrectCount ?? 0,
        score,
        durationSec,
        answersSummary: sessionMeta?.answersSummary || [],
        submittedToTeacher: false,
      });
      return sessionId;
    } catch (err) {
      console.error('Error creating game session in cloud:', err);
      return null;
    }
  };

  const handleManualBonus = (player: PlayerId, points: number) => {
    const prev = storageRef.current;
    const p = prev[player];
    const updated = { ...p, points: Math.max(0, p.points + points) };
    updated.medals = evaluateMedals(updated);
    const nextStorage = { ...prev, [player]: updated };
    setStorage(nextStorage);
    void syncPlayerToCloud(nextStorage, player);
  };

  const handleGlobalReset = async () => {
    setResettingCloud(true);
    try {
      if (userProfile?.role === 'profesor') {
        await resetStudentCloudData('razmik', createInitialPlayer('razmik', 'Razmik'), true);
        await resetStudentCloudData('gayane', createInitialPlayer('gayane', 'Gayane'), true);
        setStorage(createDefaultStorageState());
      } else if (userProfile?.role === 'razmik' || userProfile?.role === 'gayane') {
        const sid = userProfile.role;
        const fresh = createInitialPlayer(sid, sid === 'razmik' ? 'Razmik' : 'Gayane');
        await resetStudentCloudData(sid, fresh, false);
        setStorage((prev) => ({
          ...prev,
          [sid]: fresh,
          history: [],
        }));
      } else {
        setStorage(createDefaultStorageState());
      }
      setConfirmGlobalReset(false);
    } catch (err) {
      console.error('Error resetting app data:', err);
    } finally {
      setResettingCloud(false);
    }
  };

  const filteredGames = useMemo(
    () =>
      gameCategory === 'todos'
        ? GAME_CATALOG
        : GAME_CATALOG.filter((g) => g.category === gameCategory),
    [gameCategory]
  );

  // Loading auth screen
  if (!authReady || profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 p-6 text-slate-700">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <div className="font-display text-lg font-bold text-slate-900">RAZMIK Y GAYANE — ¡HABLA Y GANA!</div>
        <div className="text-xs text-slate-500">Conectando tu perfil en la nube...</div>
      </div>
    );
  }

  // First-time or signed-out Profile Selector Gate
  if (!authUser || !userProfile) {
    return (
      <ProfileGate
        authUser={authUser}
        onProfileReady={(profile) => {
          setUserProfile(profile);
          if (profile.role === 'razmik' || profile.role === 'gayane') {
            setTheoryStudent(profile.role);
            setDailyStudent(profile.role);
          }
          setView(profile.role === 'profesor' ? 'teacher' : 'home');
        }}
      />
    );
  }

  const activeStudentRole: PlayerId = userProfile.role === 'gayane' ? 'gayane' : 'razmik';
  const isStudent = userProfile.role === 'razmik' || userProfile.role === 'gayane';

  // Display points/wins from cloud leaderboard if available so both kids see shared live duel
  const razmikPoints = leaderboard.razmik?.totalPoints ?? storage.razmik.points;
  const razmikWins = leaderboard.razmik?.wins ?? storage.razmik.wins;
  const gayanePoints = leaderboard.gayane?.totalPoints ?? storage.gayane.points;
  const gayaneWins = leaderboard.gayane?.wins ?? storage.gayane.wins;

  const razmikLvl = getAchievementLevel(razmikPoints);
  const gayaneLvl = getAchievementLevel(gayanePoints);

  const navItems: { id: TopView; label: string }[] = [
    { id: 'home', label: 'Inicio' },
    { id: 'world', label: 'Mundos' },
    { id: 'games', label: '18 Juegos' },
    { id: 'results', label: 'Resultados' },
    ...(userProfile.role === 'profesor' ? [{ id: 'teacher' as TopView, label: 'Profesor' }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 3-ZONE TOP BAR */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => setView('home')}
            className="font-display text-base sm:text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            RAZMIK Y GAYANE
          </button>

          {/* Zone 2: Concise single-line links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => (item.id === 'world' ? openWorld(activeWorldId, 'explorar') : setView(item.id))}
                className={`whitespace-nowrap shrink-0 hover:text-slate-900 cursor-pointer ${
                  view === item.id || (item.id === 'games' && view === 'playing')
                    ? 'text-blue-600 underline underline-offset-8'
                    : ''
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Active profile + Global Reset + Sign Out */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap ${
                userProfile.role === 'razmik'
                  ? 'bg-blue-100 text-blue-900'
                  : userProfile.role === 'gayane'
                    ? 'bg-pink-100 text-pink-900'
                    : 'bg-slate-900 text-amber-300'
              }`}
            >
              {userProfile.role === 'razmik'
                ? '👦 Razmik'
                : userProfile.role === 'gayane'
                  ? '👧 Gayane'
                  : '👩‍🏫 Profesor'}
            </span>

            <button
              type="button"
              onClick={() => setConfirmGlobalReset((v) => !v)}
              title="Reiniciar aplicación"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reiniciar aplicación</span>
            </button>

            <button
              type="button"
              onClick={() => void signOutUser()}
              title="Cerrar sesión"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Row */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto px-4 pb-2.5 text-xs font-semibold">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => (item.id === 'world' ? openWorld(activeWorldId, 'explorar') : setView(item.id))}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
                view === item.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* GLOBAL RESET CONFIRMATION BANNER */}
      {confirmGlobalReset && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4">
          <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-red-950 font-semibold">
                {userProfile.role === 'profesor'
                  ? '¿Seguro que quieres reiniciar todo el progreso, sesiones y grabaciones de Razmik y Gayane en la nube?'
                  : `¿Seguro que quieres reiniciar tu progreso, puntos y partidas guardadas de ${userProfile.displayName}?`}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                disabled={resettingCloud}
                onClick={() => setConfirmGlobalReset(false)}
                className="px-4 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={resettingCloud}
                onClick={() => void handleGlobalReset()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-red-600 text-white hover:bg-red-700 rounded-xl cursor-pointer disabled:opacity-60"
              >
                {resettingCloud && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Sí, reiniciar aplicación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* ================================================================ */}
        {/* HOME VIEW */}
        {/* ================================================================ */}
        {view === 'home' && (
          <div className="space-y-10">
            {/* Hero Title & Characters Showcase */}
            <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-8">
              <div className="text-center space-y-2 max-w-3xl mx-auto">
                <div className="text-xs font-semibold text-slate-500">
                  ¡HABLA Y GANA! 🇪🇸 · Español A1–A2/B1 · Traducción al armenio con un clic
                </div>
                <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight text-balance">
                  RAZMIK 🔵 GAYANE 🩷
                </h1>
                <p className="text-lg text-slate-600">
                  <SpPhrase
                    es="¡Dos jugadores, cuatro aventuras y un gran desafío!"
                    hy="Երկու խաղացող, չորս արկած և մեկ մեծ մարտահրավեր:"
                  />
                </p>
              </div>

              {/* 3-Column Character + Trophy Showdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* RAZMIK CARD */}
                <div className="lg:col-span-5 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-orange-50/70 p-5 flex items-center gap-5">
                  <img
                    src={ASSETS.razmikAvatar}
                    alt="Razmik"
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-blue-500 shrink-0"
                  />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display text-2xl font-extrabold text-blue-900">RAZMIK 🔵</h2>
                      <span className="font-mono-num text-2xl font-extrabold text-orange-600">
                        {razmikPoints} pts
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-600">
                      Nivel {razmikLvl.level}: {razmikLvl.titleEs}
                    </div>
                    <div className="text-xs text-slate-500 font-mono-num">
                      Victorias: {razmikWins} · Juegos: {leaderboard.razmik?.gamesCompleted ?? 0} · Precisión:{' '}
                      {leaderboard.razmik?.avgAccuracyPercent ?? 0}%
                    </div>
                    <div className="h-2 rounded-full bg-blue-100 overflow-hidden mt-2">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-orange-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((razmikPoints / razmikLvl.nextPoints) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* CENTRAL TROPHY CUP */}
                <div className="lg:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 flex flex-col items-center justify-center text-center gap-2">
                  <Trophy className="w-12 h-12 text-amber-500" />
                  <div className="text-xs font-bold text-amber-900">Marcador Global</div>
                  <div className="font-mono-num text-xl font-extrabold text-slate-900">
                    {razmikWins} — {gayaneWins}
                  </div>
                  <div className="text-xs text-slate-600">
                    {razmikPoints > gayanePoints
                      ? 'Lidera Razmik'
                      : gayanePoints > razmikPoints
                        ? 'Lidera Gayane'
                        : '¡Igualados!'}
                  </div>
                </div>

                {/* GAYANE CARD */}
                <div className="lg:col-span-5 rounded-2xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 via-white to-violet-50/70 p-5 flex items-center gap-5">
                  <img
                    src={ASSETS.gayaneAvatar}
                    alt="Gayane"
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-pink-500 shrink-0"
                  />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display text-2xl font-extrabold text-pink-900">GAYANE 🩷</h2>
                      <span className="font-mono-num text-2xl font-extrabold text-violet-600">
                        {gayanePoints} pts
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-600">
                      Nivel {gayaneLvl.level}: {gayaneLvl.titleEs}
                    </div>
                    <div className="text-xs text-slate-500 font-mono-num">
                      Victorias: {gayaneWins} · Juegos: {leaderboard.gayane?.gamesCompleted ?? 0} · Precisión:{' '}
                      {leaderboard.gayane?.avgAccuracyPercent ?? 0}%
                    </div>
                    <div className="h-2 rounded-full bg-pink-100 overflow-hidden mt-2">
                      <div
                        className="h-full bg-gradient-to-r from-pink-600 to-violet-600 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((gayanePoints / gayaneLvl.nextPoints) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => openWorld(activeWorldId, 'teoria')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  APRENDER
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGameCategory('juntos');
                    setView('games');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  JUGAR JUNTOS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGameCategory('competir');
                    setView('games');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl cursor-pointer"
                >
                  <Trophy className="w-4 h-4" />
                  COMPETIR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGameCategory('hablar');
                    setView('games');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold bg-pink-600 text-white hover:bg-pink-700 rounded-xl cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  HABLAR
                </button>
                <button
                  type="button"
                  onClick={() => launchGame('escucha_gana', 'todos')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold bg-violet-600 text-white hover:bg-violet-700 rounded-xl cursor-pointer"
                >
                  <Headphones className="w-4 h-4" />
                  ESCUCHAR
                </button>
                <button
                  type="button"
                  onClick={() => launchGame('roba_carta', 'todos')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl cursor-pointer shadow-sm"
                >
                  <Layers className="w-4 h-4" />
                  ROBA LA CARTA (30 · 2m) 🃏
                </button>
                <button
                  type="button"
                  onClick={() => launchGame('reto_30', 'todos')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-xl cursor-pointer shadow-sm"
                >
                  <Clock className="w-4 h-4" />
                  RETO DE 30 PREGUNTAS (2 min)
                </button>
                <button
                  type="button"
                  onClick={() => setView('results')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4" />
                  VER RESULTADOS
                </button>
                <button
                  type="button"
                  onClick={() => openWorld(storage.lastWorld || 'aeropuerto', 'explorar')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold bg-orange-600 text-white hover:bg-orange-700 rounded-xl cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  CONTINUAR AVENTURA
                </button>
              </div>
            </section>

            {/* FOUR INTERACTIVE WORLDS */}
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
                    Cuatro mundos de aventura
                  </h2>
                  <p className="text-sm text-slate-600">
                    Elige una ciudad o lugar para explorar la escena, estudiar la teoría en armenio y jugar.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {ALL_WORLDS.map((w) => {
                  const pct = getWorldCompletionPercent(w, storage.razmik, storage.gayane);
                  return (
                    <div
                      key={w.id}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-400 transition-colors"
                    >
                      <div>
                        <div className="aspect-video bg-slate-100 relative overflow-hidden">
                          <img
                            src={w.image}
                            alt={w.nameEs}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="text-xs font-semibold text-slate-500">
                            {w.vocab.length} palabras · {w.expressions.length} expresiones · {pct}% completado
                          </div>
                          <h3 className="font-display text-xl font-extrabold text-slate-900">
                            {w.icon} {w.nameEs.toUpperCase()}
                          </h3>
                          <p className="text-xs text-slate-600">{w.subtitleEs}</p>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden pt-0">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: w.accentColor }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => openWorld(w.id, 'explorar')}
                          className="py-2 px-3 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl cursor-pointer"
                        >
                          Explorar
                        </button>
                        <button
                          type="button"
                          onClick={() => openWorld(w.id, 'teoria')}
                          className="py-2 px-3 text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl cursor-pointer"
                        >
                          Teoría
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* DAILY SPEAKING MISSION */}
            {dailyPrompt && (
              <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Reto diario de conversación ({todayKey})
                    </div>
                    <h2 className="font-display text-xl font-bold text-slate-900 mt-1">
                      <SpPhrase es={dailyPrompt.promptEs} hy={dailyPrompt.promptHy} />
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => speakEs(dailyPrompt.promptEs)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      Escuchar reto
                    </button>
                    <button
                      type="button"
                      onClick={() => setDailyOpen((o) => !o)}
                      className="px-4 py-2 text-sm font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-xl cursor-pointer"
                    >
                      {dailyOpen ? 'Cerrar reto' : 'Aceptar reto (+15 pts)'}
                    </button>
                  </div>
                </div>

                {dailyOpen && (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    {!isStudent ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDailyStudent('razmik')}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                            dailyStudent === 'razmik' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Razmik 🔵 {storage.razmik.dailyCompletedDates.includes(todayKey) ? '✓' : ''}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDailyStudent('gayane')}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                            dailyStudent === 'gayane' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Gayane 🩷 {storage.gayane.dailyCompletedDates.includes(todayKey) ? '✓' : ''}
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-slate-600">
                        Alumno activo: {activeStudentRole === 'razmik' ? 'Razmik 🔵' : 'Gayane 🩷'}
                      </div>
                    )}

                    <OralEvaluator
                      playerLabel={
                        (isStudent ? activeStudentRole : dailyStudent) === 'razmik' ? 'Razmik 🔵' : 'Gayane 🩷'
                      }
                      helperWords={dailyPrompt.helperWords}
                      sampleAnswerEs={dailyPrompt.sampleEs}
                      studentId={isStudent ? activeStudentRole : dailyStudent}
                      worldId={dailyPrompt.world}
                      gameId="reto_diario"
                      questionEs={dailyPrompt.promptEs}
                      parentalConsentGranted={userProfile.parentalConsentGranted}
                      onParentalConsentGranted={() =>
                        setUserProfile((prev) => (prev ? { ...prev, parentalConsentGranted: true } : prev))
                      }
                      onAwardPoints={(pts) => {
                        const targetSid = isStudent ? activeStudentRole : dailyStudent;
                        const prev = storageRef.current;
                        const p = prev[targetSid];
                        const dates = p.dailyCompletedDates.includes(todayKey)
                          ? p.dailyCompletedDates
                          : [...p.dailyCompletedDates, todayKey];
                        const updated = { ...p, points: p.points + pts, dailyCompletedDates: dates };
                        updated.medals = evaluateMedals(updated);
                        const nextStorage = { ...prev, [targetSid]: updated };
                        setStorage(nextStorage);
                        void syncPlayerToCloud(nextStorage, targetSid);
                      }}
                    />
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* WORLD VIEW (EXPLORE + THEORY + WORLD GAMES) */}
        {/* ================================================================ */}
        {view === 'world' && (
          <div className="space-y-6">
            {/* World Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              {ALL_WORLDS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => openWorld(w.id, worldTab)}
                  className={`px-4 py-2 text-sm font-bold rounded-xl border transition-colors cursor-pointer ${
                    activeWorldId === w.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {w.icon} {w.nameEs}
                </button>
              ))}
            </div>

            <WorldScene
              world={activeWorld}
              completionPercent={getWorldCompletionPercent(activeWorld, storage.razmik, storage.gayane)}
              activeTab={worldTab}
              onChangeTab={(t) => setWorldTab(t)}
              onQuickAction={(mode) => {
                if (mode === 'escuchar') launchGame('escucha_gana', activeWorldId);
                else if (mode === 'hablar') launchGame('cambio_papeles', activeWorldId);
                else if (mode === 'reto_30') launchGame('reto_30', activeWorldId);
                else launchGame('responde_rapido', activeWorldId);
              }}
            />

            {worldTab === 'teoria' && (
              <TheorySection
                world={activeWorld}
                activeStudent={isStudent ? activeStudentRole : theoryStudent}
                onChangeStudent={(sid) => {
                  if (!isStudent) setTheoryStudent(sid);
                }}
                studentProgress={storage[isStudent ? activeStudentRole : theoryStudent]}
                onToggleLearnedWord={handleToggleLearnedWord}
                onToggleHardWord={handleToggleHardWord}
                onCompleteLesson={handleCompleteLesson}
              />
            )}

            {worldTab === 'juegos' && (
              <div className="space-y-6">
                {/* Featured 30-question 2-minute challenge banner for this world */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-100">
                      Nuevo modo cronometrado · {activeWorld.nameEs}
                    </div>
                    <h3 className="font-display text-2xl font-extrabold">
                      ⏱️ Reto de 30 preguntas en 2 minutos
                    </h3>
                    <p className="text-sm text-indigo-100">
                      30 preguntas variadas con 4 opciones de respuesta. Se guarda automáticamente para tu profesor.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => launchGame('reto_30', activeWorldId)}
                    className="px-6 py-3 text-sm font-extrabold bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-xl cursor-pointer shrink-0"
                  >
                    ¡Empezar Reto 30! →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {GAME_CATALOG.map((g) => (
                    <div
                      key={g.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="text-2xl">{g.emoji}</div>
                        <h3 className="font-display text-lg font-bold text-slate-900">{g.titleEs}</h3>
                        <p className="text-sm text-slate-600">
                          <SpPhrase es={g.descEs} hy={g.descHy} showAudio={false} />
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => launchGame(g.id, activeWorldId)}
                        className="w-full py-2.5 px-4 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl cursor-pointer"
                      >
                        Jugar en {activeWorld.nameEs} →
                      </button>
                    </div>
                  ))}
                </div>

                {/* Final Oral Mission of the World */}
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 space-y-4">
                  <div className="text-xs font-bold text-amber-800">Misión hablada final del mundo</div>
                  <h3 className="font-display text-2xl font-extrabold text-slate-900">
                    {activeWorld.icon} Misión Final: {activeWorld.nameEs}
                  </h3>
                  <p className="text-sm text-slate-800">
                    <SpPhrase
                      es={activeWorld.speakingPrompts[0]?.promptEs || ''}
                      hy={activeWorld.speakingPrompts[0]?.promptHy || ''}
                    />
                  </p>
                  <OralEvaluator
                    playerLabel={
                      isStudent
                        ? activeStudentRole === 'razmik'
                          ? 'Razmik 🔵 (Misión final)'
                          : 'Gayane 🩷 (Misión final)'
                        : 'Razmik y Gayane (Misión final)'
                    }
                    helperWords={activeWorld.speakingPrompts[0]?.helperWords}
                    sampleAnswerEs={activeWorld.speakingPrompts[0]?.sampleEs}
                    studentId={activeStudentRole}
                    worldId={activeWorldId}
                    gameId="mision_final"
                    questionEs={activeWorld.speakingPrompts[0]?.promptEs || `Misión final: ${activeWorld.nameEs}`}
                    parentalConsentGranted={userProfile.parentalConsentGranted}
                    onParentalConsentGranted={() =>
                      setUserProfile((prev) => (prev ? { ...prev, parentalConsentGranted: true } : prev))
                    }
                    onAwardPoints={(pts) => {
                      if (isStudent) {
                        handleManualBonus(activeStudentRole, pts);
                        handleRecordAnswer(activeStudentRole, pts > 0, activeWorldId);
                      } else {
                        handleManualBonus('razmik', pts);
                        handleManualBonus('gayane', pts);
                        handleRecordAnswer('razmik', pts > 0, activeWorldId);
                        handleRecordAnswer('gayane', pts > 0, activeWorldId);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* 18 GAMES CATALOG VIEW */}
        {/* ================================================================ */}
        {view === 'games' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-500">18 modos de juego reales · Razmik 🔵 y Gayane 🩷</div>
                  <h1 className="font-display text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Gamepad2 className="w-7 h-7 text-blue-600" />
                    Arena de Juegos en Español
                  </h1>
                </div>

                {/* Difficulty Selector */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  {([
                    { lvl: 1 as DifficultyLevel, label: 'Nivel 1 · Con ayuda' },
                    { lvl: 2 as DifficultyLevel, label: 'Nivel 2 · Hablo solo' },
                    { lvl: 3 as DifficultyLevel, label: 'Nivel 3 · Real' },
                  ]).map((d) => (
                    <button
                      key={d.lvl}
                      type="button"
                      onClick={() => setGameDifficulty(d.lvl)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer whitespace-nowrap ${
                        gameDifficulty === d.lvl ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl">
                  {[
                    { id: 'todos' as const, label: 'Todos (18)' },
                    { id: 'competir' as const, label: 'Competir' },
                    { id: 'hablar' as const, label: 'Hablar' },
                    { id: 'escuchar' as const, label: 'Escuchar' },
                    { id: 'juntos' as const, label: 'Jugar juntos' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setGameCategory(cat.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                        gameCategory === cat.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <select
                  value={gameWorldFilter}
                  onChange={(e) => setGameWorldFilter(e.target.value as WorldId | 'todos')}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"
                >
                  <option value="todos">Todos los mundos (mezcla)</option>
                  {ALL_WORLDS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.icon} {w.nameEs}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredGames.map((g) => (
                <div
                  key={g.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-blue-400 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{g.emoji}</span>
                      <span className="text-xs font-mono-num text-slate-500">{g.defaultSeconds}s</span>
                    </div>
                    <h2 className="font-display text-lg font-extrabold text-slate-900">{g.titleEs}</h2>
                    <p className="text-sm text-slate-600">
                      <SpPhrase es={g.descEs} hy={g.descHy} showAudio={false} />
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => launchGame(g.id, gameWorldFilter, gameDifficulty)}
                    className="w-full py-2.5 px-4 text-sm font-bold bg-slate-900 text-white hover:bg-blue-600 rounded-xl transition-colors cursor-pointer"
                  >
                    ¡Jugar ahora! →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* ACTIVE GAME PLAYING VIEW */}
        {/* ================================================================ */}
        {view === 'playing' && (
          activeGameId === 'reto_30' ? (
            <Reto30Arena
              key={`reto_30_${gameWorldFilter}`}
              worldFilter={gameWorldFilter}
              activeStudent={activeStudentRole}
              onRecordAnswer={handleRecordAnswer}
              onFinishMatch={handleFinishMatch}
              onSubmitSessionToTeacher={submitGameSessionToTeacher}
              onExitGame={() => setView('games')}
            />
          ) : GAMES_GROUP_1.includes(activeGameId) ? (
            <GameArena
              key={`${activeGameId}_${gameWorldFilter}_${gameDifficulty}`}
              gameId={activeGameId}
              worldFilter={gameWorldFilter}
              difficulty={gameDifficulty}
              timerMode={storage.teacherConfig.timerMode}
              roundsCount={storage.teacherConfig.roundsCount}
              timerSeconds={storage.teacherConfig.timerSeconds}
              storage={storage}
              userRole={userProfile.role}
              activeStudentRole={activeStudentRole}
              parentalConsentGranted={userProfile.parentalConsentGranted}
              onParentalConsentGranted={() =>
                setUserProfile((prev) => (prev ? { ...prev, parentalConsentGranted: true } : prev))
              }
              onFinishMatch={handleFinishMatch}
              onSubmitSessionToTeacher={submitGameSessionToTeacher}
              onRecordAnswer={handleRecordAnswer}
              onExitGame={() => setView('games')}
            />
          ) : (
            <GamesExtra
              key={`${activeGameId}_${gameWorldFilter}_${gameDifficulty}`}
              gameId={activeGameId}
              worldFilter={gameWorldFilter}
              difficulty={gameDifficulty}
              timerSeconds={storage.teacherConfig.timerSeconds}
              storage={storage}
              userRole={userProfile.role}
              activeStudentRole={activeStudentRole}
              parentalConsentGranted={userProfile.parentalConsentGranted}
              onParentalConsentGranted={() =>
                setUserProfile((prev) => (prev ? { ...prev, parentalConsentGranted: true } : prev))
              }
              onFinishMatch={handleFinishMatch}
              onSubmitSessionToTeacher={submitGameSessionToTeacher}
              onRecordAnswer={handleRecordAnswer}
              onExitGame={() => setView('games')}
            />
          )
        )}

        {/* ================================================================ */}
        {/* RESULTS & STATS VIEW */}
        {/* ================================================================ */}
        {view === 'results' && (
          <StatsAndResults
            userRole={userProfile.role}
            storage={storage}
            leaderboard={leaderboard}
            cloudSessions={cloudSessions}
            cloudRecordings={cloudRecordings}
            onSubmitSessionToTeacher={submitGameSessionToTeacher}
            onImportProgress={(next) => setStorage(next)}
            onResetProgress={() => void handleGlobalReset()}
            onContinueAdventure={() => openWorld(storage.lastWorld || 'aeropuerto', 'explorar')}
          />
        )}

        {/* ================================================================ */}
        {/* TEACHER PANEL VIEW */}
        {/* ================================================================ */}
        {view === 'teacher' && userProfile.role === 'profesor' && (
          <TeacherPanel
            userRole={userProfile.role}
            config={storage.teacherConfig}
            onUpdateConfig={(tc: TeacherConfig) => setStorage((prev) => ({ ...prev, teacherConfig: tc }))}
            onStartConfiguredGame={() =>
              launchGame(
                storage.teacherConfig.selectedGame,
                storage.teacherConfig.selectedWorld,
                storage.teacherConfig.difficulty
              )
            }
            onManualBonus={handleManualBonus}
            razmikProgress={{
              ...storage.razmik,
              totalTimeSec: cloudStatsMap.razmik.totalTimeSec,
              gamesCompleted: cloudStatsMap.razmik.gamesCompleted,
            }}
            gayaneProgress={{
              ...storage.gayane,
              totalTimeSec: cloudStatsMap.gayane.totalTimeSec,
              gamesCompleted: cloudStatsMap.gayane.gamesCompleted,
            }}
            leaderboard={leaderboard}
            sessions={cloudSessions}
            recordings={cloudRecordings}
          />
        )}
      </main>
    </div>
  );
}
