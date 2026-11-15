import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Play, Pause, RotateCcw, CheckCircle2, Mic, Square, Trash2, Award, Send, ShieldCheck, Loader2 } from 'lucide-react';
import {
  playCorrectSound,
  playTickSound,
  speakEs,
  SpeechRecognitionController,
  startListeningEs,
  startVoiceRecording,
  VoiceRecorderController,
} from './audio';
import {
  analyzeSpanishSpokenResponse,
  grantParentalConsentInCloud,
  uploadVoiceRecordingToCloud,
  auth,
} from './firebaseClient';
import { CloudVoiceRecording, GameId, PlayerId, PlayerProgress, TimerMode, WorldId } from './types';

interface SpPhraseProps {
  es: string;
  hy: string;
  className?: string;
  showAudio?: boolean;
  defaultOpen?: boolean;
  darkSurface?: boolean;
}

export const SpPhrase: React.FC<SpPhraseProps> = ({
  es,
  hy,
  className = '',
  showAudio = true,
  defaultOpen = false,
  darkSurface = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          title="Pulsa para ver la traducción al armenio"
          className={`text-left font-medium underline decoration-dotted underline-offset-4 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-0.5 ${
            darkSurface
              ? 'text-white decoration-white/50 hover:text-amber-200'
              : 'text-slate-900 decoration-slate-400 hover:text-blue-700'
          }`}
        >
          {es}
        </button>
        {showAudio && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              speakEs(es);
            }}
            aria-label={`Escuchar: ${es}`}
            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              darkSurface
                ? 'bg-white/15 text-white hover:bg-white/25'
                : 'bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-700'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        )}
      </span>
      {open && (
        <span
          className={`text-sm leading-snug rounded-lg px-2.5 py-1.5 border ${
            darkSurface
              ? 'bg-slate-900/90 text-amber-100 border-white/20'
              : 'bg-amber-50 text-slate-800 border-amber-200'
          }`}
        >
          {hy}
        </span>
      )}
    </span>
  );
};

