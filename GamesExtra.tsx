import React, { useMemo, useRef, useState } from 'react';
import { Volume2, Eye, EyeOff, RotateCw, RotateCcw, Trophy, Flame, Lock, Image as ImageIcon, Shuffle, Layers, Sparkles, Clock, Send, CheckCircle2, Loader2 } from 'lucide-react';
import {
  ALL_WORLDS,
  DIALOGUE_STARTERS,
  DRAW_CARDS_DECK,
  DrawCard,
  GRAND_FINAL_STEPS,
  HOTEL_MYSTERY_SCENARIOS,
  SECRET_MISSIONS,
  WHEEL_SECTORS,
  WORLDS_MAP,
} from './dataGames';
import { playCorrectSound, playVictorySound, playWrongSound, speakEs } from './audio';
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
  UserRole,
  WorldId,
} from './types';

interface GamesExtraProps {
  gameId: GameId;
  worldFilter: WorldId | 'todos';
  difficulty: DifficultyLevel;
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

export const GamesExtra: React.FC<GamesExtraProps> = ({
  gameId,
  worldFilter,
  difficulty,
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

  const awardPlayer = (player: PlayerId, pts: number, sec = 0, isCorrect = true, wId?: WorldId) => {
    if (isCorrect) matchCorrectRef.current += 1;
    else matchIncorrectRef.current += 1;

    if (player === 'razmik') {
      setRazmikScore((s) => s + pts);
      setRazmikTime((t) => t + sec);
    } else {
      setGayaneScore((s) => s + pts);
      setGayaneTime((t) => t + sec);
    }
    onRecordAnswer(player, isCorrect, wId);
  };

  const concludeMatch = async (
    titleEs: string,
    rAdd = 0,
    gAdd = 0,
    overrideDurationSec?: number,
    overrideTotalQuestions?: number
  ) => {
    const rFinal = razmikScore + rAdd;
    const gFinal = gayaneScore + gAdd;
    const winner: PlayerId | 'empate' =
      rFinal > gFinal ? 'razmik' : gFinal > rFinal ? 'gayane' : 'empate';
    playVictorySound();
    setShowWinnerBanner(true);

    const answeredTotal = matchCorrectRef.current + matchIncorrectRef.current;
    const totalQuestions = overrideTotalQuestions ?? Math.max(1, answeredTotal);
    const correctCount = matchCorrectRef.current;
    const incorrectCount = Math.max(0, totalQuestions - correctCount);
    const durationSec = overrideDurationSec ?? Math.max(1, razmikTime + gayaneTime);

    const sessionId = await onFinishMatch(
      {
        gameId,
        gameTitleEs: titleEs,
        world: worldFilter,
        razmikScore: rFinal,
        gayaneScore: gFinal,
        razmikTimeSec: razmikTime,
        gayaneTimeSec: gayaneTime,
        winner,
      },
      {
        totalQuestions,
        correctCount,
        incorrectCount,
        durationSec,
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
  // GAME 9: 🏨 ¡HOTEL MISTERIOSO!
  // ============================================================================
  const [hmIdx, setHmIdx] = useState(0);
  const hmTimer = useGameTimer('cronometro', 0);
  const currentHm = HOTEL_MYSTERY_SCENARIOS[hmIdx % HOTEL_MYSTERY_SCENARIOS.length];

  // ============================================================================
  // GAME 10: 💬 ¡CONTINÚA EL DIÁLOGO!
  // ============================================================================
  const starterPool = useMemo(
    () => (worldFilter === 'todos' ? DIALOGUE_STARTERS : DIALOGUE_STARTERS.filter((s) => s.world === worldFilter)),
    [worldFilter]
  );
  const [cdIdx, setCdIdx] = useState(0);
  const currentStarter = starterPool[cdIdx % starterPool.length] || DIALOGUE_STARTERS[0];
  const [dialogueTurns, setDialogueTurns] = useState<{ speaker: PlayerId; text: string }[]>([
    { speaker: 'razmik', text: currentStarter.firstLineEs },
  ]);
  const [turnInput, setTurnInput] = useState('');
  const [cdLevel, setCdLevel] = useState<DifficultyLevel>(difficulty);
  const cdTimer = useGameTimer('dialogo', 0);

  // ============================================================================
  // GAME 11: 🎲 ¡SORPRESA! (Ruleta)
  // ============================================================================
  const [wheelDeg, setWheelDeg] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pickedSectorIdx, setPickedSectorIdx] = useState<number | null>(null);
  const [pickedTaskIdx, setPickedTaskIdx] = useState(0);
  const activeSector = pickedSectorIdx !== null ? WHEEL_SECTORS[pickedSectorIdx] : null;
  const activeWheelTask = activeSector ? activeSector.tasks[pickedTaskIdx % activeSector.tasks.length] : null;
  const wheelTimer = useGameTimer('contrarreloj', activeWheelTask?.seconds || 30);

  const spinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    const chosen = Math.floor(Math.random() * WHEEL_SECTORS.length);
    const sectorAngle = 360 / WHEEL_SECTORS.length;
    const extraSpins = 360 * 4;
    const targetRotation = wheelDeg + extraSpins + (360 - chosen * sectorAngle);
    setWheelDeg(targetRotation);
    window.setTimeout(() => {
      setSpinning(false);
      setPickedSectorIdx(chosen);
      setPickedTaskIdx((t) => t + 1);
      const sec = WHEEL_SECTORS[chosen].tasks[0]?.seconds || 30;
      wheelTimer.reset(sec);
      wheelTimer.start();
    }, 1500);
  };

  // ============================================================================
  // GAME 12: 🏆 ¡LA GRAN FINAL! (20 desafíos)
  // ============================================================================
  const [gfIdx, setGfIdx] = useState(0);
  const [gfPicked, setGfPicked] = useState<number | null>(null);
  const gfTimer = useGameTimer('contrarreloj', 45);
  const currentGf = GRAND_FINAL_STEPS[gfIdx % GRAND_FINAL_STEPS.length];

  // ============================================================================
  // GAME 13: 🎤 ¡HABLA SIN PARAR!
  // ============================================================================
  const speakPromptsPool = useMemo(
    () => (worldFilter === 'todos' ? ALL_WORLDS.flatMap((w) => w.speakingPrompts) : WORLDS_MAP[worldFilter].speakingPrompts),
    [worldFilter]
  );
  const [hspIdx, setHspIdx] = useState(0);
  const [hspDuration, setHspDuration] = useState<30 | 45 | 60>(timerSeconds === 60 ? 60 : timerSeconds === 30 ? 30 : 45);
  const hspTimer = useGameTimer('contrarreloj', hspDuration);
  const currentHsp = speakPromptsPool[hspIdx % speakPromptsPool.length];

  // ============================================================================
  // GAME 14: 🔥 ¡PREGUNTAS EN CADENA!
  // ============================================================================
  const [chainTurns, setChainTurns] = useState<{ player: PlayerId; text: string }[]>([]);
  const [chainDraft, setChainDraft] = useState('');
  const chainTimer = useGameTimer('contrarreloj', 120);

  // ============================================================================
  // GAME 15: 🔐 ¡MISIÓN SECRETA!
  // ============================================================================
  const [smIdx, setSmIdx] = useState(0);
  const [visibleSecretCard, setVisibleSecretCard] = useState<'none' | 'razmik' | 'gayane'>('none');
  const [smPicked, setSmPicked] = useState<number | null>(null);
  const smTimer = useGameTimer('dialogo', 0);
  const currentSm = SECRET_MISSIONS[smIdx % SECRET_MISSIONS.length];

  // ============================================================================
  // GAME 16: 🖼️ ¡MIRA Y EXPLICA!
  // ============================================================================
  const [miraWorldIdx, setMiraWorldIdx] = useState(0);
  const [miraQuestionsCount, setMiraQuestionsCount] = useState(0);
  const [miraSwapped, setMiraSwapped] = useState(false);
  const miraTimer = useGameTimer('contrarreloj', 60);
  const currentMiraWorld = ALL_WORLDS[miraWorldIdx % ALL_WORLDS.length];

  // ============================================================================
  // GAME 17: 🃏 ¡ROBA LA CARTA! (30 cartas · 2 minutos)
  // ============================================================================
  const shuffleCards = (list: DrawCard[]) => {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const buildShuffledDeck = (size: number): DrawCard[] => {
    if (worldFilter === 'todos') {
      return shuffleCards(DRAW_CARDS_DECK).slice(0, Math.min(size, DRAW_CARDS_DECK.length));
    }
    const worldOnly = shuffleCards(DRAW_CARDS_DECK.filter((c) => c.world === worldFilter));
    const others = shuffleCards(DRAW_CARDS_DECK.filter((c) => c.world !== worldFilter));
    const combined = [...worldOnly, ...others];
    return combined.slice(0, Math.min(size, combined.length));
  };

  const [deckMode, setDeckMode] = useState<'competencia' | 'calentamiento'>('competencia');
  const [deckSize, setDeckSize] = useState<12 | 20 | 30>(30);
  const [cardDeck, setCardDeck] = useState<DrawCard[]>(() => buildShuffledDeck(30));
  const [drawnCard, setDrawnCard] = useState<DrawCard | null>(null);
  const [cardsCompleted, setCardsCompleted] = useState(0);
  const [cardOptionPicked, setCardOptionPicked] = useState<number | null>(null);
  const [rDeckStreak, setRDeckStreak] = useState(0);
  const [gDeckStreak, setGDeckStreak] = useState(0);
  const deckTimerLimit = drawnCard?.cardType === 'duelo' ? 45 : drawnCard?.cardType === 'oral' ? 30 : 20;
  const deckTimer = useGameTimer('contrarreloj', 20);
  const deckRoundTimer = useGameTimer('contrarreloj', 120, () => {
    if (gameId === 'roba_carta' && !showWinnerBanner) {
      deckTimer.pause();
      setDrawnCard(null);
      void concludeMatch('¡Roba la carta! (30 cartas · 2 min)', 0, 0, 120, deckSize);
    }
  });

  const resetDeckGame = (newSize = deckSize) => {
    setDeckSize(newSize);
    setCardDeck(buildShuffledDeck(newSize));
    setDrawnCard(null);
    setCardsCompleted(0);
    setCardOptionPicked(null);
    setRDeckStreak(0);
    setGDeckStreak(0);
    deckTimer.reset(20);
    deckRoundTimer.reset(120);
  };

  const drawNextCardFromDeck = () => {
    if (!deckRoundTimer.running && cardsCompleted === 0) {
      deckRoundTimer.start();
    }
    if (cardDeck.length === 0) {
      deckRoundTimer.pause();
      void concludeMatch('¡Roba la carta! (30 cartas · 2 min)', 0, 0, Math.max(1, 120 - deckRoundTimer.seconds), deckSize);
      return;
    }
    const [next, ...rest] = cardDeck;
    setCardDeck(rest);
    setDrawnCard(next);
    setCardOptionPicked(null);
    playCorrectSound();
    const sec = next.cardType === 'duelo' ? 45 : next.cardType === 'oral' ? 30 : 20;
    deckTimer.reset(sec);
    deckTimer.start();
  };

  const finishCurrentCardTurn = () => {
    const nextDone = cardsCompleted + 1;
    setCardsCompleted(nextDone);
    setDrawnCard(null);
    setCardOptionPicked(null);
    deckTimer.pause();
    if (cardDeck.length === 0 || nextDone >= deckSize) {
      deckRoundTimer.pause();
      void concludeMatch('¡Roba la carta! (30 cartas · 2 min)', 0, 0, Math.max(1, 120 - deckRoundTimer.seconds), deckSize);
    } else {
      setActivePlayer((p) => (p === 'razmik' ? 'gayane' : 'razmik'));
    }
  };

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
    setHmIdx(0);
    hmTimer.reset(0);
    setCdIdx(0);
    setDialogueTurns([{ speaker: 'razmik', text: starterPool[0]?.firstLineEs || DIALOGUE_STARTERS[0].firstLineEs }]);
    setTurnInput('');
    cdTimer.reset(0);
    setPickedSectorIdx(null);
    wheelTimer.reset(30);
    setGfIdx(0);
    setGfPicked(null);
    gfTimer.reset(45);
    setHspIdx(0);
    hspTimer.reset(hspDuration);
    setChainTurns([]);
    setChainDraft('');
    chainTimer.reset(120);
    setSmIdx(0);
    setVisibleSecretCard('none');
    setSmPicked(null);
    smTimer.reset(0);
    setMiraWorldIdx(0);
    setMiraQuestionsCount(0);
    setMiraSwapped(false);
    miraTimer.reset(60);
    resetDeckGame(deckSize);
  };

  return (
    <div className="space-y-6">
      <ConfettiOverlay active={showWinnerBanner} />

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

      <DualScoreHud
        activePlayer={activePlayer}
        razmikRoundPoints={razmikScore}
        gayaneRoundPoints={gayaneScore}
        razmikRoundTime={razmikTime}
        gayaneRoundTime={gayaneTime}
        razmikTotal={storage.razmik}
        gayaneTotal={storage.gayane}
      />

      {showWinnerBanner && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-6 text-center space-y-4">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="font-display text-3xl font-extrabold text-slate-900">
            {razmikScore > gayaneScore
              ? '¡RAZMIK GANA ESTA RONDA! 🔵'
              : gayaneScore > razmikScore
                ? '¡GAYANE GANA ESTA RONDA! 🩷'
                : '¡EMPATE FANTÁSTICO! 🏆'}
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
      {/* GAME 9: 🏨 ¡HOTEL MISTERIOSO! */}
      {/* ==================================================================== */}
      {gameId === 'hotel_misterioso' && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Escenario {hmIdx + 1} de {HOTEL_MYSTERY_SCENARIOS.length} · Cliente: {activePlayer === 'razmik' ? 'RAZMIK 🔵' : 'GAYANE 🩷'} (el otro es Recepcionista)
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">🏨 ¡Hotel misterioso!</h2>
            </div>
            <UniversalTimer
              mode="cronometro"
              initialSeconds={0}
              running={hmTimer.running}
              seconds={hmTimer.seconds}
              onStart={hmTimer.start}
              onPause={hmTimer.pause}
              onReset={() => hmTimer.reset(0)}
              onFinish={() => {
                hmTimer.pause();
                if (activePlayer === 'razmik') setRazmikTime((t) => t + hmTimer.seconds);
                else setGayaneTime((t) => t + hmTimer.seconds);
              }}
            />
          </div>

          <div className="p-5 rounded-xl bg-violet-50 border border-violet-200 space-y-2">
            <div className="text-xs font-bold text-violet-700">¡Imprevisto en el hotel!</div>
            <div className="text-xl font-bold text-slate-900">
              <SpPhrase es={currentHm.situationEs} hy={currentHm.situationHy} />
            </div>
            {difficulty <= 2 && (
              <div className="text-xs text-slate-600 pt-1">
                Palabras clave: <strong>{currentHm.hintWords.join(' · ')}</strong>
              </div>
            )}
          </div>

          <OralEvaluator
            playerLabel={`${activePlayer === 'razmik' ? 'Razmik (Huésped)' : 'Gayane (Huésped)'} y Recepcionista`}
            studentId={safeStudentId(activePlayer)}
            worldId="hotel"
            gameId={gameId}
            questionEs={currentHm.situationEs}
            parentalConsentGranted={parentalConsentGranted}
            onParentalConsentGranted={onParentalConsentGranted}
            helperWords={currentHm.hintWords}
            sampleAnswerEs={`${currentHm.sampleGuestEs} / ${currentHm.sampleReceptionistEs}`}
            onAwardPoints={(pts) => {
              awardPlayer(activePlayer, pts, hmTimer.seconds, pts > 0, 'hotel');
              if (hmIdx + 1 >= 6) {
                void concludeMatch('¡Hotel misterioso!', activePlayer === 'razmik' ? pts : 0, activePlayer === 'gayane' ? pts : 0);
              } else {
                setActivePlayer((p) => (p === 'razmik' ? 'gayane' : 'razmik'));
                setHmIdx((i) => i + 1);
                hmTimer.reset(0);
              }
            }}
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 10: 💬 ¡CONTINÚA EL DIÁLOGO! */}
      {/* ==================================================================== */}
      {gameId === 'continua_dialogo' && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Turnos: {dialogueTurns.length}/{currentStarter.targetTurns} · {currentStarter.titleEs}
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">💬 ¡Continúa el diálogo!</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {([1, 2, 3] as DifficultyLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCdLevel(lvl)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                      cdLevel === lvl ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Nivel {lvl}
                  </button>
                ))}
              </div>
              <UniversalTimer
                mode="dialogo"
                initialSeconds={0}
                running={cdTimer.running}
                seconds={cdTimer.seconds}
                onStart={cdTimer.start}
                onPause={cdTimer.pause}
                onReset={() => cdTimer.reset(0)}
                onFinish={() => {
                  cdTimer.pause();
                  setRazmikTime((t) => t + cdTimer.seconds);
                  setGayaneTime((t) => t + cdTimer.seconds);
                }}
              />
            </div>
          </div>

          {/* Conversation thread */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl">
            {dialogueTurns.map((t, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border ${
                  t.speaker === 'razmik' ? 'bg-blue-50 border-blue-200 mr-8' : 'bg-pink-50 border-pink-200 ml-8'
                }`}
              >
                <div className="text-xs font-bold mb-0.5 text-slate-600">
                  {t.speaker === 'razmik' ? 'Razmik 🔵' : 'Gayane 🩷'}
                </div>
                <div className="text-sm font-medium text-slate-900 flex items-center justify-between gap-2">
                  <span>{t.text}</span>
                  <button type="button" onClick={() => speakEs(t.text)} className="p-1 rounded hover:bg-white cursor-pointer">
                    <Volume2 className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Turn Input */}
          <div className="space-y-3">
            <div className="text-sm font-bold text-slate-800">
              Ahora responde {activePlayer === 'razmik' ? 'RAZMIK 🔵' : 'GAYANE 🩷'}:
            </div>

            {cdLevel === 1 && dialogueTurns.length < 4 && (
              <div className="flex flex-wrap gap-2">
                {currentStarter.suggestedContinuations.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTurnInput(sug)}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg text-blue-900 cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={turnInput}
                onChange={(e) => setTurnInput(e.target.value)}
                placeholder="Di tu respuesta en español y escríbela aquí para continuar..."
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!turnInput.trim()) return;
                  if (!cdTimer.running) cdTimer.start();
                  speakEs(turnInput.trim());
                  setDialogueTurns((prev) => [...prev, { speaker: activePlayer, text: turnInput.trim() }]);
                  setTurnInput('');
                  setActivePlayer((p) => (p === 'razmik' ? 'gayane' : 'razmik'));
                }}
                className="px-5 py-2.5 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Añadir frase
              </button>
            </div>
          </div>

          {dialogueTurns.length >= 6 && (
            <OralEvaluator
              playerLabel="Validar diálogo completo (8–10 turnos)"
              studentId={activeStudentRole}
              worldId={currentStarter.world}
              gameId={gameId}
              questionEs={currentStarter.titleEs}
              parentalConsentGranted={parentalConsentGranted}
              onParentalConsentGranted={onParentalConsentGranted}
              onAwardPoints={(pts) => {
                awardPlayer('razmik', pts, cdTimer.seconds, pts > 0, currentStarter.world);
                awardPlayer('gayane', pts, cdTimer.seconds, pts > 0, currentStarter.world);
                void concludeMatch('¡Continúa el diálogo!', pts, pts);
              }}
            />
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                const nextIdx = cdIdx + 1;
                setCdIdx(nextIdx);
                const nextStarter = starterPool[nextIdx % starterPool.length] || DIALOGUE_STARTERS[0];
                setDialogueTurns([{ speaker: 'razmik', text: nextStarter.firstLineEs }]);
                setActivePlayer('gayane');
              }}
              className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
            >
              Cambiar tema del diálogo
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 11: 🎲 ¡SORPRESA! (Ruleta) */}
      {/* ==================================================================== */}
      {gameId === 'sorpresa' && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Turno de {activePlayer === 'razmik' ? 'RAZMIK 🔵' : 'GAYANE 🩷'}
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">🎲 ¡Sorpresa! — La Ruleta Española</h2>
            </div>
            <UniversalTimer
              mode="contrarreloj"
              initialSeconds={activeWheelTask?.seconds || 30}
              running={wheelTimer.running}
              seconds={wheelTimer.seconds}
              onStart={wheelTimer.start}
              onPause={wheelTimer.pause}
              onReset={() => wheelTimer.reset(activeWheelTask?.seconds || 30)}
              onFinish={() => {
                wheelTimer.pause();
                const spent = Math.max(1, (activeWheelTask?.seconds || 30) - wheelTimer.seconds);
                if (activePlayer === 'razmik') setRazmikTime((t) => t + spent);
                else setGayaneTime((t) => t + spent);
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 flex flex-col items-center gap-4">
              <div className="relative w-64 h-64">
                {/* Pointer */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-slate-900" />
                <div
                  className="w-64 h-64 rounded-full border-4 border-slate-900 shadow-lg relative overflow-hidden"
                  style={{
                    transform: `rotate(${wheelDeg}deg)`,
                    transition: 'transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: `conic-gradient(${WHEEL_SECTORS.map(
                      (s, i) => `${s.color} ${(i * 100) / WHEEL_SECTORS.length}% ${((i + 1) * 100) / WHEEL_SECTORS.length}%`
                    ).join(', ')})`,
                  }}
                >
                  {WHEEL_SECTORS.map((s, i) => {
                    const angle = i * (360 / WHEEL_SECTORS.length) + 22.5;
                    return (
                      <div
                        key={s.id}
                        style={{ transform: `rotate(${angle}deg)` }}
                        className="absolute inset-0 flex justify-center pt-4 pointer-events-none"
                      >
                        <span className="text-[10px] font-bold text-white drop-shadow max-w-[64px] text-center leading-tight">
                          {s.labelEs}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={spinWheel}
                disabled={spinning}
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow cursor-pointer disabled:opacity-60"
              >
                <RotateCw className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
                {spinning ? 'Girando...' : '¡Girar la ruleta!'}
              </button>
            </div>

            <div className="lg:col-span-7 space-y-4">
              {activeWheelTask && activeSector ? (
                <>
                  <div className="p-5 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
                    <div className="text-xs font-bold text-amber-800">
                      Sector: {activeSector.labelEs} · Tiempo: {activeWheelTask.seconds}s
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      <SpPhrase es={activeWheelTask.es} hy={activeWheelTask.hy} />
                    </div>
                  </div>

                  <OralEvaluator
                    playerLabel={activePlayer === 'razmik' ? 'Razmik 🔵' : 'Gayane 🩷'}
                    studentId={safeStudentId(activePlayer)}
                    worldId={worldFilter}
                    gameId={gameId}
                    questionEs={activeWheelTask.es}
                    parentalConsentGranted={parentalConsentGranted}
                    onParentalConsentGranted={onParentalConsentGranted}
                    onAwardPoints={(pts) => {
                      awardPlayer(activePlayer, pts, activeWheelTask.seconds - wheelTimer.seconds, pts > 0);
                      if (razmikScore + gayaneScore + pts >= 40) {
                        void concludeMatch('¡Sorpresa!', activePlayer === 'razmik' ? pts : 0, activePlayer === 'gayane' ? pts : 0);
                      } else {
                        setActivePlayer((p) => (p === 'razmik' ? 'gayane' : 'razmik'));
                        setPickedSectorIdx(null);
                      }
                    }}
                  />
                </>
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                  Pulsa «¡Girar la ruleta!» para recibir un reto sorpresa.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 12: 🏆 ¡LA GRAN FINAL! (20 desafíos) */}
      {/* ==================================================================== */}
      {gameId === 'gran_final' && currentGf && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Desafío {gfIdx + 1} de {GRAND_FINAL_STEPS.length} · {WORLDS_MAP[currentGf.world].icon} {WORLDS_MAP[currentGf.world].nameEs} · Turno: {activePlayer === 'razmik' ? 'RAZMIK 🔵' : 'GAYANE 🩷'}
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">🏆 ¡La Gran Final! — Viaje por España</h2>
            </div>
            <UniversalTimer
              mode="contrarreloj"
              initialSeconds={45}
              running={gfTimer.running}
              seconds={gfTimer.seconds}
              onStart={gfTimer.start}
              onPause={gfTimer.pause}
              onReset={() => gfTimer.reset(45)}
            />
          </div>

          {/* 20-step progress bar */}
          <div className="grid grid-cols-10 sm:grid-cols-20 gap-1">
            {GRAND_FINAL_STEPS.map((st, idx) => (
              <div
                key={st.step}
                className={`h-2.5 rounded-full ${
                  idx < gfIdx ? 'bg-emerald-500' : idx === gfIdx ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-lg font-bold text-slate-900">
              <SpPhrase es={currentGf.promptEs} hy={currentGf.promptHy} />
            </div>
            {currentGf.type === 'listening' && currentGf.audioEs && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => speakEs(currentGf.audioEs!, false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  Escuchar audio
                </button>
                <button
                  type="button"
                  onClick={() => speakEs(currentGf.audioEs!, true)}
                  className="px-3 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-xl cursor-pointer"
                >
                  Más despacio
                </button>
              </div>
            )}
          </div>

          {currentGf.type !== 'speaking' && currentGf.options ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentGf.options.map((opt, idx) => {
                  const picked = gfPicked === idx;
                  const isRight = idx === currentGf.correctIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={gfPicked !== null}
                      onClick={() => {
                        if (!gfTimer.running) gfTimer.start();
                        gfTimer.pause();
                        setGfPicked(idx);
                        if (isRight) {
                          playCorrectSound();
                          awardPlayer(activePlayer, 15, 45 - gfTimer.seconds, true, currentGf.world);
                        } else {
                          playWrongSound();
                          awardPlayer(activePlayer, 0, 45 - gfTimer.seconds, false, currentGf.world);
                        }
                      }}
                      className={`p-4 rounded-xl border text-left font-medium cursor-pointer ${
                        gfPicked !== null
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

              {gfPicked !== null && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-slate-800">{currentGf.explanationHy}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setGfPicked(null);
                      if (gfIdx + 1 >= GRAND_FINAL_STEPS.length) {
                        concludeMatch('¡La Gran Final!');
                      } else {
                        setActivePlayer((p) => (p === 'razmik' ? 'gayane' : 'razmik'));
                        setGfIdx((i) => i + 1);
                        gfTimer.reset(45);
                      }
                    }}
                    className="px-5 py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-xl cursor-pointer"
                  >
                    {gfIdx + 1 >= GRAND_FINAL_STEPS.length ? 'Ver ganador final 🏆' : 'Siguiente etapa →'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <OralEvaluator
              playerLabel={activePlayer === 'razmik' ? 'Razmik 🔵' : 'Gayane 🩷'}
              studentId={safeStudentId(activePlayer)}
              worldId={currentGf.world}
              gameId={gameId}
              questionEs={currentGf.promptEs}
              parentalConsentGranted={parentalConsentGranted}
              onParentalConsentGranted={onParentalConsentGranted}
              helperWords={currentGf.helperWords}
              onAwardPoints={(pts) => {
                awardPlayer(activePlayer, pts, 45 - gfTimer.seconds, pts > 0, currentGf.world);
                if (gfIdx + 1 >= GRAND_FINAL_STEPS.length) {
                  concludeMatch('¡La Gran Final!', activePlayer === 'razmik' ? pts : 0, activePlayer === 'gayane' ? pts : 0);
                } else {
                  setActivePlayer((p) => (p === 'razmik' ? 'gayane' : 'razmik'));
                  setGfIdx((i) => i + 1);
                  gfTimer.reset(45);
                }
              }}
            />
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 13: 🎤 ¡HABLA SIN PARAR! */}
      {/* ==================================================================== */}
      {gameId === 'habla_sin_parar' && currentHsp && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Orador actual: {activePlayer === 'razmik' ? 'RAZMIK 🔵' : 'GAYANE 🩷'}
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">🎤 ¡Habla sin parar!</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {([30, 45, 60] as const).map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setHspDuration(sec);
                      hspTimer.reset(sec);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                      hspDuration === sec ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
              <UniversalTimer
                mode="contrarreloj"
                initialSeconds={hspDuration}
                running={hspTimer.running}
                seconds={hspTimer.seconds}
                onStart={hspTimer.start}
                onPause={hspTimer.pause}
                onReset={() => hspTimer.reset(hspDuration)}
                onFinish={() => {
                  hspTimer.pause();
                  const spent = Math.max(1, hspDuration - hspTimer.seconds);
                  if (activePlayer === 'razmik') setRazmikTime((t) => t + spent);
                  else setGayaneTime((t) => t + spent);
                }}
              />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
            <div className="text-xl font-bold text-slate-900">
              <SpPhrase es={currentHsp.promptEs} hy={currentHsp.promptHy} />
            </div>
            <div className="text-sm text-slate-700">
              Palabras de apoyo (sin frases completas): <strong>{currentHsp.helperWords.join(' · ')}</strong>
            </div>
          </div>

          <OralEvaluator
            playerLabel={activePlayer === 'razmik' ? 'Razmik 🔵' : 'Gayane 🩷'}
            studentId={safeStudentId(activePlayer)}
            worldId={currentHsp.world}
            gameId={gameId}
            questionEs={currentHsp.promptEs}
            parentalConsentGranted={parentalConsentGranted}
            onParentalConsentGranted={onParentalConsentGranted}
            helperWords={currentHsp.helperWords}
            sampleAnswerEs={currentHsp.sampleEs}
            onAwardPoints={(pts) => {
              awardPlayer(activePlayer, pts, hspDuration - hspTimer.seconds, pts > 0, currentHsp.world);
              if (activePlayer === 'razmik') {
                setActivePlayer('gayane');
                setHspIdx((i) => i + 1);
                hspTimer.reset(hspDuration);
              } else {
                concludeMatch('¡Habla sin parar!', 0, pts);
              }
            }}
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 14: 🔥 ¡PREGUNTAS EN CADENA! */}
      {/* ==================================================================== */}
      {gameId === 'preguntas_cadena' && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Cadena de 2 minutos · Turnos completados: {chainTurns.length}
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-600" />
                ¡Preguntas en cadena!
              </h2>
            </div>
            <UniversalTimer
              mode="contrarreloj"
              initialSeconds={120}
              running={chainTimer.running}
              seconds={chainTimer.seconds}
              onStart={chainTimer.start}
              onPause={chainTimer.pause}
              onReset={() => chainTimer.reset(120)}
              onFinish={() => {
                chainTimer.pause();
                concludeMatch('¡Preguntas en cadena!');
              }}
            />
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-slate-800 space-y-1">
            <div>
              <strong>Regla:</strong> Cada jugador responde con una frase completa Y hace inmediatamente una pregunta nueva en español.
            </div>
            <div className="text-xs text-slate-600">
              Ejemplo: «Quiero una pizza. ¿Y tú qué prefieres?» → «Prefiero pescado. ¿Qué quieres beber?»
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-3">
            {chainTurns.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-4">
                ¡Empezad la cadena! Razmik hace la primera pregunta en español.
              </div>
            ) : (
              chainTurns.map((ct, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-sm ${
                    ct.player === 'razmik' ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200'
                  }`}
                >
                  <strong className="mr-2">{ct.player === 'razmik' ? 'Razmik 🔵:' : 'Gayane 🩷:'}</strong>
                  {ct.text}
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={chainDraft}
              onChange={(e) => setChainDraft(e.target.value)}
              placeholder={`Respuesta + pregunta de ${activePlayer === 'razmik' ? 'Razmik' : 'Gayane'}...`}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                if (!chainTimer.running) chainTimer.start();
                const txt = chainDraft.trim() || `Turno oral #${chainTurns.length + 1} completado`;
                setChainTurns((prev) => [...prev, { player: activePlayer, text: txt }]);
                setChainDraft('');
                playCorrectSound();
                awardPlayer(activePlayer, 10, 0, true);
                setActivePlayer((p) => (p === 'razmik' ? 'gayane' : 'razmik'));
              }}
              className="px-5 py-2.5 text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 rounded-xl cursor-pointer"
            >
              Registrar turno (+10 pts)
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                chainTimer.pause();
                concludeMatch('¡Preguntas en cadena!');
              }}
              className="px-5 py-2.5 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Finalizar cadena y ver ganador
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 15: 🔐 ¡MISIÓN SECRETA! */}
      {/* ==================================================================== */}
      {gameId === 'mision_secreta' && currentSm && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">Cooperación secreta · Misión {smIdx + 1}</div>
              <h2 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-6 h-6 text-violet-600" />
                ¡Misión secreta! — {currentSm.titleEs}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                <SpPhrase es={currentSm.goalEs} hy={currentSm.goalHy} />
              </p>
            </div>
            <UniversalTimer
              mode="dialogo"
              initialSeconds={0}
              running={smTimer.running}
              seconds={smTimer.seconds}
              onStart={smTimer.start}
              onPause={smTimer.pause}
              onReset={() => smTimer.reset(0)}
              onFinish={() => {
                smTimer.pause();
                setRazmikTime((t) => t + smTimer.seconds);
                setGayaneTime((t) => t + smTimer.seconds);
              }}
            />
          </div>

          {/* Privacy switches: NEVER show both cards at the same time */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                if (!smTimer.running) smTimer.start();
                setVisibleSecretCard((v) => (v === 'razmik' ? 'none' : 'razmik'));
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl cursor-pointer ${
                visibleSecretCard === 'razmik' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {visibleSecretCard === 'razmik' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {visibleSecretCard === 'razmik' ? 'Ocultar tarjeta de Razmik' : 'Solo Razmik: ver mi tarjeta'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!smTimer.running) smTimer.start();
                setVisibleSecretCard((v) => (v === 'gayane' ? 'none' : 'gayane'));
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl cursor-pointer ${
                visibleSecretCard === 'gayane' ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-800 border border-pink-200'
              }`}
            >
              {visibleSecretCard === 'gayane' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {visibleSecretCard === 'gayane' ? 'Ocultar tarjeta de Gayane' : 'Solo Gayane: ver mi tarjeta'}
            </button>
          </div>

          {visibleSecretCard === 'razmik' && (
            <div className="p-5 rounded-xl bg-blue-50 border-2 border-blue-400 space-y-3">
              <div className="font-display font-bold text-lg text-blue-900">{currentSm.razmikCard.titleEs}</div>
              <ul className="list-disc pl-5 text-sm text-slate-800 space-y-1">
                {currentSm.razmikCard.factsEs.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <div className="text-xs font-bold text-blue-800 pt-2">Preguntas que debes hacer a Gayane:</div>
              <ul className="list-disc pl-5 text-sm text-blue-900 space-y-1">
                {currentSm.razmikCard.questionsToAskEs.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {visibleSecretCard === 'gayane' && (
            <div className="p-5 rounded-xl bg-pink-50 border-2 border-pink-400 space-y-3">
              <div className="font-display font-bold text-lg text-pink-900">{currentSm.gayaneCard.titleEs}</div>
              <ul className="list-disc pl-5 text-sm text-slate-800 space-y-1">
                {currentSm.gayaneCard.factsEs.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <div className="text-xs font-bold text-pink-800 pt-2">Preguntas que debes hacer a Razmik:</div>
              <ul className="list-disc pl-5 text-sm text-pink-900 space-y-1">
                {currentSm.gayaneCard.questionsToAskEs.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Shared verification question */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="font-bold text-slate-900">{currentSm.solutionCheckQuestionEs}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentSm.solutionOptions.map((opt, idx) => {
                const picked = smPicked === idx;
                const isRight = idx === currentSm.correctSolutionIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={smPicked !== null}
                    onClick={() => {
                      smTimer.pause();
                      setSmPicked(idx);
                      if (isRight) {
                        playCorrectSound();
                        awardPlayer('razmik', 20, smTimer.seconds, true);
                        awardPlayer('gayane', 20, smTimer.seconds, true);
                        concludeMatch('¡Misión secreta!', 20, 20);
                      } else {
                        playWrongSound();
                      }
                    }}
                    className={`p-3 rounded-xl border text-left text-sm font-medium cursor-pointer ${
                      smPicked !== null
                        ? isRight
                          ? 'bg-emerald-100 border-emerald-500'
                          : picked
                            ? 'bg-red-100 border-red-400'
                            : 'bg-white border-slate-200'
                        : 'bg-white border-slate-200 hover:border-violet-400'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {smPicked !== null && smPicked !== currentSm.correctSolutionIndex && (
              <button
                type="button"
                onClick={() => setSmPicked(null)}
                className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
              >
                Intentar de nuevo
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 16: 🖼️ ¡MIRA Y EXPLICA! */}
      {/* ==================================================================== */}
      {gameId === 'mira_explica' && currentMiraWorld && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                {miraSwapped ? 'Gayane describe · Razmik hace 3 preguntas' : 'Razmik describe · Gayane hace 3 preguntas'}
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-blue-600" />
                ¡Mira y explica! — {currentMiraWorld.nameEs}
              </h2>
            </div>
            <UniversalTimer
              mode="contrarreloj"
              initialSeconds={60}
              running={miraTimer.running}
              seconds={miraTimer.seconds}
              onStart={miraTimer.start}
              onPause={miraTimer.pause}
              onReset={() => miraTimer.reset(60)}
              onFinish={() => {
                miraTimer.pause();
                const spent = Math.max(1, 60 - miraTimer.seconds);
                setRazmikTime((t) => t + spent);
                setGayaneTime((t) => t + spent);
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
              <img
                src={currentMiraWorld.image}
                alt={currentMiraWorld.nameEs}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2 text-sm">
                <div className="font-bold text-slate-900">
                  1. {miraSwapped ? 'Gayane' : 'Razmik'} describe la imagen (4–5 frases):
                </div>
                <div className="text-slate-700">
                  Ejemplo: «Hay muchas personas. Una mujer lleva una maleta...»
                </div>
              </div>

              <div className="p-4 rounded-xl bg-pink-50 border border-pink-200 space-y-2 text-sm">
                <div className="font-bold text-slate-900">
                  2. {miraSwapped ? 'Razmik' : 'Gayane'} hace 3 preguntas sobre la imagen ({miraQuestionsCount}/3):
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((qNum) => (
                    <button
                      key={qNum}
                      type="button"
                      onClick={() => setMiraQuestionsCount(qNum)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer ${
                        miraQuestionsCount >= qNum
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'bg-white text-slate-700 border-pink-200'
                      }`}
                    >
                      Pregunta {qNum} ✓
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMiraWorldIdx((i) => i + 1);
                    setMiraQuestionsCount(0);
                    setMiraSwapped((s) => !s);
                    miraTimer.reset(60);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cambiar escena y papeles
                </button>
              </div>
            </div>
          </div>

          <OralEvaluator
            playerLabel="Evaluación de descripción + 3 preguntas"
            studentId={activeStudentRole}
            worldId={currentMiraWorld.id}
            gameId={gameId}
            questionEs={`Describe la escena de ${currentMiraWorld.nameEs} y haz 3 preguntas`}
            parentalConsentGranted={parentalConsentGranted}
            onParentalConsentGranted={onParentalConsentGranted}
            helperWords={currentMiraWorld.vocab.slice(0, 6).map((v) => v.es)}
            onAwardPoints={(pts) => {
              const qBonus = miraQuestionsCount * 3;
              awardPlayer('razmik', pts + qBonus, 60 - miraTimer.seconds, pts > 0, currentMiraWorld.id);
              awardPlayer('gayane', pts + qBonus, 60 - miraTimer.seconds, pts > 0, currentMiraWorld.id);
              void concludeMatch('¡Mira y explica!', pts + qBonus, pts + qBonus);
            }}
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* GAME 17: 🃏 ¡ROBA LA CARTA! (30 preguntas · 2 minutos) */}
      {/* ==================================================================== */}
      {gameId === 'roba_carta' && !showWinnerBanner && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Cartas jugadas: {cardsCompleted}/{deckSize} · Quedan {cardDeck.length} en el mazo · Racha: 🔵 {rDeckStreak} | 🩷 {gDeckStreak}
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-6 h-6 text-violet-600" />
                🃏 ¡Roba la carta! — 30 preguntas en 2 minutos
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`px-4 py-2 rounded-xl border-2 flex items-center gap-2 font-mono-num text-xl font-extrabold ${
                  deckRoundTimer.seconds <= 15
                    ? 'bg-red-50 border-red-400 text-red-700'
                    : 'bg-indigo-50 border-indigo-300 text-indigo-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                {formatTimeSec(deckRoundTimer.seconds)}
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {(['competencia', 'calentamiento'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDeckMode(m)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                      deckMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    {m === 'competencia' ? '⚔️ Competencia' : '🔥 Calentamiento'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {([12, 20, 30] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => resetDeckGame(sz)}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                      deckSize === sz ? 'bg-slate-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    {sz} cartas
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => resetDeckGame(deckSize)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Barajar mazo
              </button>
            </div>
          </div>

          {/* Progress strip */}
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600 transition-all"
              style={{ width: `${Math.round((cardsCompleted / Math.max(1, deckSize)) * 100)}%` }}
            />
          </div>

          {!drawnCard ? (
            /* FACE-DOWN INTERACTIVE MYSTERY DECK */
            <div className="py-6 flex flex-col items-center justify-center gap-6">
              <div className="text-center space-y-1">
                <div className="text-sm font-bold text-slate-700">
                  {deckMode === 'competencia'
                    ? `Turno de ${activePlayer === 'razmik' ? 'RAZMIK 🔵' : 'GAYANE 🩷'} — ¡Tira de una carta del mazo!`
                    : '¡Calentamiento rápido! Pulsad el mazo para sacar una pregunta sorpresa'}
                </div>
                <p className="text-xs text-slate-500">
                  Mazo de {deckSize} cartas · Tiempo total de la ronda: 2 minutos (02:00)
                </p>
              </div>

              <button
                type="button"
                onClick={drawNextCardFromDeck}
                className="group relative w-64 h-80 cursor-pointer focus:outline-none"
              >
                <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl bg-violet-200 border-2 border-violet-300 transition-transform group-hover:translate-x-4 group-hover:translate-y-4" />
                <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-3xl bg-blue-200 border-2 border-blue-300 transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />
                <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-900 border-4 border-amber-300 p-6 flex flex-col items-center justify-between text-white shadow-xl transition-transform group-hover:-translate-y-1.5">
                  <div className="w-full flex items-center justify-between text-xs font-bold text-amber-300">
                    <span>¡HABLA Y GANA!</span>
                    <span className="font-mono-num">{cardDeck.length} 🃏</span>
                  </div>

                  <div className="space-y-3 text-center">
                    <div className="text-6xl">🃏</div>
                    <div className="font-display text-2xl font-extrabold tracking-tight text-white">
                      ¡ROBA UNA CARTA!
                    </div>
                    <div className="text-xs font-medium text-indigo-200">
                      Pulsa para sacar carta aleatoria
                    </div>
                  </div>

                  <div className="w-full py-2 rounded-xl bg-amber-400 text-slate-950 font-display text-sm font-extrabold text-center group-hover:bg-amber-300 transition-colors">
                    Sacar carta ahora →
                  </div>
                </div>
              </button>

              {cardsCompleted > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    deckRoundTimer.pause();
                    void concludeMatch('¡Roba la carta! (30 cartas · 2 min)', 0, 0, Math.max(1, 120 - deckRoundTimer.seconds), deckSize);
                  }}
                  className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Terminar partida ahora y ver ganador 🏆
                </button>
              )}
            </div>
          ) : (
            /* REVEALED ACTIVE CARD */
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl">{WORLDS_MAP[drawnCard.world].icon}</span>
                  <span className="text-sm font-bold text-slate-800">{WORLDS_MAP[drawnCard.world].nameEs}</span>
                  <span className="text-xs font-semibold text-slate-500">
                    ·{' '}
                    {drawnCard.cardType === 'rapida'
                      ? 'Carta rápida'
                      : drawnCard.cardType === 'oral'
                        ? 'Carta oral'
                        : '¡Carta de duelo!'}
                  </span>
                  {drawnCard.bonusTag && (
                    <span className="px-2.5 py-1 text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 rounded-lg inline-flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {drawnCard.bonusTag}
                    </span>
                  )}
                </div>

                <UniversalTimer
                  mode="contrarreloj"
                  initialSeconds={deckTimerLimit}
                  running={deckTimer.running}
                  seconds={deckTimer.seconds}
                  onStart={deckTimer.start}
                  onPause={deckTimer.pause}
                  onReset={() => deckTimer.reset(deckTimerLimit)}
                  onFinish={() => {
                    deckTimer.pause();
                    const spent = Math.max(1, deckTimerLimit - deckTimer.seconds);
                    if (activePlayer === 'razmik') setRazmikTime((t) => t + spent);
                    else setGayaneTime((t) => t + spent);
                  }}
                />
              </div>

              {/* Drawn Card Face */}
              <div
                className="rounded-2xl border-2 p-6 space-y-4 shadow-sm"
                style={{
                  borderColor: WORLDS_MAP[drawnCard.world].accentColor,
                  backgroundColor: `${WORLDS_MAP[drawnCard.world].accentColor}0D`,
                }}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>
                    {drawnCard.cardType === 'duelo'
                      ? '⚔️ Duelo conjunto: RAZMIK 🔵 y GAYANE 🩷'
                      : `Responde: ${activePlayer === 'razmik' ? 'RAZMIK 🔵' : 'GAYANE 🩷'}`}
                  </span>
                  <span className="font-mono-num">
                    Valor: {drawnCard.cardType === 'rapida' ? 10 * drawnCard.multiplier : 15 * drawnCard.multiplier} pts
                  </span>
                </div>

                <div className="text-xl font-bold text-slate-900">
                  <SpPhrase es={drawnCard.questionEs} hy={drawnCard.questionHy} />
                </div>

                {drawnCard.helperWords && difficulty <= 2 && (
                  <div className="text-xs text-slate-700 bg-white/80 border border-slate-200 rounded-xl px-3.5 py-2">
                    Palabras de ayuda: <strong>{drawnCard.helperWords.join(' · ')}</strong>
                  </div>
                )}
              </div>

              {/* Card Gameplay by Type */}
              {drawnCard.cardType === 'rapida' && drawnCard.options ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {drawnCard.options.map((opt, idx) => {
                      const picked = cardOptionPicked === idx;
                      const isRight = idx === drawnCard.correctIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={cardOptionPicked !== null}
                          onClick={() => {
                            deckTimer.pause();
                            setCardOptionPicked(idx);
                            const elapsed = Math.max(1, deckTimerLimit - deckTimer.seconds);
                            matchAnswersRef.current.push({
                              questionEs: drawnCard.questionEs,
                              chosenEs: opt,
                              correctEs: drawnCard.options?.[drawnCard.correctIndex ?? 0] || '',
                              isCorrect: isRight,
                            });
                            if (isRight) {
                              playCorrectSound();
                              const speedBonus = elapsed <= 8 ? 5 : 0;
                              const streakBonus =
                                (activePlayer === 'razmik' ? rDeckStreak : gDeckStreak) >= 2 ? 5 : 0;
                              const totalPts = 10 * drawnCard.multiplier + speedBonus + streakBonus;
                              if (activePlayer === 'razmik') setRDeckStreak((s) => s + 1);
                              else setGDeckStreak((s) => s + 1);
                              awardPlayer(activePlayer, totalPts, elapsed, true, drawnCard.world);
                            } else {
                              playWrongSound();
                              if (activePlayer === 'razmik') setRDeckStreak(0);
                              else setGDeckStreak(0);
                              awardPlayer(activePlayer, 0, elapsed, false, drawnCard.world);
                            }
                          }}
                          className={`p-4 rounded-xl border text-left font-semibold transition-colors cursor-pointer ${
                            cardOptionPicked !== null
                              ? isRight
                                ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                                : picked
                                  ? 'bg-red-100 border-red-400 text-red-900'
                                  : 'bg-white border-slate-200 text-slate-400'
                              : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-slate-900'
                          }`}
                        >
                          <strong className="mr-2">{String.fromCharCode(65 + idx)}.</strong>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {cardOptionPicked !== null && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-medium text-slate-800">{drawnCard.explanationHy}</div>
                      <button
                        type="button"
                        onClick={finishCurrentCardTurn}
                        className="px-5 py-2.5 text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl cursor-pointer"
                      >
                        {cardDeck.length === 0 ? 'Ver ganador final 🏆' : 'Volver al mazo y sacar otra 🃏'}
                      </button>
                    </div>
                  )}
                </div>
              ) : drawnCard.cardType === 'oral' ? (
                <OralEvaluator
                  playerLabel={`${activePlayer === 'razmik' ? 'Razmik 🔵' : 'Gayane 🩷'} (${drawnCard.multiplier}x)`}
                  studentId={safeStudentId(activePlayer)}
                  worldId={drawnCard.world}
                  gameId={gameId}
                  questionEs={drawnCard.questionEs}
                  parentalConsentGranted={parentalConsentGranted}
                  onParentalConsentGranted={onParentalConsentGranted}
                  helperWords={drawnCard.helperWords}
                  sampleAnswerEs={drawnCard.sampleAnswerEs}
                  onAwardPoints={(pts) => {
                    const earned = pts * drawnCard.multiplier;
                    const spent = Math.max(1, deckTimerLimit - deckTimer.seconds);
                    if (earned > 0) {
                      if (activePlayer === 'razmik') setRDeckStreak((s) => s + 1);
                      else setGDeckStreak((s) => s + 1);
                    }
                    awardPlayer(activePlayer, earned, spent, earned > 0, drawnCard.world);
                    finishCurrentCardTurn();
                  }}
                />
              ) : (
                /* DUEL CARD (BOTH PLAYERS HEAD-TO-HEAD) */
                <div className="space-y-4">
                  <OralEvaluator
                    playerLabel="Duelo oral en pareja (Razmik y Gayane)"
                    studentId={activeStudentRole}
                    worldId={drawnCard.world}
                    gameId={gameId}
                    questionEs={drawnCard.questionEs}
                    parentalConsentGranted={parentalConsentGranted}
                    onParentalConsentGranted={onParentalConsentGranted}
                    helperWords={drawnCard.helperWords}
                    sampleAnswerEs={drawnCard.sampleAnswerEs}
                    onAwardPoints={(pts) => {
                      const earned = pts * drawnCard.multiplier;
                      const spent = Math.max(1, deckTimerLimit - deckTimer.seconds);
                      awardPlayer('razmik', earned, spent, earned > 0, drawnCard.world);
                      awardPlayer('gayane', earned, spent, earned > 0, drawnCard.world);
                      finishCurrentCardTurn();
                    }}
                  />

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-bold text-slate-600">
                      O elige directamente quién ganó el duelo de esta carta ({15 * drawnCard.multiplier} pts):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          playCorrectSound();
                          const pts = 15 * drawnCard.multiplier;
                          setRDeckStreak((s) => s + 1);
                          awardPlayer('razmik', pts, Math.max(1, deckTimerLimit - deckTimer.seconds), true, drawnCard.world);
                          finishCurrentCardTurn();
                        }}
                        className="px-4 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl cursor-pointer"
                      >
                        Ganó Razmik 🔵 (+{15 * drawnCard.multiplier})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playCorrectSound();
                          const pts = 15 * drawnCard.multiplier;
                          setGDeckStreak((s) => s + 1);
                          awardPlayer('gayane', pts, Math.max(1, deckTimerLimit - deckTimer.seconds), true, drawnCard.world);
                          finishCurrentCardTurn();
                        }}
                        className="px-4 py-2 text-xs font-bold bg-pink-600 text-white hover:bg-pink-700 rounded-xl cursor-pointer"
                      >
                        Ganó Gayane 🩷 (+{15 * drawnCard.multiplier})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playCorrectSound();
                          const pts = 12 * drawnCard.multiplier;
                          const spent = Math.max(1, deckTimerLimit - deckTimer.seconds);
                          awardPlayer('razmik', pts, spent, true, drawnCard.world);
                          awardPlayer('gayane', pts, spent, true, drawnCard.world);
                          finishCurrentCardTurn();
                        }}
                        className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl cursor-pointer"
                      >
                        ¡Gran diálogo los dos! (+{12 * drawnCard.multiplier} c/u)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
