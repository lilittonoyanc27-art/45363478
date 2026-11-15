import React, { useMemo, useRef, useState } from 'react';
import {
  Volume2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  CheckCircle2,
  Trophy,
  RefreshCw,
  ShoppingCart,
  Plane,
  Utensils,
  RotateCcw,
  Send,
  Loader2,
} from 'lucide-react';
import {
  ALL_WORLDS,
  AIRPORT_MISSION_ZONES,
  CRAZY_DIALOGUES,
  MARKET_PRODUCTS,
  RESTAURANT_6_STEPS,
  RESTAURANT_MENU,
  SHOPPING_LISTS,
  WORLDS_MAP,
} from './dataGames';
import { playCorrectSound, playVictorySound, playWrongSound, speakDialogueSequence, speakEs } from './audio';
import {
  ConfettiOverlay,
  DualScoreHud,
  OralEvaluator,
  SpPhrase,
  UniversalTimer,
  formatTimeSec,
  useGameTimer,
} from './ClickSpanish';
import {
  AppStorageState,
  CloudAnswerSummary,
  DifficultyLevel,
  GameId,
  MatchHistoryItem,
  PlayerId,
  TimerMode,
  UserRole,
  WorldId,
} from './types';

interface GameArenaProps {
  gameId: GameId;
  worldFilter: WorldId | 'todos';
  difficulty: DifficultyLevel;
  timerMode: TimerMode;
  roundsCount: number;
  timerSeconds: number;
  storage: AppStorageState;
  userRole?: UserRole;
  activeStudentRole?: PlayerId;
  parentalConsentGranted?: boolean;
  onParentalConsentGranted?: () => void;
  onFinishMatch: (
    result: Omit<MatchHistoryItem, 'id' | 'dateIso'>,
    sessionMeta?: {
      totalQuestions: number;
      correctCount: number;
      incorrectCount: number;
      durationSec: number;
      answersSummary: CloudAnswerSummary[];
    }
  ) => Promise<string | null> | void;
  onSubmitSessionToTeacher?: (sessionId: string) => Promise<void>;
  onRecordAnswer: (player: PlayerId, correct: boolean, worldId?: WorldId) => void;
  onExitGame: () => void;
}

