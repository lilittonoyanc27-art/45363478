import React, { useRef, useState } from 'react';
import {
  Award,
  Download,
  Upload,
  Trash2,
  Volume2,
  Trophy,
  AlertTriangle,
  Star,
  Send,
  CheckCircle2,
  Loader2,
  Mic,
} from 'lucide-react';
import { ALL_WORLDS, WORLDS_MAP } from './dataGames';
import { playCorrectSound, speakEs } from './audio';
import {
  exportProgressJson,
  getAchievementLevel,
  getWorldCompletionPercent,
} from './storage';
import { formatTimeSec, SpPhrase } from './ClickSpanish';
import {
  deleteGameSessionFromCloud,
  deleteVoiceRecordingFromCloud,
  fetchProtectedAudioBlobUrl,
} from './firebaseClient';
import {
  AppStorageState,
  CloudGameSession,
  CloudVoiceRecording,
  GAME_CATALOG,
  LeaderboardEntry,
  MEDALS,
  PlayerId,
  UserRole,
} from './types';

interface StatsAndResultsProps {
  userRole: UserRole;
  storage: AppStorageState;
  leaderboard: Record<PlayerId, LeaderboardEntry | null>;
  cloudSessions: CloudGameSession[];
  cloudRecordings: CloudVoiceRecording[];
  onSubmitSessionToTeacher: (sessionId: string) => Promise<void>;
  onImportProgress: (newState: AppStorageState) => void;
  onResetProgress: () => void;
  onContinueAdventure: () => void;
}

