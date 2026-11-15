import React, { useEffect, useRef, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Send,
  Volume2,
  Loader2,
  Play,
} from 'lucide-react';
import { get30QuestionsForWorld, WORLDS_MAP } from './dataGames';
import { playCorrectSound, playVictorySound, playWrongSound, speakEs } from './audio';
import { ConfettiOverlay, SpPhrase, formatTimeSec, useGameTimer } from './ClickSpanish';
import {
  CloudAnswerSummary,
  MatchHistoryItem,
  PlayerId,
  QuickQuestion,
  WorldId,
} from './types';

interface Reto30ArenaProps {
  worldFilter: WorldId | 'todos';
  activeStudent: PlayerId;
  onRecordAnswer: (player: PlayerId, correct: boolean, worldId?: WorldId) => void;
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
  onSubmitSessionToTeacher: (sessionId: string) => Promise<void>;
  onExitGame: () => void;
}

const TOTAL_TIME_SEC = 120;

export const Reto30Arena: React.FC<Reto30ArenaProps> = ({
  worldFilter,
  activeStudent,
  onRecordAnswer,
  onFinishMatch,
  onSubmitSessionToTeacher,
  onExitGame,
}) => {
  const [questions, setQuestions] = useState<QuickQuestion[]>(() => get30QuestionsForWorld(worldFilter));
  const [started, setStarted] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [answers, setAnswers] = useState<CloudAnswerSummary[]>([]);
  const [finished, setFinished] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [sendingToTeacher, setSendingToTeacher] = useState(false);
  const [sentConfirmed, setSentConfirmed] = useState(false);
  const [sendError, setSendError] = useState('');

  const answersRef = useRef<CloudAnswerSummary[]>([]);
  const finishedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof useGameTimer> | null>(null);

  const finalizeRound = async (finalAnswers: CloudAnswerSummary[], remainingSec: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    timerRef.current?.pause();
    setFinished(true);
    playVictorySound();

    const correctCount = finalAnswers.filter((a) => a.isCorrect).length;
    const incorrectCount = finalAnswers.length - correctCount;
    const unanswered = Math.max(0, 30 - finalAnswers.length);
    const totalIncorrect = incorrectCount + unanswered;
    const points = correctCount * 10 + (correctCount >= 25 && remainingSec > 0 ? 20 : 0);
    const durationSec = Math.max(1, TOTAL_TIME_SEC - remainingSec);

    const rScore = activeStudent === 'razmik' ? points : 0;
    const gScore = activeStudent === 'gayane' ? points : 0;
    const rTime = activeStudent === 'razmik' ? durationSec : 0;
    const gTime = activeStudent === 'gayane' ? durationSec : 0;

    const sessionId = await onFinishMatch(
      {
        gameId: 'reto_30',
        gameTitleEs: 'Reto de 30 preguntas (2 min)',
        world: worldFilter,
        razmikScore: rScore,
        gayaneScore: gScore,
        razmikTimeSec: rTime,
        gayaneTimeSec: gTime,
        winner: activeStudent,
      },
      {
        totalQuestions: 30,
        correctCount,
        incorrectCount: totalIncorrect,
        durationSec,
        answersSummary: finalAnswers,
      }
    );
    if (typeof sessionId === 'string') {
      setSavedSessionId(sessionId);
    }
  };

  const timer = useGameTimer('contrarreloj', TOTAL_TIME_SEC, () => {
    void finalizeRound(answersRef.current, 0);
  });
  timerRef.current = timer;

  useEffect(() => {
    return () => {
      timer.pause();
    };
  }, []);

  const currentQ = questions[qIdx];

  const handleStart = () => {
    setStarted(true);
    timer.start();
  };

  const handleSelectOption = (optIdx: number) => {
    if (pickedIdx !== null || finished || !currentQ) return;
    if (!started) {
      setStarted(true);
      timer.start();
    }
    setPickedIdx(optIdx);
    const isCorrect = optIdx === currentQ.correctIndex;
    if (isCorrect) playCorrectSound();
    else playWrongSound();

    onRecordAnswer(activeStudent, isCorrect, currentQ.world);

    const summaryItem: CloudAnswerSummary = {
      questionEs: currentQ.situationEs,
      chosenEs: currentQ.options[optIdx] || '',
      correctEs: currentQ.options[currentQ.correctIndex] || '',
      isCorrect,
    };
    const nextAnswers = [...answersRef.current, summaryItem];
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);

    window.setTimeout(() => {
      if (finishedRef.current) return;
      if (qIdx + 1 >= questions.length) {
        void finalizeRound(nextAnswers, timer.seconds);
      } else {
        setPickedIdx(null);
        setQIdx((i) => i + 1);
      }
    }, 450);
  };

  const handleRepeat = () => {
    finishedRef.current = false;
    answersRef.current = [];
    setQuestions(get30QuestionsForWorld(worldFilter));
    setQIdx(0);
    setPickedIdx(null);
    setAnswers([]);
    setFinished(false);
    setSavedSessionId(null);
    setSentConfirmed(false);
    setSendError('');
    setStarted(true);
    timer.reset(TOTAL_TIME_SEC);
    timer.start();
  };

  const handleSendResultsToTeacher = async () => {
    if (!savedSessionId || sendingToTeacher || sentConfirmed) return;
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

  const correctTotal = answers.filter((a) => a.isCorrect).length;
  const incorrectTotal = Math.max(0, 30 - correctTotal);
  const accuracyPct = Math.round((correctTotal / 30) * 100);
  const spentSec = Math.max(1, TOTAL_TIME_SEC - timer.seconds);
  const totalPoints = correctTotal * 10 + (correctTotal >= 25 && timer.seconds > 0 ? 20 : 0);

  return (
    <div className="space-y-6">
      <ConfettiOverlay active={finished && accuracyPct >= 60} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            timer.pause();
            onExitGame();
          }}
          className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl cursor-pointer"
        >
          ← Volver
        </button>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${
              activeStudent === 'razmik'
                ? 'bg-blue-100 text-blue-900'
                : 'bg-pink-100 text-pink-900'
            }`}
          >
            {activeStudent === 'razmik' ? '🔵 RAZMIK' : '🩷 GAYANE'}
          </span>
          <span className="text-xs font-semibold text-slate-600">
            {worldFilter === 'todos' ? '🌍 Todos los temas' : `${WORLDS_MAP[worldFilter].icon} ${WORLDS_MAP[worldFilter].nameEs}`}
          </span>
        </div>
      </div>

      {/* Top Timer & Progress Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
            Modo Cronometrado · 30 Preguntas · 2 Minutos
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
            ⏱️ Reto de 30 preguntas
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-500 font-semibold">Pregunta</div>
            <div className="font-mono-num text-2xl font-extrabold text-slate-900">
              {Math.min(30, qIdx + 1)}/30
            </div>
          </div>

          <div
            className={`px-4 py-2.5 rounded-2xl border-2 flex items-center gap-2 font-mono-num text-2xl font-extrabold ${
              timer.seconds <= 15
                ? 'bg-red-50 border-red-400 text-red-700'
                : 'bg-indigo-50 border-indigo-300 text-indigo-900'
            }`}
          >
            <Clock className="w-5 h-5" />
            {formatTimeSec(timer.seconds)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 transition-all duration-300"
          style={{ width: `${Math.round(((finished ? 30 : answers.length) / 30) * 100)}%` }}
        />
      </div>

      {!started && !finished ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-5 max-w-2xl mx-auto">
          <div className="text-5xl">⏱️</div>
          <h2 className="font-display text-2xl font-extrabold text-slate-900">
            ¿Listo para el reto de 30 preguntas en 2 minutos?
          </h2>
          <p className="text-sm text-slate-600">
            <SpPhrase
              es="Tienes 2 minutos (02:00) para responder 30 preguntas variadas sobre el tema. Tu resultado se guardará automáticamente para tu profesor."
              hy="Դու ունես 2 րոպե (02:00)՝ թեմայի վերաբերյալ 30 տարբեր հարցի պատասխանելու համար: Արդյունքը ավտոմատ կպահվի ուսուցչի համար:"
            />
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl shadow-sm cursor-pointer"
          >
            <Play className="w-5 h-5" />
            ¡Empezar reto de 30 preguntas!
          </button>
        </div>
      ) : finished ? (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white border-2 border-indigo-300 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
              <h2 className="font-display text-3xl font-extrabold text-slate-900">
                {accuracyPct >= 80
                  ? '¡RESULTADO BRILLANTE! 🏆'
                  : accuracyPct >= 50
                    ? '¡BUEN TRABAJO! 👏'
                    : '¡SIGUE PRACTICANDO! 💪'}
              </h2>
              <div className="text-sm text-slate-600">
                Guardado automáticamente en la nube para <strong>{activeStudent === 'razmik' ? 'Razmik' : 'Gayane'}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="font-mono-num text-2xl font-extrabold text-emerald-700">{correctTotal}</div>
                <div className="text-xs font-semibold text-emerald-900">Correctas</div>
              </div>
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
                <div className="font-mono-num text-2xl font-extrabold text-red-700">{incorrectTotal}</div>
                <div className="text-xs font-semibold text-red-900">Errores</div>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="font-mono-num text-2xl font-extrabold text-blue-700">{totalPoints}</div>
                <div className="text-xs font-semibold text-blue-900">Puntos</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="font-mono-num text-2xl font-extrabold text-slate-900">{formatTimeSec(spentSec)}</div>
                <div className="text-xs font-semibold text-slate-600">Tiempo</div>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 col-span-2 sm:col-span-1">
                <div className="font-mono-num text-2xl font-extrabold text-indigo-800">{accuracyPct}%</div>
                <div className="text-xs font-semibold text-indigo-900">Resultado</div>
              </div>
            </div>

            {sendError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 text-center">
                {sendError}
              </div>
            )}

            {sentConfirmed && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-sm font-extrabold text-emerald-900 text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Resultado enviado correctamente
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              {savedSessionId && !sentConfirmed && (
                <button
                  type="button"
                  disabled={sendingToTeacher}
                  onClick={handleSendResultsToTeacher}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl cursor-pointer disabled:opacity-60"
                >
                  {sendingToTeacher ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sendingToTeacher ? 'Enviando...' : '📤 Enviar resultados al profesor'}
                </button>
              )}
              <button
                type="button"
                onClick={handleRepeat}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Repetir reto (30 preguntas)
              </button>
              <button
                type="button"
                onClick={onExitGame}
                className="px-6 py-3 text-sm font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded-xl cursor-pointer"
              >
                Volver al menú
              </button>
            </div>
          </div>

          {/* Detailed Answers Breakdown */}
          {answers.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Revisión de tus respuestas ({answers.length}/30)
              </h3>
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                {answers.map((ans, idx) => (
                  <div key={idx} className="py-2.5 flex items-start gap-3 text-sm">
                    {ans.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-1" />
                    )}
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900">
                        {idx + 1}. {ans.questionEs}
                      </div>
                      <div className="text-xs text-slate-600">
                        Tu respuesta:{' '}
                        <strong className={ans.isCorrect ? 'text-emerald-700' : 'text-red-700'}>
                          {ans.chosenEs}
                        </strong>
                        {!ans.isCorrect && (
                          <>
                            {' '}
                            · Correcta: <strong className="text-emerald-700">{ans.correctEs}</strong>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        currentQ && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
              <span>
                {WORLDS_MAP[currentQ.world].icon} {WORLDS_MAP[currentQ.world].nameEs} · Nivel {currentQ.level}
              </span>
              <span className="font-mono-num text-emerald-700">
                Aciertos: {correctTotal} · Errores: {answers.length - correctTotal}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
              <div className="text-lg sm:text-xl font-bold text-slate-900">
                <SpPhrase es={currentQ.situationEs} hy={currentQ.situationHy} />
              </div>
              <button
                type="button"
                onClick={() => speakEs(currentQ.situationEs)}
                aria-label="Escuchar pregunta"
                className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 text-slate-700 shrink-0 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentQ.options.map((opt, idx) => {
                const isPicked = pickedIdx === idx;
                const isRight = idx === currentQ.correctIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={pickedIdx !== null}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-4 rounded-2xl border text-left font-semibold transition-all cursor-pointer ${
                      pickedIdx !== null
                        ? isRight
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                          : isPicked
                            ? 'bg-red-100 border-red-400 text-red-900'
                            : 'bg-white border-slate-200 text-slate-400'
                        : 'bg-white border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-slate-900'
                    }`}
                  >
                    <strong className="mr-2 text-indigo-700">{String.fromCharCode(65 + idx)}.</strong>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
};