export const GameArena: React.FC<GameArenaProps> = ({
  gameId,
  worldFilter,
  difficulty,
  timerMode,
  roundsCount,
  timerSeconds,
  storage,
  userRole = 'profesor',
  activeStudentRole = 'razmik',
  parentalConsentGranted = false,
  onParentalConsentGranted,
  onFinishMatch,
  onSubmitSessionToTeacher,
  onRecordAnswer,
  onExitGame,
}) => {
  const safeStudentId = (p: PlayerId): PlayerId => (userRole === 'profesor' ? p : activeStudentRole);
  const [activePlayer, setActivePlayer] = useState<PlayerId>(activeStudentRole);
  const [razmikScore, setRazmikScore] = useState(0);
  const [gayaneScore, setGayaneScore] = useState(0);
  const [razmikTime, setRazmikTime] = useState(0);
  const [gayaneTime, setGayaneTime] = useState(0);
  const [showWinnerBanner, setShowWinnerBanner] = useState(false);

  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [sendingToTeacher, setSendingToTeacher] = useState(false);
  const [sentConfirmed, setSentConfirmed] = useState(false);
  const [sendError, setSendError] = useState('');

  const matchCorrectRef = useRef(0);
  const matchIncorrectRef = useRef(0);
  const matchAnswersRef = useRef<CloudAnswerSummary[]>([]);

  const worldsPool = useMemo(
    () => (worldFilter === 'todos' ? ALL_WORLDS : [WORLDS_MAP[worldFilter]]),
    [worldFilter]
  );

  const awardPlayer = (player: PlayerId, pts: number, secSpent = 0, isCorrect = true, wId?: WorldId) => {
    if (isCorrect) matchCorrectRef.current += 1;
    else matchIncorrectRef.current += 1;

    if (player === 'razmik') {
      setRazmikScore((s) => s + pts);
      setRazmikTime((t) => t + secSpent);
    } else {
      setGayaneScore((s) => s + pts);
      setGayaneTime((t) => t + secSpent);
    }
    onRecordAnswer(player, isCorrect, wId);
  };

  const concludeMatch = async (titleEs: string, rScore = razmikScore, gScore = gayaneScore, rTime = razmikTime, gTime = gayaneTime) => {
    const winner: PlayerId | 'empate' =
      rScore > gScore ? 'razmik' : gScore > rScore ? 'gayane' : rTime > 0 && gTime > 0 && rTime !== gTime ? (rTime < gTime ? 'razmik' : 'gayane') : 'empate';
    playVictorySound();
    setShowWinnerBanner(true);

    const totalQuestions = Math.max(1, matchCorrectRef.current + matchIncorrectRef.current);
    const sessionId = await onFinishMatch(
      {
        gameId,
        gameTitleEs: titleEs,
        world: worldFilter,
        razmikScore: rScore,
        gayaneScore: gScore,
        razmikTimeSec: rTime,
        gayaneTimeSec: gTime,
        winner,
      },
      {
        totalQuestions,
        correctCount: matchCorrectRef.current,
        incorrectCount: matchIncorrectRef.current,
        durationSec: Math.max(1, rTime + gTime),
        answersSummary: matchAnswersRef.current,
      }
    );
    if (typeof sessionId === 'string') {
      setSavedSessionId(sessionId);
    }
  };

  const handleSendSessionToTeacher = async () => {
    if (!savedSessionId || !onSubmitSessionToTeacher || sendingToTeacher || sentConfirmed) return;
    setSendingToTeacher(true);
    setSendError('');
    try {
      await onSubmitSessionToTeacher(savedSessionId);
      setSentConfirmed(true);
      playCorrectSound();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'No se pudo enviar al profesor.');
    } finally {
      setSendingToTeacher(false);
    }
  };

  // ============================================================================
  // JUEGO 1: ⚡ ¡RESPONDE RÁPIDO!
  // ============================================================================
  const quickQuestionsPool = useMemo(() => {
    const all = worldsPool.flatMap((w) => w.quickQuestions);
    const filtered = all.filter((q) => q.level <= difficulty);
    const list = filtered.length >= 4 ? filtered : all;
    return list.slice(0, Math.max(4, roundsCount));
  }, [worldsPool, difficulty, roundsCount]);

  const [qIndex, setQIndex] = useState(0);
  const [p1HiddenChoice, setP1HiddenChoice] = useState<number | null>(null);
  const [roundFeedback, setRoundFeedback] = useState<{ rChoice: number | null; gChoice: number | null } | null>(null);
  const [firstTurnPlayer, setFirstTurnPlayer] = useState<PlayerId>('razmik');

  const qLimit = timerSeconds || 15;
  const qTimer = useGameTimer('contrarreloj', qLimit, () => {
    if (gameId === 'responde_rapido' && !roundFeedback) {
      handleQuickPick(-1);
    }
  });

  const currentQuick = quickQuestionsPool[qIndex % quickQuestionsPool.length];

  const handleQuickPick = (optIdx: number) => {
    if (roundFeedback) return;
    const elapsed = Math.max(1, qLimit - qTimer.seconds);
    qTimer.pause();

    if (activePlayer === firstTurnPlayer) {
      setP1HiddenChoice(optIdx);
      const nextP: PlayerId = firstTurnPlayer === 'razmik' ? 'gayane' : 'razmik';
      setActivePlayer(nextP);
      qTimer.reset(qLimit);
      qTimer.start();
    } else {
      const rChoice = firstTurnPlayer === 'razmik' ? p1HiddenChoice : optIdx;
      const gChoice = firstTurnPlayer === 'gayane' ? p1HiddenChoice : optIdx;
      const correct = currentQuick.correctIndex;
      const activeChoice = activeStudentRole === 'razmik' ? rChoice : gChoice;

      matchAnswersRef.current.push({
        questionEs: currentQuick.situationEs,
        chosenEs: activeChoice !== null && activeChoice >= 0 ? currentQuick.options[activeChoice] || 'Sin respuesta' : 'Sin respuesta',
        correctEs: currentQuick.options[correct] || '',
        isCorrect: activeChoice === correct,
      });

      let rAdd = 0;
      let gAdd = 0;
      if (rChoice === correct) {
        rAdd = 10 + (elapsed <= 6 ? 4 : 0);
        awardPlayer('razmik', rAdd, elapsed, true, currentQuick.world);
      } else {
        awardPlayer('razmik', 0, elapsed, false, currentQuick.world);
      }

      if (gChoice === correct) {
        gAdd = 10 + (elapsed <= 6 ? 4 : 0);
        awardPlayer('gayane', gAdd, elapsed, true, currentQuick.world);
      } else {
        awardPlayer('gayane', 0, elapsed, false, currentQuick.world);
      }

      if (rAdd > 0 || gAdd > 0) playCorrectSound();
      else playWrongSound();

      setRoundFeedback({ rChoice, gChoice });
    }
  };

  const nextQuickRound = () => {
    setRoundFeedback(null);
    setP1HiddenChoice(null);
    if (qIndex + 1 >= quickQuestionsPool.length) {
      concludeMatch('¡Responde rápido!');
    } else {
      const nextStarter: PlayerId = firstTurnPlayer === 'razmik' ? 'gayane' : 'razmik';
      setFirstTurnPlayer(nextStarter);
      setActivePlayer(nextStarter);
      setQIndex((i) => i + 1);
      qTimer.reset(qLimit);
      qTimer.start();
    }
  };

  // ============================================================================
  // JUEGO 2: 🎭 ¡CAMBIO DE PAPELES!
  // ============================================================================
  const roleplaysPool = useMemo(() => worldsPool.flatMap((w) => w.roleplays), [worldsPool]);
  const [rpIdx, setRpIdx] = useState(0);
  const [rolesSwapped, setRolesSwapped] = useState(false);
  const [rpChecks, setRpChecks] = useState<{
    rPhrases: boolean;
    rQuestions: boolean;
    rFull: boolean;
    gPhrases: boolean;
    gQuestions: boolean;
    gFull: boolean;
  }>({ rPhrases: false, rQuestions: false, rFull: false, gPhrases: false, gQuestions: false, gFull: false });
  const rpTimer = useGameTimer('dialogo', 0);
  const currentRp = roleplaysPool[rpIdx % roleplaysPool.length];

  // ============================================================================
  // JUEGO 3: 🧩 ¡DIÁLOGO LOCO!
  // ============================================================================
  const crazyPool = useMemo(
    () => (worldFilter === 'todos' ? CRAZY_DIALOGUES : CRAZY_DIALOGUES.filter((d) => d.world === worldFilter)),
    [worldFilter]
  );
  const [crazyIdx, setCrazyIdx] = useState(0);
  const currentCrazy = crazyPool[crazyIdx % crazyPool.length] || CRAZY_DIALOGUES[0];
  const [scrambledOrder, setScrambledOrder] = useState<number[]>(() =>
    currentCrazy.lines.map((_, i) => i).sort((a, b) => ((a * 3 + 1) % 5) - ((b * 3 + 1) % 5))
  );
  const [crazyChecked, setCrazyChecked] = useState(false);
  const crazyTimer = useGameTimer('cronometro', 0);

  const resetCrazyForSet = (idx: number) => {
    const target = crazyPool[idx % crazyPool.length] || CRAZY_DIALOGUES[0];
    const indices = target.lines.map((_, i) => i);
    // Deterministic scramble not equal to sorted
    const shifted = [...indices.slice(2), indices[0], indices[1]].filter((v) => v !== undefined);
    setScrambledOrder(shifted.length === indices.length ? shifted : indices.reverse());
    setCrazyChecked(false);
    crazyTimer.reset(0);
  };

  const moveCrazyLine = (pos: number, dir: -1 | 1) => {
    const target = pos + dir;
    if (target < 0 || target >= scrambledOrder.length) return;
    const copy = [...scrambledOrder];
    const tmp = copy[pos];
    copy[pos] = copy[target];
    copy[target] = tmp;
    setScrambledOrder(copy);
  };

  // ============================================================================
  // JUEGO 4: 🎧 ¡ESCUCHA Y GANA!
  // ============================================================================
  const listeningPool = useMemo(() => worldsPool.flatMap((w) => w.listening), [worldsPool]);
  const [listenIdx, setListenIdx] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showTransHy, setShowTransHy] = useState(false);
  const [listenPicked, setListenPicked] = useState<number | null>(null);
  const listenTimer = useGameTimer(timerMode, timerSeconds || 30);
  const currentListen = listeningPool[listenIdx % listeningPool.length];

  // ============================================================================
  // JUEGO 5: 🕵️ ¡ENCUENTRA EL ERROR!
  // ============================================================================
  const errorPool = useMemo(() => worldsPool.flatMap((w) => w.errors), [worldsPool]);
  const [errIdx, setErrIdx] = useState(0);
  const [errInput, setErrInput] = useState('');
  const [errSelectedWord, setErrSelectedWord] = useState<string | null>(null);
  const [errResult, setErrResult] = useState<'ok' | 'bad' | null>(null);
  const errTimer = useGameTimer('contrarreloj', 30, () => {
    if (gameId === 'encuentra_error' && !errResult) {
      setErrResult('bad');
      playWrongSound();
    }
  });
  const currentErr = errorPool[errIdx % errorPool.length];

  // ============================================================================
  // JUEGO 6: 🛒 ¡COMPRA MÁS INTELIGENTE!
  // ============================================================================
  const [marketCartR, setMarketCartR] = useState<Record<string, number>>({});
  const [marketCartG, setMarketCartG] = useState<Record<string, number>>({});
  const [marketStage, setMarketStage] = useState<'shop' | 'caja'>('shop');
  const marketTimer = useGameTimer('cronometro', 0);

  const activeCart = activePlayer === 'razmik' ? marketCartR : marketCartG;
  const setActiveCart = activePlayer === 'razmik' ? setMarketCartR : setMarketCartG;
  const activeList = SHOPPING_LISTS[activePlayer];
  const activeCartTotal = useMemo(
    () =>
      Object.entries(activeCart).reduce((sum, [pid, qty]) => {
        const prod = MARKET_PRODUCTS.find((p) => p.id === pid);
        return sum + (prod ? prod.price * qty : 0);
      }, 0),
    [activeCart]
  );

  // ============================================================================
  // JUEGO 7: 🍕 ¡CAMARERO POR UN DÍA!
  // ============================================================================
  const [restStepsDone, setRestStepsDone] = useState<number[]>([]);
  const [restSwapped, setRestSwapped] = useState(false);
  const restTimer = useGameTimer('contrarreloj', 120);

  // ============================================================================
  // JUEGO 8: ✈️ ¡NO PIERDAS EL AVIÓN!
  // ============================================================================
  const [zoneIdx, setZoneIdx] = useState(0);
  const [zoneChoice, setZoneChoice] = useState<number | null>(null);
  const aeroTimer = useGameTimer('contrarreloj', 120);
  const currentZone = AIRPORT_MISSION_ZONES[zoneIdx % AIRPORT_MISSION_ZONES.length];

  const handleResetCurrentRound = () => {
    matchCorrectRef.current = 0;
    matchIncorrectRef.current = 0;
    matchAnswersRef.current = [];
    setSavedSessionId(null);
    setSentConfirmed(false);
    setSendError('');
    setRazmikScore(0);
    setGayaneScore(0);
    setRazmikTime(0);
    setGayaneTime(0);
    setActivePlayer(activeStudentRole);
    setShowWinnerBanner(false);
    setQIndex(0);
    setP1HiddenChoice(null);
    setRoundFeedback(null);
    setFirstTurnPlayer('razmik');
    qTimer.reset(qLimit);
    setRpIdx(0);
    setRolesSwapped(false);
    setRpChecks({ rPhrases: false, rQuestions: false, rFull: false, gPhrases: false, gQuestions: false, gFull: false });
    rpTimer.reset(0);
    setCrazyIdx(0);
    resetCrazyForSet(0);
    setListenIdx(0);
    setShowTranscript(false);
    setShowTransHy(false);
    setListenPicked(null);
    listenTimer.reset(30);
    setErrIdx(0);
    setErrInput('');
    setErrSelectedWord(null);
    setErrResult(null);
    errTimer.reset(30);
    setMarketCartR({});
    setMarketCartG({});
    setMarketStage('shop');
    marketTimer.reset(0);
    setRestStepsDone([]);
    setRestSwapped(false);
    restTimer.reset(120);
    setZoneIdx(0);
    setZoneChoice(null);
    aeroTimer.reset(120);
  };

  return (
    <div className="space-y-6">
      <ConfettiOverlay active={showWinnerBanner} />

      {/* Top Arena Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExitGame}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            ← Volver a juegos
          </button>
          <button
            type="button"
            onClick={handleResetCurrentRound}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-xl cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reiniciar ronda
          </button>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Nivel {difficulty} · {worldFilter === 'todos' ? 'Todos los mundos' : WORLDS_MAP[worldFilter].nameEs}
        </div>
      </div>

      {/* Live Dual Scoreboard */}
      <DualScoreHud
        activePlayer={gameId === 'cambio_papeles' || gameId === 'camarero_dia' ? 'ambos' : activePlayer}
        razmikRoundPoints={razmikScore}
        gayaneRoundPoints={gayaneScore}
        razmikRoundTime={razmikTime}
        gayaneRoundTime={gayaneTime}
        razmikTotal={storage.razmik}
        gayaneTotal={storage.gayane}
      />

      {/* Winner Banner Modal Inline */}
      {showWinnerBanner && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-6 text-center space-y-4">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="font-display text-3xl font-extrabold text-slate-900">
            {razmikScore > gayaneScore
              ? '¡RAZMIK GANA ESTA RONDA! 🔵'
              : gayaneScore > razmikScore
                ? '¡GAYANE GANA ESTA RONDA! 🩷'
                : '¡EMPATE ÉPICO! 🏆'}
          </h2>
          <div className="font-mono-num text-lg font-bold text-slate-700">
            RAZMIK 🔵 — {razmikScore} puntos · {formatTimeSec(razmikTime)} | GAYANE 🩷 — {gayaneScore} puntos · {formatTimeSec(gayaneTime)}
          </div>
          {sendError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 max-w-md mx-auto">
              {sendError}
            </div>
          )}
          {sentConfirmed && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-sm font-extrabold text-emerald-900 inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Resultado enviado correctamente
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            {savedSessionId && onSubmitSessionToTeacher && !sentConfirmed && (
              <button
                type="button"
                disabled={sendingToTeacher}
                onClick={handleSendSessionToTeacher}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl cursor-pointer disabled:opacity-60"
              >
                {sendingToTeacher ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sendingToTeacher ? 'Enviando...' : '📤 Enviar resultados al profesor'}
              </button>
            )}
            <button
              type="button"
              onClick={handleResetCurrentRound}
              className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl cursor-pointer"
            >
              Repetir la actividad
            </button>
            <button
              type="button"
              onClick={onExitGame}
              className="px-5 py-2.5 text-sm font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              Volver al menú
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 1: ¡RESPONDE RÁPIDO! */}
      {/* ==================================================================== */}
      {gameId === 'responde_rapido' && currentQuick && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Pregunta {qIndex + 1} de {quickQuestionsPool.length} · Turno secreto de {activePlayer === 'razmik' ? 'RAZMIK 🔵' : 'GAYANE 🩷'}
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">⚡ ¡Responde rápido!</h2>
            </div>
            <UniversalTimer
              mode="contrarreloj"
              initialSeconds={qLimit}
              running={qTimer.running}
              seconds={qTimer.seconds}
              onStart={qTimer.start}
              onPause={qTimer.pause}
              onReset={() => qTimer.reset(qLimit)}
            />
          </div>

          {!qTimer.running && !roundFeedback && p1HiddenChoice === null && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-blue-900">
                Pulsa «¡Empezar!» para activar el cronómetro de {activePlayer === 'razmik' ? 'Razmik' : 'Gayane'}. El segundo jugador no verá la respuesta del primero.
              </span>
              <button
                type="button"
                onClick={qTimer.start}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shrink-0 cursor-pointer"
              >
                ¡Empezar turno!
              </button>
            </div>
          )}

          {p1HiddenChoice !== null && !roundFeedback && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm font-semibold text-amber-900">
              🔒 Respuesta de {firstTurnPlayer === 'razmik' ? 'Razmik' : 'Gayane'} guardada en secreto. ¡Ahora responde {activePlayer === 'razmik' ? 'Razmik' : 'Gayane'}!
            </div>
          )}

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-lg font-bold text-slate-900">
              <SpPhrase es={currentQuick.situationEs} hy={currentQuick.situationHy} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentQuick.options.map((opt, idx) => {
              const isCorrect = idx === currentQuick.correctIndex;
              const pickedR = roundFeedback?.rChoice === idx;
              const pickedG = roundFeedback?.gChoice === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={Boolean(roundFeedback)}
                  onClick={() => handleQuickPick(idx)}
                  className={`p-4 rounded-xl border text-left font-medium transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    roundFeedback
                      ? isCorrect
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                        : pickedR || pickedG
                          ? 'bg-red-100 border-red-400 text-red-900'
                          : 'bg-white border-slate-200 text-slate-500'
                      : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-slate-900'
                  }`}
                >
                  <span>
                    <strong className="mr-2">{String.fromCharCode(65 + idx)}.</strong>
                    {opt}
                  </span>
                  {roundFeedback && (
                    <span className="text-xs font-bold shrink-0">
                      {pickedR ? '🔵 ' : ''}
                      {pickedG ? '🩷 ' : ''}
                      {isCorrect ? '✓' : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {roundFeedback && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="text-sm font-medium text-slate-800">{currentQuick.explanationHy}</div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => speakEs(currentQuick.options[currentQuick.correctIndex])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  Escuchar respuesta correcta
                </button>
                <button
                  type="button"
                  onClick={nextQuickRound}
                  className="px-5 py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  {qIndex + 1 >= quickQuestionsPool.length ? 'Ver resultado final →' : 'Siguiente pregunta →'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 2: 🎭 ¡CAMBIO DE PAPELES! */}
      {/* ==================================================================== */}
      {gameId === 'cambio_papeles' && currentRp && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">Juego de rol obligatorio · Escenario {rpIdx + 1}</div>
              <h2 className="font-display text-2xl font-bold text-slate-900">🎭 ¡Cambio de papeles! — {currentRp.titleEs}</h2>
              <p className="text-sm text-slate-600 mt-1">
                <SpPhrase es={currentRp.contextEs} hy={currentRp.contextHy} />
              </p>
            </div>
            <UniversalTimer
              mode="dialogo"
              initialSeconds={0}
              running={rpTimer.running}
              seconds={rpTimer.seconds}
              onStart={rpTimer.start}
              onPause={rpTimer.pause}
              onReset={() => rpTimer.reset(0)}
              onFinish={() => {
                rpTimer.pause();
                setRazmikTime((t) => t + rpTimer.seconds);
                setGayaneTime((t) => t + rpTimer.seconds);
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role Card Razmik */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
              <div className="font-display font-bold text-lg text-blue-900">
                RAZMIK 🔵 — {rolesSwapped ? currentRp.roleBName : currentRp.roleAName}
              </div>
              <ul className="space-y-2 text-sm text-slate-800">
                {(rolesSwapped ? currentRp.roleBGoalsEs : currentRp.roleAGoalsEs).map((g, i) => (
                  <li key={i} className="bg-white border border-blue-100 rounded-lg p-2.5">
                    <SpPhrase
                      es={g}
                      hy={(rolesSwapped ? currentRp.roleBGoalsHy : currentRp.roleAGoalsHy)[i] || ''}
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Role Card Gayane */}
            <div className="rounded-xl border border-pink-200 bg-pink-50/50 p-4 space-y-3">
              <div className="font-display font-bold text-lg text-pink-900">
                GAYANE 🩷 — {rolesSwapped ? currentRp.roleAName : currentRp.roleBName}
              </div>
              <ul className="space-y-2 text-sm text-slate-800">
                {(rolesSwapped ? currentRp.roleAGoalsEs : currentRp.roleBGoalsEs).map((g, i) => (
                  <li key={i} className="bg-white border border-pink-100 rounded-lg p-2.5">
                    <SpPhrase
                      es={g}
                      hy={(rolesSwapped ? currentRp.roleAGoalsHy : currentRp.roleBGoalsHy)[i] || ''}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {difficulty === 1 && (
            <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <strong>Palabras útiles (Nivel 1):</strong> {currentRp.usefulWords.join(' · ')}
            </div>
          )}

          {/* Teacher Rubric Checkboxes */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="text-sm font-bold text-slate-800">
              Evaluación del profesor (Ուսուցչի գնահատականը՝ առնվազն 5 իմաստալից ռեպլիկ յուրաքանչյուրից).
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2 bg-white border border-slate-200 rounded-xl p-3">
                <div className="font-bold text-blue-700">RAZMIK 🔵</div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rpChecks.rPhrases} onChange={(e) => setRpChecks({ ...rpChecks, rPhrases: e.target.checked })} />
                  Usó frases útiles del tema (+10)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rpChecks.rQuestions} onChange={(e) => setRpChecks({ ...rpChecks, rQuestions: e.target.checked })} />
                  Hizo preguntas claras en español (+10)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rpChecks.rFull} onChange={(e) => setRpChecks({ ...rpChecks, rFull: e.target.checked })} />
                  Respondió con frases completas (+10)
                </label>
              </div>
              <div className="space-y-2 bg-white border border-slate-200 rounded-xl p-3">
                <div className="font-bold text-pink-700">GAYANE 🩷</div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rpChecks.gPhrases} onChange={(e) => setRpChecks({ ...rpChecks, gPhrases: e.target.checked })} />
                  Usó frases útiles del tema (+10)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rpChecks.gQuestions} onChange={(e) => setRpChecks({ ...rpChecks, gQuestions: e.target.checked })} />
                  Hizo preguntas claras en español (+10)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rpChecks.gFull} onChange={(e) => setRpChecks({ ...rpChecks, gFull: e.target.checked })} />
                  Respondió con frases completas (+10)
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRolesSwapped((s) => !s);
                  rpTimer.reset(0);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-xl cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Cambiar papeles ahora
              </button>
              <button
                type="button"
                onClick={() => {
                  const rPts = (rpChecks.rPhrases ? 10 : 0) + (rpChecks.rQuestions ? 10 : 0) + (rpChecks.rFull ? 10 : 0);
                  const gPts = (rpChecks.gPhrases ? 10 : 0) + (rpChecks.gQuestions ? 10 : 0) + (rpChecks.gFull ? 10 : 0);
                  awardPlayer('razmik', rPts, rpTimer.seconds, rPts > 0, currentRp.world);
                  awardPlayer('gayane', gPts, rpTimer.seconds, gPts > 0, currentRp.world);
                  concludeMatch('¡Cambio de papeles!', razmikScore + rPts, gayaneScore + gPts, razmikTime + rpTimer.seconds, gayaneTime + rpTimer.seconds);
                }}
                className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl cursor-pointer"
              >
                Confirmar puntos y terminar
              </button>
              <button
                type="button"
                onClick={() => {
                  setRpIdx((i) => i + 1);
                  setRpChecks({ rPhrases: false, rQuestions: false, rFull: false, gPhrases: false, gQuestions: false, gFull: false });
                  rpTimer.reset(0);
                }}
                className="px-4 py-2 text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer"
              >
                Otro escenario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 3: 🧩 ¡DIÁLOGO LOCO! */}
      {/* ==================================================================== */}
      {gameId === 'dialogo_loco' && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Turno de {activePlayer === 'razmik' ? 'RAZMIK 🔵' : 'GAYANE 🩷'} · {currentCrazy.titleEs}
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">🧩 ¡Diálogo loco!</h2>
            </div>
            <UniversalTimer
              mode="cronometro"
              initialSeconds={0}
              running={crazyTimer.running}
              seconds={crazyTimer.seconds}
              onStart={crazyTimer.start}
              onPause={crazyTimer.pause}
              onReset={() => crazyTimer.reset(0)}
              onFinish={() => {
                crazyTimer.pause();
                if (activePlayer === 'razmik') setRazmikTime((t) => t + crazyTimer.seconds);
                else setGayaneTime((t) => t + crazyTimer.seconds);
              }}
            />
          </div>

          <div className="space-y-2.5">
            {scrambledOrder.map((origIdx, pos) => {
              const line = currentCrazy.lines[origIdx];
              const isInRightPlace = crazyChecked && origIdx === pos;
              return (
                <div
                  key={origIdx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    crazyChecked
                      ? isInRightPlace
                        ? 'bg-emerald-50 border-emerald-400'
                        : 'bg-red-50 border-red-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono-num text-xs font-bold text-slate-400 w-5">{pos + 1}.</span>
                    <SpPhrase es={line.es} hy={line.hy} />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={pos === 0 || crazyChecked}
                      onClick={() => moveCrazyLine(pos, -1)}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      aria-label="Subir frase"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={pos === scrambledOrder.length - 1 || crazyChecked}
                      onClick={() => moveCrazyLine(pos, 1)}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      aria-label="Bajar frase"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            {!crazyChecked ? (
              <button
                type="button"
                onClick={() => {
                  crazyTimer.pause();
                  setCrazyChecked(true);
                  const allGood = scrambledOrder.every((v, i) => v === i);
                  if (allGood) {
                    playCorrectSound();
                    const bonus = crazyTimer.seconds > 0 && crazyTimer.seconds <= 25 ? 5 : 0;
                    awardPlayer(activePlayer, 15 + bonus, Math.max(1, crazyTimer.seconds), true, currentCrazy.world);
                    speakDialogueSequence(currentCrazy.lines);
                  } else {
                    playWrongSound();
                    awardPlayer(activePlayer, 0, Math.max(1, crazyTimer.seconds), false, currentCrazy.world);
                  }
                }}
                className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl cursor-pointer"
              >
                Comprobar orden
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => speakDialogueSequence(currentCrazy.lines)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  Escuchar diálogo correcto
                </button>
                {activePlayer === 'razmik' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActivePlayer('gayane');
                      const nextIdx = crazyIdx + 1;
                      setCrazyIdx(nextIdx);
                      resetCrazyForSet(nextIdx);
                    }}
                    className="px-5 py-2.5 text-sm font-semibold bg-pink-600 text-white hover:bg-pink-700 rounded-xl cursor-pointer"
                  >
                    Turno de Gayane 🩷 →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => concludeMatch('¡Diálogo loco!')}
                    className="px-5 py-2.5 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    Finalizar duelo →
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 4: 🎧 ¡ESCUCHA Y GANA! */}
      {/* ==================================================================== */}
      {gameId === 'escucha_gana' && currentListen && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Audio {listenIdx + 1} · Turno de {activePlayer === 'razmik' ? 'RAZMIK 🔵' : 'GAYANE 🩷'}
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">🎧 ¡Escucha y gana!</h2>
            </div>
            <UniversalTimer
              mode="contrarreloj"
              initialSeconds={30}
              running={listenTimer.running}
              seconds={listenTimer.seconds}
              onStart={listenTimer.start}
              onPause={listenTimer.pause}
              onReset={() => listenTimer.reset(30)}
            />
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
            <div className="text-sm text-slate-300">Escucha atentamente el audio en español (el texto está oculto):</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!listenTimer.running) listenTimer.start();
                  speakEs(currentListen.audioEs, false);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                Escuchar otra vez
              </button>
              <button
                type="button"
                onClick={() => speakEs(currentListen.audioEs, true)}
                className="px-4 py-2.5 text-sm font-semibold bg-white/15 hover:bg-white/25 rounded-xl cursor-pointer"
              >
                Más despacio
              </button>
              <button
                type="button"
                onClick={() => setShowTranscript((s) => !s)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer"
              >
                {showTranscript ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showTranscript ? 'Ocultar transcripción' : 'Mostrar transcripción (-3 pts)'}
              </button>
              <button
                type="button"
                onClick={() => setShowTransHy((s) => !s)}
                className="px-3.5 py-2.5 text-sm font-semibold bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer"
              >
                Ver traducción (-3 pts)
              </button>
            </div>

            {(showTranscript || listenPicked !== null) && (
              <div className="p-3 rounded-xl bg-white/10 text-base font-semibold">{currentListen.audioEs}</div>
            )}
            {(showTransHy || listenPicked !== null) && (
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-100 text-sm">{currentListen.audioHy}</div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-lg font-bold text-slate-900">{currentListen.questionEs}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentListen.options.map((opt, idx) => {
                const picked = listenPicked === idx;
                const isRight = idx === currentListen.correctIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={listenPicked !== null}
                    onClick={() => {
                      listenTimer.pause();
                      setListenPicked(idx);
                      const penalty = (showTranscript ? 3 : 0) + (showTransHy ? 3 : 0);
                      if (isRight) {
                        playCorrectSound();
                        awardPlayer(activePlayer, Math.max(4, 12 - penalty), 30 - listenTimer.seconds, true, currentListen.world);
                      } else {
                        playWrongSound();
                        awardPlayer(activePlayer, 0, 30 - listenTimer.seconds, false, currentListen.world);
                      }
                    }}
                    className={`p-4 rounded-xl border text-left font-medium cursor-pointer ${
                      listenPicked !== null
                        ? isRight
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                          : picked
                            ? 'bg-red-100 border-red-400 text-red-900'
                            : 'bg-white border-slate-200 text-slate-500'
                        : 'bg-white border-slate-200 hover:border-blue-400 text-slate-900'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {listenPicked !== null && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-sm text-slate-800">{currentListen.explanationHy}</div>
              <button
                type="button"
                onClick={() => {
                  setListenPicked(null);
                  setShowTranscript(false);
                  setShowTransHy(false);
                  if (listenIdx + 1 >= Math.min(listeningPool.length, roundsCount)) {
                    concludeMatch('¡Escucha y gana!');
                  } else {
                    setActivePlayer((p) => (p === 'razmik' ? 'gayane' : 'razmik'));
                    setListenIdx((i) => i + 1);
                    listenTimer.reset(30);
                  }
                }}
                className="px-5 py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                Siguiente audio →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 5: 🕵️ ¡ENCUENTRA EL ERROR! */}
      {/* ==================================================================== */}
      {gameId === 'encuentra_error' && currentErr && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Detective {errIdx + 1} · Turno de {activePlayer === 'razmik' ? 'RAZMIK 🔵' : 'GAYANE 🩷'}
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">🕵️ ¡Encuentra el error!</h2>
            </div>
            <UniversalTimer
              mode="contrarreloj"
              initialSeconds={30}
              running={errTimer.running}
              seconds={errTimer.seconds}
              onStart={errTimer.start}
              onPause={errTimer.pause}
              onReset={() => errTimer.reset(30)}
            />
          </div>

          <div className="p-5 rounded-xl bg-red-50/60 border border-red-200 space-y-3">
            <div className="text-xs font-bold text-red-700">1. Pulsa la palabra incorrecta en esta frase:</div>
            <div className="flex flex-wrap gap-2">
              {currentErr.wrongEs.split(' ').map((word, wIdx) => {
                const clean = word.replace(/[¿?¡!.,]/g, '');
                const selected = errSelectedWord === clean;
                return (
                  <button
                    key={wIdx}
                    type="button"
                    disabled={Boolean(errResult)}
                    onClick={() => {
                      if (!errTimer.running) errTimer.start();
                      setErrSelectedWord(clean);
                    }}
                    className={`px-3 py-2 rounded-xl border text-lg font-bold transition-colors cursor-pointer ${
                      selected
                        ? 'bg-amber-300 border-amber-500 text-slate-950'
                        : 'bg-white border-slate-200 hover:border-blue-400 text-slate-900'
                    }`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              2. Escribe la palabra correcta (o la frase corregida):
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={errInput}
                onChange={(e) => setErrInput(e.target.value)}
                disabled={Boolean(errResult)}
                placeholder={`Ejemplo: ${currentErr.correctWord}`}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-base focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                disabled={Boolean(errResult)}
                onClick={() => {
                  errTimer.pause();
                  const normalizedInput = errInput.trim().toLowerCase();
                  const wordOk = errSelectedWord?.toLowerCase() === currentErr.wrongWord.toLowerCase();
                  const correctionOk =
                    normalizedInput === currentErr.correctWord.toLowerCase() ||
                    normalizedInput === currentErr.correctEs.toLowerCase();
                  const success = Boolean(wordOk && (correctionOk || normalizedInput === ''));
                  if (wordOk && correctionOk) {
                    setErrResult('ok');
                    playCorrectSound();
                    awardPlayer(activePlayer, 15, 30 - errTimer.seconds, true, currentErr.world);
                  } else if (success) {
                    setErrResult('ok');
                    playCorrectSound();
                    awardPlayer(activePlayer, 10, 30 - errTimer.seconds, true, currentErr.world);
                  } else {
                    setErrResult('bad');
                    playWrongSound();
                    awardPlayer(activePlayer, 0, 30 - errTimer.seconds, false, currentErr.world);
                  }
                }}
                className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl cursor-pointer"
              >
                Comprobar corrección
              </button>
            </div>
          </div>

          {errResult && (
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                errResult === 'ok' ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'
              }`}
            >
              <div className="font-bold text-slate-900">
                Frase correcta: «{currentErr.correctEs}»
              </div>
              <div className="text-sm text-slate-800">{currentErr.explanationHy}</div>
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => speakEs(currentErr.correctEs)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  Escuchar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrResult(null);
                    setErrInput('');
                    setErrSelectedWord(null);
                    if (errIdx + 1 >= Math.min(errorPool.length, roundsCount)) {
                      concludeMatch('¡Encuentra el error!');
                    } else {
                      setActivePlayer((p) => (p === 'razmik' ? 'gayane' : 'razmik'));
                      setErrIdx((i) => i + 1);
                      errTimer.reset(30);
                    }
                  }}
                  className="px-5 py-2 text-sm font-semibold bg-slate-900 text-white rounded-xl cursor-pointer"
                >
                  Siguiente frase →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 6: 🛒 ¡COMPRA MÁS INTELIGENTE! */}
      {/* ==================================================================== */}
      {gameId === 'compra_inteligente' && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Presupuesto máximo: 20,00 € · Jugando: {activePlayer === 'razmik' ? 'RAZMIK 🔵' : 'GAYANE 🩷'}
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">🛒 ¡Compra más inteligente!</h2>
            </div>
            <UniversalTimer
              mode="cronometro"
              initialSeconds={0}
              running={marketTimer.running}
              seconds={marketTimer.seconds}
              onStart={marketTimer.start}
              onPause={marketTimer.pause}
              onReset={() => marketTimer.reset(0)}
              onFinish={() => {
                marketTimer.pause();
                if (activePlayer === 'razmik') setRazmikTime((t) => t + marketTimer.seconds);
                else setGayaneTime((t) => t + marketTimer.seconds);
              }}
            />
          </div>

          {marketStage === 'shop' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Lista de la compra */}
              <div className="lg:col-span-4 bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="font-display font-bold text-slate-900">
                  Lista de {activePlayer === 'razmik' ? 'Razmik' : 'Gayane'}
                </div>
                <ul className="space-y-2 text-sm">
                  {activeList.items.map((req) => {
                    const inCart = activeCart[req.productId] || 0;
                    const done = inCart >= req.qty;
                    return (
                      <li
                        key={req.productId}
                        className={`p-2.5 rounded-lg border ${
                          done ? 'bg-emerald-100 border-emerald-400 text-emerald-950' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="font-semibold flex items-start gap-1.5">
                          <span>{done ? '✓' : '○'}</span>
                          <span>
                            <SpPhrase es={`${req.labelEs} (${inCart}/${req.qty})`} hy={req.labelHy} showAudio={false} />
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="pt-2 border-t border-emerald-200 font-mono-num text-lg font-bold">
                  Total carrito:{' '}
                  <span className={activeCartTotal > 20 ? 'text-red-600' : 'text-emerald-700'}>
                    {activeCartTotal.toFixed(2)} €
                  </span>{' '}
                  / 20.00 €
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const listComplete = activeList.items.every((it) => (activeCart[it.productId] || 0) >= it.qty);
                    if (listComplete && activeCartTotal <= 20) {
                      playCorrectSound();
                      awardPlayer(activePlayer, 15, marketTimer.seconds, true, 'supermercado');
                      setMarketStage('caja');
                    } else {
                      playWrongSound();
                    }
                  }}
                  className="w-full py-2.5 px-4 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Ir a la caja ahora →
                </button>
              </div>

              {/* Estanterías */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {MARKET_PRODUCTS.map((prod) => {
                  const qty = activeCart[prod.id] || 0;
                  return (
                    <div key={prod.id} className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between gap-2 bg-white">
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">{prod.icon}</span>
                        <span className="font-mono-num font-bold text-emerald-700">{prod.price.toFixed(2)} €</span>
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900">
                          <SpPhrase es={prod.nameEs} hy={prod.nameHy} showAudio={false} />
                        </div>
                        {prod.offerTextEs && (
                          <div className="text-xs font-bold text-amber-700 mt-0.5">{prod.offerTextEs}</div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveCart((c) => ({ ...c, [prod.id]: Math.max(0, (c[prod.id] || 0) - 1) }))
                          }
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono-num font-bold text-sm">{qty}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!marketTimer.running) marketTimer.start();
                            setActiveCart((c) => ({ ...c, [prod.id]: (c[prod.id] || 0) + 1 }));
                          }}
                          className="w-8 h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  Diálogo en la caja (Cajero y {activePlayer === 'razmik' ? 'Razmik' : 'Gayane'})
                </div>
                <p className="text-sm text-slate-700">
                  <SpPhrase
                    es={`Cajero: «Son ${activeCartTotal.toFixed(2)} euros. ¿Quiere una bolsa y paga con tarjeta?»`}
                    hy={`Գանձապահ. «Ընդամենը ${activeCartTotal.toFixed(2)} եվրո է: Տոպրակ ուզո՞ւմ եք և քարտո՞վ եք վճարում:»`}
                  />
                </p>
              </div>
              <OralEvaluator
                playerLabel={activePlayer === 'razmik' ? 'Razmik 🔵' : 'Gayane 🩷'}
                studentId={safeStudentId(activePlayer)}
                worldId="supermercado"
                gameId={gameId}
                questionEs={`Diálogo en la caja (${activeCartTotal.toFixed(2)} €)`}
                parentalConsentGranted={parentalConsentGranted}
                onParentalConsentGranted={onParentalConsentGranted}
                helperWords={['bolsa', '¿cuánto es en total?', 'tarjeta', 'recibo', 'gracias']}
                sampleAnswerEs="Sí, necesito una bolsa, por favor. ¿Puedo pagar con tarjeta? Muchas gracias."
                onAwardPoints={(pts) => {
                  awardPlayer(activePlayer, pts, marketTimer.seconds, pts > 0, 'supermercado');
                  if (activePlayer === 'razmik') {
                    setActivePlayer('gayane');
                    setMarketStage('shop');
                    marketTimer.reset(0);
                  } else {
                    void concludeMatch('¡Compra más inteligente!', razmikScore, gayaneScore + pts);
                  }
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 7: 🍕 ¡CAMARERO POR UN DÍA! */}
      {/* ==================================================================== */}
      {gameId === 'camarero_dia' && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                {restSwapped ? 'Gayane = Camarera · Razmik = Cliente' : 'Razmik = Camarero · Gayane = Clienta'}
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">🍕 ¡Camarero por un día!</h2>
            </div>
            <UniversalTimer
              mode="contrarreloj"
              initialSeconds={120}
              running={restTimer.running}
              seconds={restTimer.seconds}
              onStart={restTimer.start}
              onPause={restTimer.pause}
              onReset={() => restTimer.reset(120)}
              onFinish={() => {
                restTimer.pause();
                const spent = Math.max(1, 120 - restTimer.seconds);
                setRazmikTime((t) => t + spent);
                setGayaneTime((t) => t + spent);
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Carta del restaurante */}
            <div className="lg:col-span-7 bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-4">
              <div className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-600" />
                Carta de «El Sol Español»
              </div>
              {RESTAURANT_MENU.map((cat) => (
                <div key={cat.categoryEs} className="space-y-1.5">
                  <div className="text-xs font-bold text-orange-700">{cat.categoryEs}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.items.map((it) => (
                      <div key={it.es} className="bg-white border border-amber-200 rounded-lg p-2.5 flex justify-between gap-2 text-sm">
                        <SpPhrase es={it.es} hy={it.hy} />
                        <span className="font-mono-num font-bold text-slate-700 shrink-0">{it.price}€</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 6 pasos del diálogo */}
            <div className="lg:col-span-5 space-y-3">
              <div className="font-display font-bold text-slate-900">Los 6 pasos del diálogo (2 minutos):</div>
              <div className="space-y-2">
                {RESTAURANT_6_STEPS.map((st) => {
                  const done = restStepsDone.includes(st.step);
                  return (
                    <div
                      key={st.step}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between gap-2 ${
                        done ? 'bg-emerald-50 border-emerald-400 text-emerald-950' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="text-sm font-bold">
                        <SpPhrase es={`${st.step}. ${st.es}`} hy={st.hy} showAudio={false} />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setRestStepsDone((prev) =>
                            prev.includes(st.step) ? prev.filter((x) => x !== st.step) : [...prev, st.step]
                          )
                        }
                        aria-label={`Completar paso ${st.step}`}
                        className="p-1.5 rounded-lg hover:bg-emerald-100 cursor-pointer shrink-0"
                      >
                        <CheckCircle2 className={`w-5 h-5 ${done ? 'text-emerald-600' : 'text-slate-300'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRestSwapped((s) => !s);
                    setRestStepsDone([]);
                    restTimer.reset(120);
                  }}
                  className="px-4 py-2 text-sm font-semibold bg-amber-100 text-amber-900 rounded-xl hover:bg-amber-200 cursor-pointer"
                >
                  Cambiar papeles
                </button>
              </div>
            </div>
          </div>

          <OralEvaluator
            playerLabel="Evaluación del diálogo en restaurante"
            studentId={activeStudentRole}
            worldId="restaurante"
            gameId={gameId}
            questionEs="Diálogo completo en el restaurante (Camarero por un día)"
            parentalConsentGranted={parentalConsentGranted}
            onParentalConsentGranted={onParentalConsentGranted}
            helperWords={['mesa para dos', 'la carta', 'para mí', 'sin cebolla', 'la cuenta']}
            onAwardPoints={(pts) => {
              const stepBonus = restStepsDone.length * 3;
              awardPlayer('razmik', pts + stepBonus, 120 - restTimer.seconds, pts > 0, 'restaurante');
              awardPlayer('gayane', pts + stepBonus, 120 - restTimer.seconds, pts > 0, 'restaurante');
              void concludeMatch('¡Camarero por un día!', razmikScore + pts + stepBonus, gayaneScore + pts + stepBonus);
            }}
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 8: ✈️ ¡NO PIERDAS EL AVIÓN! */}
      {/* ==================================================================== */}
      {gameId === 'no_pierdas_avion' && currentZone && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Misión aeropuerto · Jugador: {activePlayer === 'razmik' ? 'RAZMIK 🔵' : 'GAYANE 🩷'}
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">✈️ ¡No pierdas el avión!</h2>
            </div>
            <UniversalTimer
              mode="contrarreloj"
              initialSeconds={120}
              running={aeroTimer.running}
              seconds={aeroTimer.seconds}
              onStart={aeroTimer.start}
              onPause={aeroTimer.pause}
              onReset={() => aeroTimer.reset(120)}
            />
          </div>

          {/* 5-Zone Airport Map Progress */}
          <div className="grid grid-cols-5 gap-2">
            {AIRPORT_MISSION_ZONES.map((z, idx) => (
              <div
                key={z.id}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold ${
                  idx < zoneIdx
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                    : idx === zoneIdx
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <Plane className="w-4 h-4 mx-auto mb-1" />
                Zona {z.id}
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl bg-sky-50 border border-sky-200 space-y-2">
            <div className="font-display text-xl font-bold text-slate-900">
              <SpPhrase es={currentZone.titleEs} hy={currentZone.titleHy} showAudio={false} />
            </div>
            <div className="text-base font-semibold text-slate-900 pt-1">
              <SpPhrase es={currentZone.eventEs} hy={currentZone.eventHy} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-bold text-slate-900">{currentZone.questionEs}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentZone.options.map((opt, idx) => {
                const picked = zoneChoice === idx;
                const isRight = idx === currentZone.correctIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={zoneChoice !== null}
                    onClick={() => {
                      if (!aeroTimer.running) aeroTimer.start();
                      setZoneChoice(idx);
                      if (isRight) {
                        playCorrectSound();
                        awardPlayer(activePlayer, 10, 0, true, 'aeropuerto');
                      } else {
                        playWrongSound();
                        awardPlayer(activePlayer, 0, 0, false, 'aeropuerto');
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-left text-sm font-medium cursor-pointer ${
                      zoneChoice !== null
                        ? isRight
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                          : picked
                            ? 'bg-red-100 border-red-400 text-red-900'
                            : 'bg-white border-slate-200 text-slate-400'
                        : 'bg-white border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {zoneChoice !== null && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-sm">
                <strong>Reto oral obligatorio:</strong> <SpPhrase es={currentZone.oralTaskEs} hy={currentZone.oralTaskHy} />
              </div>
              <OralEvaluator
                playerLabel={activePlayer === 'razmik' ? 'Razmik 🔵' : 'Gayane 🩷'}
                studentId={safeStudentId(activePlayer)}
                worldId="aeropuerto"
                gameId={gameId}
                questionEs={currentZone.oralTaskEs}
                parentalConsentGranted={parentalConsentGranted}
                onParentalConsentGranted={onParentalConsentGranted}
                onAwardPoints={(pts) => {
                  awardPlayer(activePlayer, pts, 0, pts > 0, 'aeropuerto');
                  setZoneChoice(null);
                  if (zoneIdx + 1 >= AIRPORT_MISSION_ZONES.length) {
                    const spent = 120 - aeroTimer.seconds;
                    if (activePlayer === 'razmik') {
                      setRazmikTime((t) => t + spent);
                      setActivePlayer('gayane');
                      setZoneIdx(0);
                      aeroTimer.reset(120);
                    } else {
                      void concludeMatch('¡No pierdas el avión!', razmikScore, gayaneScore + pts, razmikTime, gayaneTime + spent);
                    }
                  } else {
                    setZoneIdx((i) => i + 1);
                  }
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