export const StatsAndResults: React.FC<StatsAndResultsProps> = ({
  userRole,
  storage,
  leaderboard,
  cloudSessions,
  cloudRecordings,
  onSubmitSessionToTeacher,
  onImportProgress,
  onResetProgress,
  onContinueAdventure,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState('');
  const [hardFilterStudent, setHardFilterStudent] = useState<PlayerId>(
    userRole === 'gayane' ? 'gayane' : 'razmik'
  );
  const [sendingSessionId, setSendingSessionId] = useState<string | null>(null);
  const [sentSessionIds, setSentSessionIds] = useState<Record<string, boolean>>({});
  const [sendError, setSendError] = useState('');
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isTeacher = userRole === 'profesor';
  const ownStudentId: PlayerId = userRole === 'gayane' ? 'gayane' : 'razmik';

  const visiblePlayers = isTeacher
    ? [
        { p: storage.razmik, lvl: getAchievementLevel(storage.razmik.points), color: 'blue', dot: '🔵' },
        { p: storage.gayane, lvl: getAchievementLevel(storage.gayane.points), color: 'pink', dot: '🩷' },
      ]
    : [
        {
          p: storage[ownStudentId],
          lvl: getAchievementLevel(storage[ownStudentId].points),
          color: ownStudentId === 'razmik' ? 'blue' : 'pink',
          dot: ownStudentId === 'razmik' ? '🔵' : '🩷',
        },
      ];

  const allVocab = ALL_WORLDS.flatMap((w) => w.vocab);
  const activeHardStudent = isTeacher ? hardFilterStudent : ownStudentId;
  const hardVocabIds = storage[activeHardStudent].hardWords;
  const hardVocabList = allVocab.filter((v) => hardVocabIds.includes(v.id));

  const visibleSessions = isTeacher
    ? cloudSessions
    : cloudSessions.filter((s) => s.studentId === ownStudentId);
  const visibleRecordings = isTeacher
    ? cloudRecordings
    : cloudRecordings.filter((r) => r.studentId === ownStudentId);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppStorageState;
        if (!parsed.razmik || !parsed.gayane) {
          setImportError('El archivo JSON no tiene el formato válido de Razmik y Gayane.');
          return;
        }
        setImportError('');
        onImportProgress(parsed);
      } catch {
        setImportError('No se pudo leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleSendSession = async (sessionId: string) => {
    setSendingSessionId(sessionId);
    setSendError('');
    try {
      await onSubmitSessionToTeacher(sessionId);
      setSentSessionIds((prev) => ({ ...prev, [sessionId]: true }));
      playCorrectSound();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'No se pudo enviar al profesor.');
    } finally {
      setSendingSessionId(null);
    }
  };

  const handleLoadAudio = async (rec: CloudVoiceRecording) => {
    if (audioUrls[rec.id]) return;
    setLoadingAudioId(rec.id);
    try {
      const url = await fetchProtectedAudioBlobUrl(rec);
      setAudioUrls((prev) => ({ ...prev, [rec.id]: url }));
    } finally {
      setLoadingAudioId(null);
    }
  };

  const razmikLb = leaderboard.razmik;
  const gayaneLb = leaderboard.gayane;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500">
            Sincronización automática en la nube · {isTeacher ? 'Vista Profesor' : `Perfil privado de ${storage[ownStudentId].name}`}
          </div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">Resultados, Medallas y Progreso</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onContinueAdventure}
            className="px-4 py-2.5 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-xl cursor-pointer"
          >
            Continuar donde lo dejamos →
          </button>
          <button
            type="button"
            onClick={() => exportProgressJson(storage)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar progreso
          </button>
          {isTeacher && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Importar
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileImport}
                className="hidden"
              />
            </>
          )}
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-xl cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Reiniciar progreso
          </button>
        </div>
      </div>

      {importError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">{importError}</div>
      )}

      {confirmReset && (
        <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-red-950">
                ¿Seguro que quieres borrar {isTeacher ? 'el progreso de la aplicación' : 'tu progreso personal en la nube'}?
              </div>
              <div className="text-sm text-red-800">
                Esta acción reiniciará puntos, medallas e historial guardado. Puedes exportar primero un JSON.
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="px-4 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onResetProgress();
                setConfirmReset(false);
              }}
              className="px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-xl cursor-pointer"
            >
              Sí, reiniciar
            </button>
          </div>
        </div>
      )}

      {/* RAZMIK VS GAYANE — CLOUD COMPETITION LEADERBOARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="font-display text-xl font-extrabold text-slate-900">
              RAZMIK VS GAYANE — Clasificación en la nube
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Comparación general sin mostrar respuestas ni audios privados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <th className="py-2.5 pr-4">Alumno</th>
                <th className="py-2.5 px-3">Juegos completados</th>
                <th className="py-2.5 px-3">Respuestas correctas</th>
                <th className="py-2.5 px-3">% promedio</th>
                <th className="py-2.5 px-3">Mejor tiempo</th>
                <th className="py-2.5 pl-3 text-right">Puntos totales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono-num">
              <tr className="bg-blue-50/40">
                <td className="py-3 pr-4 font-sans font-extrabold text-blue-950">🔵 Razmik</td>
                <td className="py-3 px-3">{razmikLb?.gamesCompleted ?? 0}</td>
                <td className="py-3 px-3 text-emerald-700 font-bold">{razmikLb?.correctAnswers ?? storage.razmik.correctAnswers}</td>
                <td className="py-3 px-3">{razmikLb?.avgAccuracyPercent ?? 0}%</td>
                <td className="py-3 px-3">{razmikLb?.bestTimeSec ? formatTimeSec(razmikLb.bestTimeSec) : '—'}</td>
                <td className="py-3 pl-3 text-right font-extrabold text-blue-700">
                  {razmikLb?.totalPoints ?? storage.razmik.points} pts
                </td>
              </tr>
              <tr className="bg-pink-50/40">
                <td className="py-3 pr-4 font-sans font-extrabold text-pink-950">🩷 Gayane</td>
                <td className="py-3 px-3">{gayaneLb?.gamesCompleted ?? 0}</td>
                <td className="py-3 px-3 text-emerald-700 font-bold">{gayaneLb?.correctAnswers ?? storage.gayane.correctAnswers}</td>
                <td className="py-3 px-3">{gayaneLb?.avgAccuracyPercent ?? 0}%</td>
                <td className="py-3 px-3">{gayaneLb?.bestTimeSec ? formatTimeSec(gayaneLb.bestTimeSec) : '—'}</td>
                <td className="py-3 pl-3 text-right font-extrabold text-pink-700">
                  {gayaneLb?.totalPoints ?? storage.gayane.points} pts
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Private Detailed Progress Card(s) */}
      <div className={`grid grid-cols-1 ${visiblePlayers.length > 1 ? 'md:grid-cols-2' : ''} gap-6`}>
        {visiblePlayers.map(({ p, lvl, color, dot }) => (
          <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-slate-900">
                  {p.name} {dot}
                </h2>
                <div className="text-sm font-medium text-slate-600">
                  Nivel {lvl.level}: {lvl.titleEs} · {lvl.titleHy}
                </div>
              </div>
              <div className={`font-mono-num text-3xl font-extrabold ${color === 'blue' ? 'text-blue-600' : 'text-pink-600'}`}>
                {p.points} pts
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-mono-num text-xl font-bold text-slate-900">{p.wins}</div>
                <div className="text-xs text-slate-500">Victorias</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-mono-num text-xl font-bold text-emerald-700">{p.correctAnswers}</div>
                <div className="text-xs text-slate-500">Aciertos</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-mono-num text-xl font-bold text-red-600">{p.errors}</div>
                <div className="text-xs text-slate-500">Errores</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-mono-num text-xl font-bold text-amber-600">{p.bestStreak}</div>
                <div className="text-xs text-slate-500">Mejor racha</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Palabras dominadas: {p.learnedWords.length}/{allVocab.length}</span>
                <span>Próximo nivel: {lvl.nextPoints} pts</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${color === 'blue' ? 'bg-blue-600' : 'bg-pink-600'}`}
                  style={{ width: `${Math.min(100, Math.round((p.points / lvl.nextPoints) * 100))}%` }}
                />
              </div>
            </div>

            {Object.keys(p.bestTimes).length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-500 mb-1.5">Mejores tiempos (Récords):</div>
                <div className="flex flex-wrap gap-3 text-xs font-mono-num text-slate-700">
                  {Object.entries(p.bestTimes).map(([gid, sec]) => {
                    const g = GAME_CATALOG.find((x) => x.id === gid);
                    return (
                      <span key={gid}>
                        {g?.titleEs || gid}: <strong>{formatTimeSec(sec)}</strong>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cloud Sessions History (Private per Student, or All for Teacher) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Tus resultados guardados en la nube ({visibleSessions.length})
          </h2>
          {sendError && <span className="text-xs font-semibold text-red-700">{sendError}</span>}
        </div>

        {visibleSessions.length === 0 ? (
          <div className="text-sm text-slate-500">
            Aún no hay partidas guardadas en la nube. ¡Completa un reto o un juego para verlo aquí!
          </div>
        ) : (
          <div className="space-y-3">
            {visibleSessions.slice(0, 20).map((sess) => {
              const isSent = sess.submittedToTeacher || sentSessionIds[sess.id];
              return (
                <div
                  key={sess.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 text-sm">
                      {isTeacher ? `${sess.studentName} · ` : ''}
                      {sess.gameTitleEs} · {sess.world === 'todos' ? 'Todos los mundos' : WORLDS_MAP[sess.world]?.nameEs}
                    </div>
                    <div className="text-xs font-mono-num text-slate-600">
                      {sess.createdAtIso ? new Date(sess.createdAtIso).toLocaleString('es-ES') : 'Reciente'} · Preguntas:{' '}
                      {sess.totalQuestions} · Correctas: <strong className="text-emerald-700">{sess.correctCount}</strong> ·
                      Errores: <strong className="text-red-700">{sess.incorrectCount}</strong> · Tiempo:{' '}
                      {formatTimeSec(sess.durationSec)} · <strong>{sess.accuracyPercent}%</strong> ({sess.score} pts)
                    </div>
                    {sess.teacherNote && (
                      <div className="text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 inline-block">
                        Comentario del profesor: {sess.teacherNote}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSent ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-900 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resultado enviado correctamente
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={sendingSessionId === sess.id}
                        onClick={() => void handleSendSession(sess.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl cursor-pointer disabled:opacity-60"
                      >
                        {sendingSessionId === sess.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Enviar resultados al profesor
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void deleteGameSessionFromCloud(sess.id)}
                      aria-label="Eliminar partida"
                      className="p-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cloud Voice Recordings & Teacher Comments */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-blue-600" />
          <h2 className="font-display text-xl font-bold text-slate-900">
            Mis grabaciones de voz y comentarios del profesor ({visibleRecordings.length})
          </h2>
        </div>

        {visibleRecordings.length === 0 ? (
          <div className="text-sm text-slate-500">
            Todavía no has enviado grabaciones de voz. Pulsa «🎙️ Grabar mi respuesta» en cualquier actividad oral.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleRecordings.map((rec) => (
              <div key={rec.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500 font-semibold">
                      {rec.createdAtIso ? new Date(rec.createdAtIso).toLocaleString('es-ES') : 'Reciente'} ·{' '}
                      {formatTimeSec(rec.durationSec)}
                    </div>
                    <div className="font-bold text-sm text-slate-900">{rec.questionEs}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                        rec.status === 'reviewed'
                          ? rec.verdict === 'correcto'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {rec.status === 'reviewed'
                        ? rec.verdict === 'correcto'
                          ? `✅ Correcto (+${rec.teacherPoints} pts)`
                          : `🔁 Necesita practicar (+${rec.teacherPoints} pts)`
                        : 'Esperando revisión'}
                    </span>
                    <button
                      type="button"
                      onClick={() => void deleteVoiceRecordingFromCloud(rec)}
                      aria-label="Eliminar grabación"
                      className="p-1.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {rec.teacherComment && (
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-950 font-semibold">
                    Profesor: {rec.teacherComment}
                  </div>
                )}

                <div>
                  {!audioUrls[rec.id] ? (
                    <button
                      type="button"
                      disabled={loadingAudioId === rec.id}
                      onClick={() => void handleLoadAudio(rec)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      {loadingAudioId === rec.id ? 'Cargando...' : '🔊 Escuchar mi audio'}
                    </button>
                  ) : (
                    <audio controls src={audioUrls[rec.id]} className="h-9 w-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* World Completion Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-900">Progreso por mundo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ALL_WORLDS.map((w) => {
            const pct = isTeacher
              ? getWorldCompletionPercent(w, storage.razmik, storage.gayane)
              : getWorldCompletionPercent(w, storage[ownStudentId], storage[ownStudentId]);
            return (
              <div key={w.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{w.icon} {w.nameEs}</span>
                  <span className="font-mono-num text-sm">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Medals Gallery */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h2 className="font-display text-xl font-bold text-slate-900">Colección de Medallas y Premios</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MEDALS.map((m) => {
            const rHas = storage.razmik.medals.includes(m.id);
            const gHas = storage.gayane.medals.includes(m.id);
            const activeHas = isTeacher ? rHas || gHas : storage[ownStudentId].medals.includes(m.id);
            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  activeHas ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200 opacity-75'
                }`}
              >
                <span className="text-3xl">{m.icon}</span>
                <div className="space-y-1">
                  <div className="font-display font-bold text-slate-900">{m.nameEs}</div>
                  <div className="text-xs text-slate-600">{m.descHy}</div>
                  <div className="text-xs font-semibold pt-1">
                    {isTeacher
                      ? `${rHas ? '🔵 Razmik ✓ ' : '🔵 — '} · ${gHas ? '🩷 Gayane ✓' : '🩷 —'}`
                      : activeHas
                        ? 'Desbloqueada ✓'
                        : 'Pendiente'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hard Words Review */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <h2 className="font-display text-xl font-bold text-slate-900">Repasar palabras difíciles</h2>
          </div>
          {isTeacher && (
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setHardFilterStudent('razmik')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                  hardFilterStudent === 'razmik' ? 'bg-blue-600 text-white' : 'text-slate-600'
                }`}
              >
                Razmik 🔵 ({storage.razmik.hardWords.length})
              </button>
              <button
                type="button"
                onClick={() => setHardFilterStudent('gayane')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                  hardFilterStudent === 'gayane' ? 'bg-pink-600 text-white' : 'text-slate-600'
                }`}
              >
                Gayane 🩷 ({storage.gayane.hardWords.length})
              </button>
            </div>
          )}
        </div>

        {hardVocabList.length === 0 ? (
          <div className="text-sm text-slate-500">
            No hay palabras difíciles guardadas todavía. En la sección «Aprendemos antes de jugar» pulsa «Guardar» en cualquier palabra que quieras practicar más.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {hardVocabList.map((w) => (
              <div key={w.id} className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between gap-2">
                <div className="font-bold text-slate-900">
                  {w.icon} <SpPhrase es={w.es} hy={w.hy} showAudio={false} />
                </div>
                <button
                  type="button"
                  onClick={() => speakEs(w.es, true)}
                  className="p-2 rounded-lg bg-white border border-amber-200 hover:bg-amber-100 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