export const ConfettiOverlay: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;
  const colors = ['#2563EB', '#EA580C', '#DB2777', '#7C3AED', '#10B981', '#F59E0B'];
  const pieces = Array.from({ length: 42 }, (_, i) => ({
    id: i,
    left: (i * 2.4 + (i % 5) * 3) % 98,
    delay: (i % 7) * 0.14,
    color: colors[i % colors.length],
    size: 8 + (i % 4) * 3,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.4}px`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export function formatTimeSec(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

interface UniversalTimerProps {
  mode: TimerMode;
  initialSeconds: number;
  running: boolean;
  seconds: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onFinish?: () => void;
  recordBestSec?: number;
  startLabel?: string;
  finishLabel?: string;
}

export const UniversalTimer: React.FC<UniversalTimerProps> = ({
  mode,
  initialSeconds,
  running,
  seconds,
  onStart,
  onPause,
  onReset,
  onFinish,
  recordBestSec,
  startLabel = '¡Empezar!',
  finishLabel = '¡Terminé!',
}) => {
  const [finishedTime, setFinishedTime] = useState<number | null>(null);
  const isCountdown = mode === 'contrarreloj';
  const lowTime = isCountdown && seconds <= 5 && seconds > 0;

  useEffect(() => {
    if (running) {
      setFinishedTime(null);
    }
  }, [running]);

  const modeLabels: Record<TimerMode, string> = {
    contrarreloj: 'Modo Contrarreloj',
    cronometro: 'Modo Cronómetro',
    dialogo: 'Modo Diálogo',
    record: 'Modo Récord',
  };

  return (
    <div className="flex flex-col gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-xs font-medium text-slate-500">
              {modeLabels[mode]}
              {mode === 'record' && recordBestSec ? ` · Récord: ${formatTimeSec(recordBestSec)}` : ''}
              {isCountdown ? ` · ${initialSeconds}s` : ''}
            </div>
            <div
              className={`font-mono-num text-2xl font-bold tracking-tight ${
                lowTime ? 'text-red-600' : running ? 'text-blue-700' : 'text-slate-900'
              }`}
            >
              {formatTimeSec(seconds)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!running ? (
            <button
              type="button"
              onClick={() => {
                setFinishedTime(null);
                onStart();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              {seconds > 0 && (mode !== 'contrarreloj' || seconds < initialSeconds) ? 'Continuar' : startLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={onPause}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              Pausa
            </button>
          )}

          {onFinish && (
            <button
              type="button"
              onClick={() => {
                onPause();
                setFinishedTime(seconds);
                playCorrectSound();
                onFinish();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {finishLabel}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setFinishedTime(null);
              onReset();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reiniciar
          </button>
        </div>
      </div>

      {finishedTime !== null && (
        <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
          ✓ ¡Terminé! Tiempo registrado: {formatTimeSec(finishedTime)} — Ahora podéis evaluar la respuesta abajo.
        </div>
      )}
    </div>
  );
};

export function useGameTimer(mode: TimerMode, initialSeconds: number, onExpire?: () => void) {
  const [seconds, setSeconds] = useState(mode === 'contrarreloj' ? initialSeconds : 0);
  const [running, setRunning] = useState(false);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    setSeconds(mode === 'contrarreloj' ? initialSeconds : 0);
    setRunning(false);
  }, [mode, initialSeconds]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds((prev) => {
        if (mode === 'contrarreloj') {
          if (prev <= 1) {
            setRunning(false);
            expireRef.current?.();
            return 0;
          }
          if (prev <= 6) {
            playTickSound();
          }
          return prev - 1;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, mode]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = (newInitial?: number) => {
    setRunning(false);
    const target = newInitial ?? initialSeconds;
    setSeconds(mode === 'contrarreloj' ? target : 0);
  };

  return { seconds, running, start, pause, reset, setSeconds };
}

interface DualScoreHudProps {
  activePlayer: PlayerId | 'ambos';
  razmikRoundPoints: number;
  gayaneRoundPoints: number;
  razmikRoundTime: number;
  gayaneRoundTime: number;
  razmikTotal: PlayerProgress;
  gayaneTotal: PlayerProgress;
  roundLabel?: string;
}

export const DualScoreHud: React.FC<DualScoreHudProps> = ({
  activePlayer,
  razmikRoundPoints,
  gayaneRoundPoints,
  razmikRoundTime,
  gayaneRoundTime,
  razmikTotal,
  gayaneTotal,
  roundLabel,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* RAZMIK PANEL */}
      <div
        className={`rounded-xl border p-4 transition-all ${
          activePlayer === 'razmik' || activePlayer === 'ambos'
            ? 'bg-blue-50/70 border-blue-400 shadow-sm'
            : 'bg-white border-slate-200 opacity-85'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-600 shrink-0" aria-hidden="true" />
            <div>
              <div className="font-display font-bold text-slate-900">
                RAZMIK {activePlayer === 'razmik' ? '· Tu turno' : ''}
              </div>
              <div className="text-xs text-slate-500 font-mono-num">
                Total: {razmikTotal.points} pts · Racha: {razmikTotal.streak} · {razmikTotal.medals.length} medallas
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono-num text-2xl font-bold text-blue-700">{razmikRoundPoints} pts</div>
            <div className="font-mono-num text-xs text-slate-500">
              {formatTimeSec(razmikRoundTime)} {roundLabel ? `· ${roundLabel}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* GAYANE PANEL */}
      <div
        className={`rounded-xl border p-4 transition-all ${
          activePlayer === 'gayane' || activePlayer === 'ambos'
            ? 'bg-pink-50/70 border-pink-400 shadow-sm'
            : 'bg-white border-slate-200 opacity-85'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-pink-600 shrink-0" aria-hidden="true" />
            <div>
              <div className="font-display font-bold text-slate-900">
                GAYANE {activePlayer === 'gayane' ? '· Tu turno' : ''}
              </div>
              <div className="text-xs text-slate-500 font-mono-num">
                Total: {gayaneTotal.points} pts · Racha: {gayaneTotal.streak} · {gayaneTotal.medals.length} medallas
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono-num text-2xl font-bold text-pink-700">{gayaneRoundPoints} pts</div>
            <div className="font-mono-num text-xs text-slate-500">
              {formatTimeSec(gayaneRoundTime)} {roundLabel ? `· ${roundLabel}` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface OralEvaluatorProps {
  playerLabel: string;
  helperWords?: string[];
  sampleAnswerEs?: string;
  onAwardPoints: (points: number, note: string) => void;
  disabled?: boolean;
  studentId?: PlayerId;
  worldId?: WorldId | 'todos';
  gameId?: GameId | string;
  questionEs?: string;
  parentalConsentGranted?: boolean;
  onParentalConsentGranted?: () => void;
  onVoiceUploaded?: (rec: CloudVoiceRecording) => void;
}

export const OralEvaluator: React.FC<OralEvaluatorProps> = ({
  playerLabel,
  helperWords = [],
  sampleAnswerEs,
  onAwardPoints,
  disabled = false,
  studentId,
  worldId = 'aeropuerto',
  gameId = 'practica_oral',
  questionEs,
  parentalConsentGranted = false,
  onParentalConsentGranted,
  onVoiceUploaded,
}) => {
  const [writtenText, setWrittenText] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedMime, setRecordedMime] = useState<string>('audio/webm');
  const [micError, setMicError] = useState('');
  const [showSample, setShowSample] = useState(false);

  const [consentPromptOpen, setConsentPromptOpen] = useState(false);
  const [consentLocalOk, setConsentLocalOk] = useState(parentalConsentGranted);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedRecord, setUploadedRecord] = useState<CloudVoiceRecording | null>(null);

  const recSpeechRef = useRef<SpeechRecognitionController | null>(null);
  const recAudioRef = useRef<VoiceRecorderController | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setConsentLocalOk(parentalConsentGranted);
  }, [parentalConsentGranted]);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  const stopRecording = () => {
    recAudioRef.current?.stop();
    recAudioRef.current = null;
    recSpeechRef.current?.stop();
    recSpeechRef.current = null;
    setRecording(false);
  };

  const clearRecording = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl(null);
    setRecordedBlob(null);
    setUploadedRecord(null);
    setUploadError('');
    setRecordSeconds(0);
  };

  const toggleRecording = async () => {
    if (recording) {
      stopRecording();
      return;
    }

    setMicError('');
    setUploadError('');
    setUploadedRecord(null);
    setRecordSeconds(0);
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    setRecordedBlob(null);

    const audioCtrl = await startVoiceRecording(
      (url, blob, mimeType) => {
        setRecordedAudioUrl(url);
        setRecordedBlob(blob);
        setRecordedMime(mimeType || 'audio/webm');
        setRecording(false);
      },
      (err) => {
        setMicError(err);
        setRecording(false);
      }
    );

    if (audioCtrl) {
      recAudioRef.current = audioCtrl;
      setRecording(true);
      // Optional live Spanish speech-to-text alongside real audio recording
      const speechCtrl = startListeningEs(
        (txt) => setWrittenText(txt),
        () => {},
        () => {}
      );
      recSpeechRef.current = speechCtrl;
    }
  };

  useEffect(() => {
    return () => {
      recAudioRef.current?.stop();
      recSpeechRef.current?.stop();
    };
  }, []);

  const inferredStudentId: PlayerId =
    studentId || (playerLabel.toLowerCase().includes('gayane') ? 'gayane' : 'razmik');

  const performCloudUpload = async () => {
    if (!recordedBlob || recordedBlob.size === 0) {
      setUploadError('La grabación está vacía. Graba al menos 1 segundo e inténtalo de nuevo.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const suggestion = analyzeSpanishSpokenResponse(writtenText, helperWords);
      const rec = await uploadVoiceRecordingToCloud({
        studentId: inferredStudentId,
        world: worldId,
        gameId,
        questionEs: questionEs || `Respuesta oral (${playerLabel})`,
        transcriptEs: writtenText,
        aiSuggestionEs: suggestion,
        blob: recordedBlob,
        mimeType: recordedMime,
        durationSec: Math.max(1, recordSeconds),
      });
      setUploadedRecord(rec);
      playCorrectSound();
      onVoiceUploaded?.(rec);
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'No se pudo enviar la grabación. Inténtalo de nuevo.';
      if (msg.startsWith('{')) {
        try {
          const parsed = JSON.parse(msg) as { error?: string };
          if (parsed.error) {
            msg = parsed.error.includes('PERMISSION_DENIED') || parsed.error.includes('permissions')
              ? 'No tienes permiso para enviar esta grabación con este perfil. Inicia sesión con tu perfil correcto.'
              : parsed.error;
          }
        } catch {
          // keep original
        }
      }
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSendToTeacher = () => {
    if (!recordedBlob || uploading) return;
    if (!consentLocalOk) {
      setConsentPromptOpen(true);
      return;
    }
    void performCloudUpload();
  };

  const handleConfirmConsentAndSend = async () => {
    setUploadError('');
    setUploading(true);
    try {
      if (auth.currentUser) {
        await grantParentalConsentInCloud(auth.currentUser.uid);
      }
      setConsentLocalOk(true);
      setConsentPromptOpen(false);
      onParentalConsentGranted?.();
      await performCloudUpload();
    } catch (err) {
      setUploading(false);
      setUploadError(err instanceof Error ? err.message : 'No se pudo guardar el permiso.');
    }
  };

  const matchedHelpers = helperWords.filter((w) =>
    writtenText.toLowerCase().includes(w.toLowerCase().replace(/[¿?¡!]/g, ''))
  );

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-800">
          Graba tu voz o escribe en español · {playerLabel}
        </div>
        <button
          type="button"
          onClick={toggleRecording}
          disabled={disabled || uploading}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            recording
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {recording ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
          {recording ? `Parar grabación (${formatTimeSec(recordSeconds)})` : 'Grabar mi respuesta'}
        </button>
      </div>

      {micError && (
        <div className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {micError}
        </div>
      )}

      {recordedAudioUrl && (
        <div className="bg-white border border-emerald-200 rounded-xl p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-emerald-800">Tu grabación de voz ({formatTimeSec(recordSeconds)}):</div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => audioPlayerRef.current?.play().catch(() => {})}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Escuchar
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={clearRecording}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Repetir
              </button>
              <button
                type="button"
                disabled={uploading || Boolean(uploadedRecord)}
                onClick={handleSendToTeacher}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer disabled:opacity-60"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {uploading ? 'Enviando...' : uploadedRecord ? 'Enviado ✓' : 'Enviar'}
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={clearRecording}
                aria-label="Borrar grabación"
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <audio ref={audioPlayerRef} controls src={recordedAudioUrl} className="h-9 w-full" />

          {consentPromptOpen && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-2.5 text-xs text-slate-800">
              <div className="font-bold text-blue-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                Permiso de madre, padre o tutor para guardar audio en la nube
              </div>
              <p>
                <SpPhrase
                  es="La grabación de voz se guardará de forma privada solo para tu profesor y se podrá borrar en cualquier momento."
                  hy="Ձայնագրությունը պահվում է գաղտնի՝ միայն ուսուցչի համար, և կարող է ջնջվել ցանկացած պահի:"
                  showAudio={false}
                />
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleConfirmConsentAndSend}
                  className="px-3.5 py-1.5 font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Confirmar permiso y enviar audio
                </button>
                <button
                  type="button"
                  onClick={() => setConsentPromptOpen(false)}
                  className="px-3 py-1.5 font-semibold bg-white border border-slate-300 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="text-xs font-semibold text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {uploadError}
            </div>
          )}

          {uploadedRecord && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 space-y-1.5">
              <div className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Resultado enviado correctamente
              </div>
              {uploadedRecord.aiSuggestionEs && (
                <div className="text-xs text-emerald-800">{uploadedRecord.aiSuggestionEs}</div>
              )}
              <button
                type="button"
                onClick={() => onAwardPoints(10, 'Grabación enviada al profesor (+10)')}
                className="mt-1 px-3.5 py-1.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Continuar al siguiente paso →
              </button>
            </div>
          )}
        </div>
      )}

      <textarea
        value={writtenText}
        onChange={(e) => setWrittenText(e.target.value)}
        placeholder="Habla en voz alta grabando tu audio o escribe tu frase en español aquí..."
        rows={2}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
      />

      {helperWords.length > 0 && (
        <div className="text-xs text-slate-600">
          Palabras útiles:{' '}
          {helperWords.map((w, idx) => {
            const used = matchedHelpers.includes(w);
            return (
              <span key={w} className={used ? 'font-bold text-emerald-700' : 'text-slate-700'}>
                {w}
                {idx < helperWords.length - 1 ? ' · ' : ''}
              </span>
            );
          })}
        </div>
      )}

      {sampleAnswerEs && (
        <div>
          <button
            type="button"
            onClick={() => setShowSample((s) => !s)}
            className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
          >
            {showSample ? 'Ocultar ejemplo de respuesta' : 'Ver ejemplo después de hablar'}
          </button>
          {showSample && (
            <div className="mt-1.5 p-2.5 bg-white border border-slate-200 rounded-lg text-sm flex items-center justify-between gap-2">
              <span className="text-slate-800">{sampleAnswerEs}</span>
              <button
                type="button"
                onClick={() => speakEs(sampleAnswerEs)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 cursor-pointer shrink-0"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-slate-200">
        <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          Validación en clase (Ուսուցչի գնահատականը՝ ճիշտ խոսքի համար).
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAwardPoints(10, 'Frase comprensible (+10)')}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
          >
            +10 pts · Frase clara
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAwardPoints(15, 'Oración completa y natural (+15)')}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            +15 pts · Frase completa + vocabulario
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAwardPoints(20, '¡Excelente diálogo! (+20)')}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 cursor-pointer"
          >
            +20 pts · ¡Excelente diálogo!
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAwardPoints(0, 'Necesita practicar de nuevo')}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 cursor-pointer"
          >
            0 pts · Repetir frase
          </button>
        </div>
      </div>
    </div>
  );
};
