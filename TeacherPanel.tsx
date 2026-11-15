import React, { useEffect, useState } from 'react';
import {
  Sliders,
  Play,
  Award,
  Users,
  KeyRound,
  Volume2,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { ALL_WORLDS, WORLDS_MAP } from './dataGames';
import { formatTimeSec } from './ClickSpanish';
import {
  auth,
  deleteGameSessionFromCloud,
  deleteVoiceRecordingFromCloud,
  fetchProtectedAudioBlobUrl,
  fetchTeacherCodesSettings,
  reviewVoiceRecordingInCloud,
  updateSessionTeacherNote,
  updateStudentAccessCodes,
} from './firebaseClient';
import {
  ASSETS,
  CloudGameSession,
  CloudVoiceRecording,
  DifficultyLevel,
  GAME_CATALOG,
  GameId,
  LeaderboardEntry,
  PlayerId,
  PlayerProgress,
  TeacherConfig,
  TimerMode,
  UserRole,
  WorldId,
} from './types';

interface TeacherPanelProps {
  userRole: UserRole;
  config: TeacherConfig;
  onUpdateConfig: (next: TeacherConfig) => void;
  onStartConfiguredGame: () => void;
  onManualBonus: (player: PlayerId, points: number) => void;
  razmikProgress: PlayerProgress & { totalTimeSec?: number; gamesCompleted?: number };
  gayaneProgress: PlayerProgress & { totalTimeSec?: number; gamesCompleted?: number };
  leaderboard: Record<PlayerId, LeaderboardEntry | null>;
  sessions: CloudGameSession[];
  recordings: CloudVoiceRecording[];
}

export const TeacherPanel: React.FC<TeacherPanelProps> = ({
  userRole,
  config,
  onUpdateConfig,
  onStartConfiguredGame,
  onManualBonus,
  razmikProgress,
  gayaneProgress,
  leaderboard,
  sessions,
  recordings,
}) => {
  const [subTab, setSubTab] = useState<'alumnos' | 'codigos' | 'clase'>('alumnos');
  const [selectedStudent, setSelectedStudent] = useState<PlayerId>('razmik');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  // Voice recording review state
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<Record<string, string>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [pointsDrafts, setPointsDrafts] = useState<Record<string, number>>({});
  const [verdictDrafts, setVerdictDrafts] = useState<Record<string, 'correcto' | 'necesita_practicar'>>({});
  const [savingRecId, setSavingRecId] = useState<string | null>(null);

  // Access codes state
  const [razmikCodeInput, setRazmikCodeInput] = useState('RAZMIK-2026');
  const [gayaneCodeInput, setGayaneCodeInput] = useState('GAYANE-2026');
  const [savingCodes, setSavingCodes] = useState(false);
  const [codesMsg, setCodesMsg] = useState('');
  const [codesErr, setCodesErr] = useState('');

  useEffect(() => {
    if (userRole !== 'profesor') return;
    fetchTeacherCodesSettings()
      .then((res) => {
        if (res) {
          setRazmikCodeInput(res.razmikCodeLabel || 'RAZMIK-2026');
          setGayaneCodeInput(res.gayaneCodeLabel || 'GAYANE-2026');
        }
      })
      .catch(() => {});
  }, [userRole]);

  if (userRole !== 'profesor') {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-3 max-w-lg mx-auto">
        <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
        <h2 className="font-display text-2xl font-extrabold text-slate-900">Acceso restringido</h2>
        <p className="text-sm text-slate-600">
          Solo la cuenta verificada del profesor puede abrir el Panel del Profesor.
        </p>
      </div>
    );
  }

  const studentSessions = sessions.filter((s) => s.studentId === selectedStudent);
  const studentRecordings = recordings.filter((r) => r.studentId === selectedStudent);

  const handleLoadAudio = async (rec: CloudVoiceRecording) => {
    if (audioUrls[rec.id]) return;
    setLoadingAudioId(rec.id);
    setAudioError((prev) => ({ ...prev, [rec.id]: '' }));
    try {
      const url = await fetchProtectedAudioBlobUrl(rec);
      setAudioUrls((prev) => ({ ...prev, [rec.id]: url }));
    } catch (err) {
      setAudioError((prev) => ({
        ...prev,
        [rec.id]: err instanceof Error ? err.message : 'No se pudo cargar el audio.',
      }));
    } finally {
      setLoadingAudioId(null);
    }
  };

  const handleSaveRecordingReview = async (rec: CloudVoiceRecording, verdictOverride?: 'correcto' | 'necesita_practicar') => {
    const verdict = verdictOverride || verdictDrafts[rec.id] || 'correcto';
    const teacherComment = commentDrafts[rec.id] ?? rec.teacherComment ?? '';
    const teacherPoints =
      pointsDrafts[rec.id] !== undefined
        ? pointsDrafts[rec.id]
        : rec.teacherPoints || (verdict === 'correcto' ? 15 : 5);

    setSavingRecId(rec.id);
    try {
      await reviewVoiceRecordingInCloud({
        recordingId: rec.id,
        verdict,
        teacherComment,
        teacherPoints,
      });
      const prevAwarded = rec.status === 'reviewed' ? rec.teacherPoints : 0;
      const diff = teacherPoints - prevAwarded;
      if (diff > 0) {
        onManualBonus(rec.studentId, diff);
      }
    } finally {
      setSavingRecId(null);
    }
  };

  const handleSaveSessionNote = async (sess: CloudGameSession) => {
    const note = noteDrafts[sess.id] ?? sess.teacherNote ?? '';
    setSavingNoteId(sess.id);
    try {
      await updateSessionTeacherNote(sess.id, note);
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleSaveCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSavingCodes(true);
    setCodesMsg('');
    setCodesErr('');
    try {
      const saved = await updateStudentAccessCodes(auth.currentUser.uid, razmikCodeInput, gayaneCodeInput);
      setRazmikCodeInput(saved.razmikCodeLabel);
      setGayaneCodeInput(saved.gayaneCodeLabel);
      setCodesMsg('Códigos actualizados y activados correctamente.');
    } catch (err) {
      setCodesErr(err instanceof Error ? err.message : 'No se pudieron actualizar los códigos.');
    } finally {
      setSavingCodes(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            Seguimiento en tiempo real · Firebase Cloud
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Sliders className="w-7 h-7 text-blue-600" />
            PANEL DEL PROFESOR — Ուսուցչի վահանակ
          </h1>
        </div>

        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl">
          {[
            { id: 'alumnos' as const, label: 'Alumnos y Resultados', icon: Users },
            { id: 'codigos' as const, label: 'Códigos de acceso', icon: KeyRound },
            { id: 'clase' as const, label: 'Configurador de clase', icon: Sliders },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg cursor-pointer ${
                  subTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================== */}
      {/* TAB 1: ALUMNOS, RESULTADOS Y GRABACIONES DE VOZ */}
      {/* ================================================================== */}
      {subTab === 'alumnos' && (
        <div className="space-y-6">
          {/* Two Separate Student Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(
              [
                {
                  id: 'razmik' as PlayerId,
                  name: 'RAZMIK',
                  dot: '🔵',
                  avatar: ASSETS.razmikAvatar,
                  prog: razmikProgress,
                  lb: leaderboard.razmik,
                  accent: 'blue',
                },
                {
                  id: 'gayane' as PlayerId,
                  name: 'GAYANE',
                  dot: '🩷',
                  avatar: ASSETS.gayaneAvatar,
                  prog: gayaneProgress,
                  lb: leaderboard.gayane,
                  accent: 'pink',
                },
              ] as const
            ).map((st) => {
              const sList = sessions.filter((s) => s.studentId === st.id);
              const rList = recordings.filter((r) => r.studentId === st.id);
              const pendingRecs = rList.filter((r) => r.status === 'pending').length;
              const isSelected = selectedStudent === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStudent(st.id)}
                  className={`text-left rounded-2xl border-2 p-5 transition-all cursor-pointer space-y-4 ${
                    isSelected
                      ? st.accent === 'blue'
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-pink-600 bg-pink-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={st.avatar}
                        alt={st.name}
                        referrerPolicy="no-referrer"
                        className={`w-16 h-16 rounded-2xl object-cover border-2 ${
                          st.accent === 'blue' ? 'border-blue-500' : 'border-pink-500'
                        }`}
                      />
                      <div>
                        <div className="font-display text-2xl font-extrabold text-slate-900">
                          {st.name} {st.dot}
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          {isSelected ? 'Mostrando historial detallado ↓' : 'Pulsa para abrir historial completo'}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-mono-num text-2xl font-extrabold ${
                        st.accent === 'blue' ? 'text-blue-700' : 'text-pink-700'
                      }`}
                    >
                      {st.prog.points} pts
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <div className="font-mono-num text-base font-extrabold text-slate-900">{sList.length}</div>
                      <div className="text-slate-500">Partidas</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <div className="font-mono-num text-base font-extrabold text-emerald-700">
                        {st.lb?.avgAccuracyPercent ?? 0}%
                      </div>
                      <div className="text-slate-500">Promedio</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <div className="font-mono-num text-base font-extrabold text-indigo-700">
                        {rList.length}
                      </div>
                      <div className="text-slate-500">Audios</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <div className="font-mono-num text-base font-extrabold text-amber-700">
                        {pendingRecs}
                      </div>
                      <div className="text-slate-500">Pendientes</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Student Detailed Sessions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-xl font-extrabold text-slate-900">
              Historial de {selectedStudent === 'razmik' ? 'Razmik 🔵' : 'Gayane 🩷'} ({studentSessions.length} actividades)
            </h2>

            {studentSessions.length === 0 ? (
              <div className="text-sm text-slate-500 py-4">
                Todavía no hay resultados guardados en la nube para {selectedStudent === 'razmik' ? 'Razmik' : 'Gayane'}.
              </div>
            ) : (
              <div className="space-y-3">
                {studentSessions.map((sess) => {
                  const expanded = expandedSessionId === sess.id;
                  const dateFormatted = sess.createdAtIso
                    ? new Date(sess.createdAtIso).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Reciente';
                  return (
                    <div key={sess.id} className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-sm font-extrabold text-slate-900">
                            {sess.studentName} — {dateFormatted} | Juego: {sess.gameTitleEs}
                          </div>
                          <div className="text-xs font-mono-num text-slate-700">
                            Tema: {sess.world === 'todos' ? 'Todos' : WORLDS_MAP[sess.world]?.nameEs || sess.world} ·
                            Preguntas: <strong>{sess.totalQuestions}</strong> | Correctas:{' '}
                            <strong className="text-emerald-700">{sess.correctCount}</strong> | Incorrectas:{' '}
                            <strong className="text-red-700">{sess.incorrectCount}</strong> | Tiempo:{' '}
                            <strong>{formatTimeSec(sess.durationSec)}</strong> | Resultado:{' '}
                            <strong className="text-indigo-700">{sess.accuracyPercent}%</strong> | Puntos:{' '}
                            <strong>{sess.score}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {sess.submittedToTeacher && (
                            <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-900 rounded-lg">
                              Enviado ✓
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setExpandedSessionId(expanded ? null : sess.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg cursor-pointer"
                          >
                            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {expanded ? 'Ocultar detalle' : 'Ver respuestas'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteGameSessionFromCloud(sess.id)}
                            aria-label="Eliminar sesión"
                            className="p-1.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="space-y-3 pt-2 border-t border-slate-200">
                          {sess.answersSummary.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto space-y-1.5 bg-white border border-slate-200 rounded-xl p-3 text-xs">
                              {sess.answersSummary.map((ans, idx) => (
                                <div key={idx} className="flex items-start justify-between gap-2 py-1 border-b border-slate-100 last:border-0">
                                  <div>
                                    <span className="font-semibold text-slate-900">
                                      {idx + 1}. {ans.questionEs}
                                    </span>
                                    <div className="text-slate-600">
                                      Eligió:{' '}
                                      <strong className={ans.isCorrect ? 'text-emerald-700' : 'text-red-700'}>
                                        {ans.chosenEs}
                                      </strong>{' '}
                                      {!ans.isCorrect && `· Correcta: ${ans.correctEs}`}
                                    </div>
                                  </div>
                                  <span>{ans.isCorrect ? '✅' : '❌'}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500">Sin desglose individual de preguntas en esta ronda.</div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={noteDrafts[sess.id] ?? sess.teacherNote ?? ''}
                              onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [sess.id]: e.target.value }))}
                              placeholder="Escribir comentario del profesor sobre esta partida..."
                              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                            />
                            <button
                              type="button"
                              disabled={savingNoteId === sess.id}
                              onClick={() => void handleSaveSessionNote(sess)}
                              className="px-4 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl cursor-pointer"
                            >
                              {savingNoteId === sess.id ? 'Guardando...' : 'Guardar comentario'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Student Voice Recordings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-blue-600" />
              Grabaciones de voz de {selectedStudent === 'razmik' ? 'Razmik 🔵' : 'Gayane 🩷'} ({studentRecordings.length})
            </h2>

            {studentRecordings.length === 0 ? (
              <div className="text-sm text-slate-500 py-4">
                No hay grabaciones de voz enviadas todavía por este alumno.
              </div>
            ) : (
              <div className="space-y-4">
                {studentRecordings.map((rec) => {
                  const currentVerdict =
                    verdictDrafts[rec.id] ||
                    (rec.verdict === 'correcto' || rec.verdict === 'necesita_practicar' ? rec.verdict : 'correcto');
                  const currentComment = commentDrafts[rec.id] ?? rec.teacherComment ?? '';
                  const currentPts = pointsDrafts[rec.id] ?? rec.teacherPoints ?? 15;
                  const blobUrl = audioUrls[rec.id];

                  return (
                    <div key={rec.id} className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/60">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-500">
                            {rec.createdAtIso ? new Date(rec.createdAtIso).toLocaleString('es-ES') : 'Reciente'} ·{' '}
                            {rec.world === 'todos' ? 'General' : WORLDS_MAP[rec.world]?.nameEs || rec.world} ·{' '}
                            {formatTimeSec(rec.durationSec)}
                          </div>
                          <div className="font-bold text-slate-900">{rec.questionEs}</div>
                          {rec.transcriptEs && (
                            <div className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                              <strong>Transcripción:</strong> «{rec.transcriptEs}»
                            </div>
                          )}
                          {rec.aiSuggestionEs && (
                            <div className="text-xs text-blue-800">{rec.aiSuggestionEs}</div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                              rec.status === 'reviewed'
                                ? rec.verdict === 'correcto'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-amber-100 text-amber-900'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {rec.status === 'reviewed'
                              ? rec.verdict === 'correcto'
                                ? `✅ Correcto (+${rec.teacherPoints} pts)`
                                : `🔁 Necesita practicar (+${rec.teacherPoints} pts)`
                              : 'Pendiente de revisar'}
                          </span>
                          <button
                            type="button"
                            onClick={() => void deleteVoiceRecordingFromCloud(rec)}
                            aria-label="Eliminar grabación"
                            className="p-1.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Audio Playback */}
                      <div className="flex flex-wrap items-center gap-3">
                        {!blobUrl ? (
                          <button
                            type="button"
                            disabled={loadingAudioId === rec.id}
                            onClick={() => void handleLoadAudio(rec)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl cursor-pointer"
                          >
                            {loadingAudioId === rec.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                            {loadingAudioId === rec.id ? 'Cargando audio...' : '🔊 Escuchar grabación'}
                          </button>
                        ) : (
                          <audio controls src={blobUrl} autoPlay className="h-9 flex-1 min-w-[240px]" />
                        )}
                        {audioError[rec.id] && (
                          <span className="text-xs font-semibold text-red-700">{audioError[rec.id]}</span>
                        )}
                      </div>

                      {/* Teacher Review Controls */}
                      <div className="pt-2 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                        <div className="lg:col-span-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setVerdictDrafts((p) => ({ ...p, [rec.id]: 'correcto' }));
                              void handleSaveRecordingReview(rec, 'correcto');
                            }}
                            className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl cursor-pointer ${
                              currentVerdict === 'correcto'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white border border-slate-300 text-slate-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ✅ Correcto
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setVerdictDrafts((p) => ({ ...p, [rec.id]: 'necesita_practicar' }));
                              void handleSaveRecordingReview(rec, 'necesita_practicar');
                            }}
                            className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl cursor-pointer ${
                              currentVerdict === 'necesita_practicar'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-white border border-slate-300 text-slate-700'
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            🔁 Necesita practicar
                          </button>
                        </div>

                        <div className="lg:col-span-5 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={currentComment}
                            onChange={(e) => setCommentDrafts((p) => ({ ...p, [rec.id]: e.target.value }))}
                            placeholder="Comentario para el alumno..."
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                          />
                        </div>

                        <div className="lg:col-span-3 flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={30}
                            value={currentPts}
                            onChange={(e) =>
                              setPointsDrafts((p) => ({ ...p, [rec.id]: Number(e.target.value) || 0 }))
                            }
                            className="w-16 rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs font-mono-num font-bold"
                          />
                          <button
                            type="button"
                            disabled={savingRecId === rec.id}
                            onClick={() => void handleSaveRecordingReview(rec)}
                            className="flex-1 px-3 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl cursor-pointer"
                          >
                            {savingRecId === rec.id ? '...' : 'Guardar nota'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 2: CÓDIGOS DE ACCESO DE RAZMIK Y GAYANE */}
      {/* ================================================================== */}
      {subTab === 'codigos' && (
        <form onSubmit={handleSaveCodes} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 max-w-2xl">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              Códigos individuales de acceso
            </h2>
            <p className="text-xs text-slate-600">
              Entrega a cada alumno su código personal para que pueda entrar desde cualquier teléfono, tablet o computadora sin ver los datos del compañero.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-blue-900">Código para 👦 Razmik</label>
              <input
                type="text"
                value={razmikCodeInput}
                onChange={(e) => setRazmikCodeInput(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono-num font-bold uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-pink-900">Código para 👧 Gayane</label>
              <input
                type="text"
                value={gayaneCodeInput}
                onChange={(e) => setGayaneCodeInput(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono-num font-bold uppercase"
              />
            </div>
          </div>

          {codesErr && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800">{codesErr}</div>
          )}
          {codesMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
              {codesMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={savingCodes}
            className="px-6 py-3 text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl cursor-pointer disabled:opacity-60"
          >
            {savingCodes ? 'Guardando códigos...' : 'Guardar y activar códigos'}
          </button>
        </form>
      )}

      {/* ================================================================== */}
      {/* TAB 3: CONFIGURADOR DE CLASE Y BONOS MANUALES */}
      {/* ================================================================== */}
      {subTab === 'clase' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-900">1. Tema / Mundo</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ ...config, selectedWorld: 'todos' })}
                  className={`p-2.5 text-xs font-semibold rounded-xl border cursor-pointer ${
                    config.selectedWorld === 'todos' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  🌍 Todos
                </button>
                {ALL_WORLDS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onUpdateConfig({ ...config, selectedWorld: w.id as WorldId })}
                    className={`p-2.5 text-xs font-semibold rounded-xl border cursor-pointer ${
                      config.selectedWorld === w.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {w.icon} {w.nameEs.replace('En el ', '')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-900">2. Tipo de juego ({GAME_CATALOG.length} disponibles)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {GAME_CATALOG.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onUpdateConfig({ ...config, selectedGame: g.id as GameId, timerSeconds: g.defaultSeconds })}
                    className={`p-3 rounded-xl border text-left cursor-pointer ${
                      config.selectedGame === g.id ? 'bg-blue-50 border-blue-500 text-blue-950' : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-bold">{g.emoji} {g.titleEs}</div>
                    <div className="text-xs text-slate-500">{g.descEs}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Número de rondas</label>
                <select
                  value={config.roundsCount}
                  onChange={(e) => onUpdateConfig({ ...config, roundsCount: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  {[4, 6, 8, 10].map((n) => (
                    <option key={n} value={n}>{n} rondas</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Duración del temporizador</label>
                <select
                  value={config.timerSeconds}
                  onChange={(e) => onUpdateConfig({ ...config, timerSeconds: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  {[15, 20, 30, 45, 60, 90, 120].map((s) => (
                    <option key={s} value={s}>{s} segundos</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Modo de tiempo</label>
                <select
                  value={config.timerMode}
                  onChange={(e) => onUpdateConfig({ ...config, timerMode: e.target.value as TimerMode })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="contrarreloj">Contrarreloj (cuenta atrás)</option>
                  <option value="cronometro">Cronómetro (subiendo)</option>
                  <option value="dialogo">Modo Diálogo</option>
                  <option value="record">Modo Récord</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Nivel de dificultad comunicativa</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { lvl: 1 as DifficultyLevel, label: 'Nivel 1 — Con ayuda', sub: 'Opciones, pistas y traducción' },
                  { lvl: 2 as DifficultyLevel, label: 'Nivel 2 — Hablo solo', sub: 'Situación y palabras clave' },
                  { lvl: 3 as DifficultyLevel, label: 'Nivel 3 — Conversación real', sub: 'Sin opciones predefinidas' },
                ].map((d) => (
                  <button
                    key={d.lvl}
                    type="button"
                    onClick={() => onUpdateConfig({ ...config, difficulty: d.lvl })}
                    className={`p-3 rounded-xl border text-left cursor-pointer ${
                      config.difficulty === d.lvl ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{d.label}</div>
                    <div className={`text-[11px] ${config.difficulty === d.lvl ? 'text-slate-300' : 'text-slate-500'}`}>{d.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onStartConfiguredGame}
              className="w-full py-3.5 px-6 text-base font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5" />
              Lanzar juego con esta configuración
            </button>
          </div>

          {/* Manual Bonus Oral Points */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="font-display text-lg font-bold text-slate-900">Puntos manuales por expresión oral</h2>
            </div>
            <p className="text-xs text-slate-600">
              El profesor puede premiar manualmente la pronunciación, la cortesía o una buena pregunta espontánea en clase.
            </p>

            <div className="space-y-3 p-4 rounded-xl bg-blue-50/70 border border-blue-200">
              <div className="font-bold text-blue-900">RAZMIK 🔵</div>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 15].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => onManualBonus('razmik', pts)}
                    className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg cursor-pointer"
                  >
                    +{pts} pts
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-pink-50/70 border border-pink-200">
              <div className="font-bold text-pink-900">GAYANE 🩷</div>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 15].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => onManualBonus('gayane', pts)}
                    className="px-3 py-1.5 text-xs font-bold bg-pink-600 text-white hover:bg-pink-700 rounded-lg cursor-pointer"
                  >
                    +{pts} pts
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
