import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { deleteObject, getBlob, getStorage, ref, uploadBytes } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';
import {
  CloudAnswerSummary,
  CloudGameSession,
  CloudVoiceRecording,
  GameId,
  LeaderboardEntry,
  PlayerId,
  PlayerProgress,
  TeacherCodesSettings,
  UserProfileDoc,
  UserRole,
  WorldId,
} from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
storage.maxUploadRetryTime = 5000;
storage.maxOperationRetryTime = 5000;

export const TEACHER_EMAIL = 'lilit.tonoyanc27@gmail.com';

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (val) => {
        clearTimeout(id);
        resolve(val);
      },
      (err) => {
        clearTimeout(id);
        reject(err);
      }
    );
  });
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Mandatory Firestore boot connectivity test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export async function sha256Hex(raw: string): Promise<string> {
  const clean = raw.trim().toUpperCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(clean);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function fetchUserProfile(uid: string): Promise<UserProfileDoc | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfileDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function claimStudentProfile(
  user: User,
  role: 'razmik' | 'gayane',
  accessCode: string
): Promise<UserProfileDoc> {
  const cleanCode = accessCode.trim().toUpperCase();
  if (cleanCode.length < 4 || cleanCode.length > 32) {
    throw new Error('El código de acceso debe tener entre 4 y 32 caracteres.');
  }
  const codeHash = await sha256Hex(cleanCode);
  const displayName = role === 'razmik' ? 'Razmik' : 'Gayane';
  const path = `users/${user.uid}`;
  try {
    const existingSnap = await getDoc(doc(db, 'users', user.uid));
    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as UserProfileDoc;
      if (existingData.role !== role) {
        throw new Error(
          `Esta cuenta de Google ya está vinculada al perfil de ${existingData.displayName}. Usa otra cuenta o pide ayuda al profesor.`
        );
      }
      return existingData;
    }

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      role,
      displayName,
      codeHash,
      parentalConsentGranted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const createdSnap = await getDoc(doc(db, 'users', user.uid));
    return createdSnap.data() as UserProfileDoc;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Esta cuenta de Google')) {
      throw error;
    }
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Missing or insufficient permissions') || msg.includes('PERMISSION_DENIED')) {
      throw new Error(
        'Código de acceso incorrecto o aún no activado por el profesor. Pide el código correcto al profesor.'
      );
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function claimTeacherProfile(user: User): Promise<UserProfileDoc> {
  const email = (user.email || '').toLowerCase();
  if (!user.emailVerified || email !== TEACHER_EMAIL.toLowerCase()) {
    throw new Error(
      `Acceso restringido: solo la cuenta autorizada del profesor (${TEACHER_EMAIL}) puede abrir el Panel del Profesor.`
    );
  }

  const adminPath = `admins/${user.uid}`;
  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    if (!adminSnap.exists()) {
      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        email: user.email || TEACHER_EMAIL,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, adminPath);
  }

  const userPath = `users/${user.uid}`;
  try {
    const userSnap = await getDoc(doc(db, 'users', user.uid));
    if (!userSnap.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        role: 'profesor' as UserRole,
        displayName: 'Profesor',
        codeHash: '',
        parentalConsentGranted: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await ensureTeacherAccessCodesInitialized(user.uid);
    const finalSnap = await getDoc(doc(db, 'users', user.uid));
    return finalSnap.data() as UserProfileDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function fetchTeacherCodesSettings(): Promise<TeacherCodesSettings | null> {
  const settingsPath = 'teacher_settings/codes';
  try {
    const snap = await getDoc(doc(db, 'teacher_settings', 'codes'));
    if (!snap.exists()) return null;
    return snap.data() as TeacherCodesSettings;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, settingsPath);
  }
}

export async function ensureTeacherAccessCodesInitialized(teacherUid: string): Promise<TeacherCodesSettings> {
  const settingsPath = 'teacher_settings/codes';
  try {
    const snap = await getDoc(doc(db, 'teacher_settings', 'codes'));
    if (snap.exists()) {
      return snap.data() as TeacherCodesSettings;
    }
    const defaultRazmik = 'RAZMIK-2026';
    const defaultGayane = 'GAYANE-2026';
    return await updateStudentAccessCodes(teacherUid, defaultRazmik, defaultGayane);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, settingsPath);
  }
}

export async function updateStudentAccessCodes(
  teacherUid: string,
  razmikCode: string,
  gayaneCode: string
): Promise<TeacherCodesSettings> {
  const rClean = razmikCode.trim().toUpperCase();
  const gClean = gayaneCode.trim().toUpperCase();
  if (rClean.length < 4 || rClean.length > 32 || gClean.length < 4 || gClean.length > 32) {
    throw new Error('Cada código debe tener entre 4 y 32 caracteres.');
  }
  if (rClean === gClean) {
    throw new Error('Los códigos de Razmik y Gayane deben ser distintos.');
  }
  const rHash = await sha256Hex(rClean);
  const gHash = await sha256Hex(gClean);

  const settingsPath = 'teacher_settings/codes';
  try {
    const oldSnap = await getDoc(doc(db, 'teacher_settings', 'codes'));
    const batch = writeBatch(db);
    if (oldSnap.exists()) {
      const oldData = oldSnap.data() as TeacherCodesSettings;
      if (oldData.razmikCodeHash && oldData.razmikCodeHash !== rHash) {
        batch.delete(doc(db, 'access_codes', oldData.razmikCodeHash));
      }
      if (oldData.gayaneCodeHash && oldData.gayaneCodeHash !== gHash) {
        batch.delete(doc(db, 'access_codes', oldData.gayaneCodeHash));
      }
    }
    batch.set(doc(db, 'access_codes', rHash), {
      role: 'razmik',
      updatedBy: teacherUid,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, 'access_codes', gHash), {
      role: 'gayane',
      updatedBy: teacherUid,
      createdAt: serverTimestamp(),
    });
    const nextSettings: TeacherCodesSettings = {
      razmikCodeHash: rHash,
      gayaneCodeHash: gHash,
      razmikCodeLabel: rClean,
      gayaneCodeLabel: gClean,
    };
    batch.set(doc(db, 'teacher_settings', 'codes'), {
      ...nextSettings,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    return nextSettings;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, settingsPath);
  }
}

export async function grantParentalConsentInCloud(uid: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      parentalConsentGranted: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveStudentProgressToCloud(
  studentId: PlayerId,
  progress: PlayerProgress,
  extra: { totalTimeSec: number; gamesCompleted: number; lastWorld: WorldId; lastSection: string }
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const path = `student_progress/${studentId}`;
  try {
    await setDoc(doc(db, 'student_progress', studentId), {
      studentId,
      lastUpdatedByUid: uid,
      name: progress.name.slice(0, 40),
      points: Math.max(0, Math.min(1000000, progress.points)),
      wins: Math.max(0, Math.min(100000, progress.wins)),
      correctAnswers: Math.max(0, Math.min(500000, progress.correctAnswers)),
      errors: Math.max(0, Math.min(500000, progress.errors)),
      streak: Math.max(0, Math.min(10000, progress.streak)),
      bestStreak: Math.max(0, Math.min(10000, progress.bestStreak)),
      totalTimeSec: Math.max(0, Math.min(10000000, extra.totalTimeSec)),
      gamesCompleted: Math.max(0, Math.min(100000, extra.gamesCompleted)),
      learnedWords: progress.learnedWords.slice(0, 500),
      hardWords: progress.hardWords.slice(0, 500),
      completedLessons: progress.completedLessons.slice(0, 500),
      completedMissions: progress.completedMissions.slice(0, 50),
      bestTimes: progress.bestTimes || {},
      medals: progress.medals.slice(0, 30),
      dailyCompletedDates: progress.dailyCompletedDates.slice(0, 500),
      lastWorld: extra.lastWorld,
      lastSection: extra.lastSection.slice(0, 40),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeStudentProgress(
  studentId: PlayerId,
  onData: (data: (PlayerProgress & { totalTimeSec?: number; gamesCompleted?: number; lastWorld?: WorldId }) | null) => void
): () => void {
  const path = `student_progress/${studentId}`;
  return onSnapshot(
    doc(db, 'student_progress', studentId),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const d = snap.data();
      onData({
        id: studentId,
        name: d.name || (studentId === 'razmik' ? 'Razmik' : 'Gayane'),
        points: Number(d.points || 0),
        wins: Number(d.wins || 0),
        correctAnswers: Number(d.correctAnswers || 0),
        errors: Number(d.errors || 0),
        streak: Number(d.streak || 0),
        bestStreak: Number(d.bestStreak || 0),
        learnedWords: Array.isArray(d.learnedWords) ? d.learnedWords : [],
        hardWords: Array.isArray(d.hardWords) ? d.hardWords : [],
        completedLessons: Array.isArray(d.completedLessons) ? d.completedLessons : [],
        completedMissions: Array.isArray(d.completedMissions) ? d.completedMissions : [],
        bestTimes: d.bestTimes || {},
        medals: Array.isArray(d.medals) ? d.medals : [],
        dailyCompletedDates: Array.isArray(d.dailyCompletedDates) ? d.dailyCompletedDates : [],
        totalTimeSec: Number(d.totalTimeSec || 0),
        gamesCompleted: Number(d.gamesCompleted || 0),
        lastWorld: d.lastWorld || 'aeropuerto',
      });
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

export async function updateLeaderboardInCloud(entry: Omit<LeaderboardEntry, 'updatedByUid'>): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const path = `leaderboard/${entry.studentId}`;
  try {
    await setDoc(doc(db, 'leaderboard', entry.studentId), {
      studentId: entry.studentId,
      name: entry.name.slice(0, 40),
      gamesCompleted: Math.max(0, entry.gamesCompleted),
      correctAnswers: Math.max(0, entry.correctAnswers),
      totalQuestions: Math.max(0, entry.totalQuestions),
      avgAccuracyPercent: Math.max(0, Math.min(100, Math.round(entry.avgAccuracyPercent))),
      bestTimeSec: Math.max(0, entry.bestTimeSec),
      totalPoints: Math.max(0, entry.totalPoints),
      wins: Math.max(0, entry.wins),
      updatedByUid: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeLeaderboard(
  onData: (entries: Record<PlayerId, LeaderboardEntry | null>) => void
): () => void {
  const state: Record<PlayerId, LeaderboardEntry | null> = { razmik: null, gayane: null };
  const unsubR = onSnapshot(
    doc(db, 'leaderboard', 'razmik'),
    (snap) => {
      state.razmik = snap.exists() ? (snap.data() as LeaderboardEntry) : null;
      onData({ ...state });
    },
    (error) => handleFirestoreError(error, OperationType.GET, 'leaderboard/razmik')
  );
  const unsubG = onSnapshot(
    doc(db, 'leaderboard', 'gayane'),
    (snap) => {
      state.gayane = snap.exists() ? (snap.data() as LeaderboardEntry) : null;
      onData({ ...state });
    },
    (error) => handleFirestoreError(error, OperationType.GET, 'leaderboard/gayane')
  );
  return () => {
    unsubR();
    unsubG();
  };
}

function tsToIso(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

export async function createGameSessionInCloud(params: {
  studentId: PlayerId;
  gameId: GameId | string;
  gameTitleEs: string;
  world: WorldId | 'todos';
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  score: number;
  durationSec: number;
  answersSummary: CloudAnswerSummary[];
  submittedToTeacher?: boolean;
}): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Debes iniciar sesión para guardar resultados en la nube.');

  const sessionId = `sess_${params.studentId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `game_sessions/${sessionId}`;
  const accuracyPercent =
    params.totalQuestions > 0
      ? Math.min(100, Math.max(0, Math.round((params.correctCount / params.totalQuestions) * 100)))
      : params.score > 0
        ? 100
        : 0;

  const trimmedSummary = params.answersSummary.slice(0, 35).map((a) => ({
    questionEs: String(a.questionEs).slice(0, 180),
    chosenEs: String(a.chosenEs).slice(0, 140),
    correctEs: String(a.correctEs).slice(0, 140),
    isCorrect: Boolean(a.isCorrect),
  }));

  try {
    await setDoc(doc(db, 'game_sessions', sessionId), {
      id: sessionId,
      studentId: params.studentId,
      ownerUid: uid,
      studentName: params.studentId === 'razmik' ? 'Razmik' : 'Gayane',
      gameId: String(params.gameId).slice(0, 50),
      gameTitleEs: params.gameTitleEs.slice(0, 120),
      world: params.world,
      totalQuestions: Math.max(0, Math.min(100, params.totalQuestions)),
      correctCount: Math.max(0, Math.min(100, params.correctCount)),
      incorrectCount: Math.max(0, Math.min(100, params.incorrectCount)),
      score: Math.max(0, Math.min(10000, params.score)),
      accuracyPercent,
      durationSec: Math.max(0, Math.min(7200, Math.round(params.durationSec))),
      answersSummary: trimmedSummary,
      submittedToTeacher: Boolean(params.submittedToTeacher),
      submittedAt: params.submittedToTeacher ? new Date().toISOString() : '',
      teacherNote: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return sessionId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function submitGameSessionToTeacher(sessionId: string): Promise<void> {
  const path = `game_sessions/${sessionId}`;
  try {
    await withTimeout(
      updateDoc(doc(db, 'game_sessions', sessionId), {
        submittedToTeacher: true,
        submittedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      }),
      15000,
      'Tiempo de espera agotado al enviar los resultados. Comprueba tu conexión e inténtalo de nuevo.'
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateSessionTeacherNote(sessionId: string, teacherNote: string): Promise<void> {
  const path = `game_sessions/${sessionId}`;
  try {
    await updateDoc(doc(db, 'game_sessions', sessionId), {
      teacherNote: teacherNote.slice(0, 500),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteGameSessionFromCloud(sessionId: string): Promise<void> {
  const path = `game_sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'game_sessions', sessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeGameSessions(
  role: UserRole,
  uid: string,
  onData: (sessions: CloudGameSession[]) => void
): () => void {
  const colRef = collection(db, 'game_sessions');
  const q =
    role === 'profesor'
      ? query(colRef, orderBy('createdAt', 'desc'))
      : query(colRef, where('ownerUid', '==', uid));
  const path = 'game_sessions';

  return onSnapshot(
    q,
    (snap) => {
      const items: CloudGameSession[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            studentId: data.studentId,
            ownerUid: data.ownerUid,
            studentName: data.studentName,
            gameId: data.gameId,
            gameTitleEs: data.gameTitleEs,
            world: data.world,
            totalQuestions: Number(data.totalQuestions || 0),
            correctCount: Number(data.correctCount || 0),
            incorrectCount: Number(data.incorrectCount || 0),
            score: Number(data.score || 0),
            accuracyPercent: Number(data.accuracyPercent || 0),
            durationSec: Number(data.durationSec || 0),
            answersSummary: Array.isArray(data.answersSummary) ? data.answersSummary : [],
            submittedToTeacher: Boolean(data.submittedToTeacher),
            submittedAt: data.submittedAt || '',
            teacherNote: data.teacherNote || '',
            createdAtIso: tsToIso(data.createdAt),
          };
        })
        .sort((a, b) => (b.createdAtIso || '').localeCompare(a.createdAtIso || ''));
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = String(reader.result || '');
      const comma = res.indexOf(',');
      resolve(comma >= 0 ? res.slice(comma + 1) : res);
    };
    reader.onerror = () => reject(new Error('No se pudo procesar el audio grabado.'));
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType || 'audio/webm' });
}

export function analyzeSpanishSpokenResponse(transcript: string, helperWords: string[] = []): string {
  const clean = transcript.trim();
  if (!clean) {
    return 'Audio enviado sin transcripción automática. El profesor lo escuchará y pondrá la nota.';
  }
  const lower = clean.toLowerCase();
  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  const matched = helperWords.filter((w) => lower.includes(w.toLowerCase().replace(/[¿?¡!]/g, '')));
  const hasPolite =
    lower.includes('por favor') ||
    lower.includes('gracias') ||
    lower.includes('disculpe') ||
    lower.includes('perdón') ||
    lower.includes('buenos') ||
    lower.includes('buenas');

  const tips: string[] = [];
  if (wordCount >= 5) tips.push('Buena longitud de frase');
  else tips.push('Intenta hacer una frase un poco más larga');

  if (matched.length > 0) tips.push(`usaste vocabulario clave (${matched.slice(0, 3).join(', ')})`);
  if (hasPolite) tips.push('muy buena cortesía en español');
  else tips.push('añade «por favor» o «disculpe» para sonar más natural');

  return `Sugerencia automática: ${tips.join(' · ')}. (La nota final la pone el profesor).`;
}

export async function uploadVoiceRecordingToCloud(params: {
  studentId: PlayerId;
  world: WorldId | 'todos';
  gameId: GameId | string;
  questionEs: string;
  transcriptEs: string;
  aiSuggestionEs: string;
  blob: Blob;
  mimeType: string;
  durationSec: number;
}): Promise<CloudVoiceRecording> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Debes iniciar sesión para enviar grabaciones al profesor.');
  if (!params.blob || params.blob.size === 0) {
    throw new Error('La grabación está vacía. Graba al menos 1 segundo e inténtalo de nuevo.');
  }

  const recordingId = `rec_${params.studentId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const storagePath = `voice_recordings/${params.studentId}/${recordingId}.webm`;
  const cleanMime = (params.mimeType || params.blob.type || 'audio/webm').slice(0, 60) || 'audio/webm';
  const cleanQuestion = (params.questionEs || 'Respuesta oral').trim().slice(0, 400) || 'Respuesta oral';
  const cleanGameId = String(params.gameId || 'practica_oral').trim().slice(0, 50) || 'practica_oral';

  const audioBase64 = await blobToBase64(params.blob);
  if (!audioBase64 || audioBase64.length === 0) {
    throw new Error('No se pudo leer el audio grabado. Intenta grabar de nuevo.');
  }

  let uploadedToStorage = false;
  let hasFirestoreAudio = false;

  if (audioBase64.length <= 640000) {
    // Store directly in protected Firestore audio collection so it resolves immediately without Storage retry delays
    hasFirestoreAudio = true;
  } else {
    try {
      const sRef = ref(storage, storagePath);
      await withTimeout(
        uploadBytes(sRef, params.blob, { contentType: cleanMime }),
        8000,
        'Tiempo de espera agotado al subir audio grande.'
      );
      uploadedToStorage = true;
    } catch {
      throw new Error('La grabación es demasiado larga (supera 450 KB). Graba una respuesta más corta (máx. ~2 min).');
    }
  }

  const metaDoc: Record<string, unknown> = {
    id: recordingId,
    studentId: params.studentId,
    ownerUid: uid,
    studentName: params.studentId === 'razmik' ? 'Razmik' : 'Gayane',
    world: params.world,
    gameId: cleanGameId,
    questionEs: cleanQuestion,
    transcriptEs: params.transcriptEs.slice(0, 1000),
    aiSuggestionEs: params.aiSuggestionEs.slice(0, 400),
    storagePath: uploadedToStorage ? storagePath : '',
    hasFirestoreAudio,
    durationSec: Math.max(0, Math.min(300, Math.round(params.durationSec))),
    mimeType: cleanMime,
    status: 'pending',
    verdict: 'none',
    teacherComment: '',
    teacherPoints: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewedAt: '',
  };

  try {
    await withTimeout(
      setDoc(doc(db, 'voice_recordings', recordingId), metaDoc),
      15000,
      'Tiempo de espera agotado al guardar la grabación en la nube. Inténtalo de nuevo.'
    );
    if (hasFirestoreAudio) {
      await withTimeout(
        setDoc(doc(db, 'recordings_audio', recordingId), {
          recordingId,
          studentId: params.studentId,
          ownerUid: uid,
          audioBase64,
          mimeType: cleanMime,
          createdAt: serverTimestamp(),
        }),
        15000,
        'Tiempo de espera agotado al guardar el archivo de audio. Inténtalo de nuevo.'
      );
    }
    return {
      id: recordingId,
      studentId: params.studentId,
      ownerUid: uid,
      studentName: params.studentId === 'razmik' ? 'Razmik' : 'Gayane',
      world: params.world,
      gameId: cleanGameId,
      questionEs: cleanQuestion,
      transcriptEs: params.transcriptEs.slice(0, 1000),
      aiSuggestionEs: params.aiSuggestionEs.slice(0, 400),
      storagePath: uploadedToStorage ? storagePath : '',
      hasFirestoreAudio,
      durationSec: Math.round(params.durationSec),
      mimeType: cleanMime,
      status: 'pending',
      verdict: 'none',
      teacherComment: '',
      teacherPoints: 0,
      createdAtIso: new Date().toISOString(),
      reviewedAt: '',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `voice_recordings/${recordingId}`);
  }
}

export async function fetchProtectedAudioBlobUrl(rec: CloudVoiceRecording): Promise<string> {
  if (rec.hasFirestoreAudio) {
    const path = `recordings_audio/${rec.id}`;
    try {
      const snap = await withTimeout(
        getDoc(doc(db, 'recordings_audio', rec.id)),
        12000,
        'Tiempo de espera agotado al cargar el audio.'
      );
      if (snap.exists()) {
        const d = snap.data();
        const blob = base64ToBlob(String(d.audioBase64), String(d.mimeType || rec.mimeType));
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      if (!rec.storagePath) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
  }
  if (rec.storagePath) {
    try {
      const blob = await withTimeout(
        getBlob(ref(storage, rec.storagePath)),
        8000,
        'Tiempo de espera agotado al descargar el audio.'
      );
      return URL.createObjectURL(blob);
    } catch {
      // fall through
    }
  }
  throw new Error('No hay audio disponible para esta grabación.');
}

export async function reviewVoiceRecordingInCloud(params: {
  recordingId: string;
  verdict: 'correcto' | 'necesita_practicar';
  teacherComment: string;
  teacherPoints: number;
}): Promise<void> {
  const path = `voice_recordings/${params.recordingId}`;
  try {
    await updateDoc(doc(db, 'voice_recordings', params.recordingId), {
      status: 'reviewed',
      verdict: params.verdict,
      teacherComment: params.teacherComment.slice(0, 500),
      teacherPoints: Math.max(0, Math.min(100, params.teacherPoints)),
      reviewedAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteVoiceRecordingFromCloud(rec: CloudVoiceRecording): Promise<void> {
  if (rec.storagePath) {
    try {
      await deleteObject(ref(storage, rec.storagePath));
    } catch {
      // ignore if already deleted
    }
  }
  if (rec.hasFirestoreAudio) {
    try {
      await deleteDoc(doc(db, 'recordings_audio', rec.id));
    } catch {
      // ignore if absent
    }
  }
  try {
    await deleteDoc(doc(db, 'voice_recordings', rec.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `voice_recordings/${rec.id}`);
  }
}

export function subscribeVoiceRecordings(
  role: UserRole,
  uid: string,
  onData: (recordings: CloudVoiceRecording[]) => void
): () => void {
  const colRef = collection(db, 'voice_recordings');
  const q =
    role === 'profesor'
      ? query(colRef, orderBy('createdAt', 'desc'))
      : query(colRef, where('ownerUid', '==', uid));
  const path = 'voice_recordings';

  return onSnapshot(
    q,
    (snap) => {
      const list: CloudVoiceRecording[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            studentId: data.studentId,
            ownerUid: data.ownerUid,
            studentName: data.studentName,
            world: data.world,
            gameId: data.gameId,
            questionEs: data.questionEs,
            transcriptEs: data.transcriptEs || '',
            aiSuggestionEs: data.aiSuggestionEs || '',
            storagePath: data.storagePath || '',
            hasFirestoreAudio: Boolean(data.hasFirestoreAudio),
            durationSec: Number(data.durationSec || 0),
            mimeType: data.mimeType || 'audio/webm',
            status: data.status || 'pending',
            verdict: data.verdict || 'none',
            teacherComment: data.teacherComment || '',
            teacherPoints: Number(data.teacherPoints || 0),
            createdAtIso: tsToIso(data.createdAt),
            reviewedAt: data.reviewedAt || '',
          };
        })
        .sort((a, b) => (b.createdAtIso || '').localeCompare(a.createdAtIso || ''));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function resetStudentCloudData(
  studentId: PlayerId,
  defaultProgress: PlayerProgress,
  isTeacher = false
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    await saveStudentProgressToCloud(studentId, defaultProgress, {
      totalTimeSec: 0,
      gamesCompleted: 0,
      lastWorld: 'aeropuerto',
      lastSection: 'home',
    });
    await updateLeaderboardInCloud({
      studentId,
      name: defaultProgress.name,
      gamesCompleted: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      avgAccuracyPercent: 0,
      bestTimeSec: 0,
      totalPoints: 0,
      wins: 0,
    });
    const sessSnap = isTeacher
      ? await getDocs(collection(db, 'game_sessions'))
      : await getDocs(query(collection(db, 'game_sessions'), where('ownerUid', '==', uid)));
    for (const d of sessSnap.docs) {
      if (d.data().studentId === studentId) {
        await deleteDoc(d.ref);
      }
    }
    const recSnap = isTeacher
      ? await getDocs(collection(db, 'voice_recordings'))
      : await getDocs(query(collection(db, 'voice_recordings'), where('ownerUid', '==', uid)));
    for (const d of recSnap.docs) {
      const rec = d.data() as CloudVoiceRecording;
      if (rec.studentId === studentId) {
        await deleteVoiceRecordingFromCloud({ ...rec, id: d.id });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `student_progress/${studentId}`);
  }
}
