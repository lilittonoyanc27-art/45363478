export type WorldId = 'aeropuerto' | 'hotel' | 'restaurante' | 'supermercado';

export type PlayerId = 'razmik' | 'gayane';

export type DifficultyLevel = 1 | 2 | 3;

export type TimerMode = 'contrarreloj' | 'cronometro' | 'dialogo' | 'record';

export type GameId =
  | 'responde_rapido'
  | 'cambio_papeles'
  | 'dialogo_loco'
  | 'escucha_gana'
  | 'encuentra_error'
  | 'compra_inteligente'
  | 'camarero_dia'
  | 'no_pierdas_avion'
  | 'hotel_misterioso'
  | 'continua_dialogo'
  | 'sorpresa'
  | 'gran_final'
  | 'habla_sin_parar'
  | 'preguntas_cadena'
  | 'mision_secreta'
  | 'mira_explica'
  | 'roba_carta'
  | 'reto_30';

export interface VocabItem {
  id: string;
  es: string;
  hy: string;
  category: string;
  exampleEs: string;
  exampleHy: string;
  icon: string;
}

export interface ExpressionItem {
  id: string;
  es: string;
  hy: string;
  situationEs: string;
  situationHy: string;
}

export interface DialogueLine {
  speaker: string;
  es: string;
  hy: string;
}

export interface DialogueSample {
  id: string;
  titleEs: string;
  titleHy: string;
  lines: DialogueLine[];
}

export interface GrammarPoint {
  id: string;
  titleEs: string;
  explanationHy: string;
  examples: { es: string; hy: string }[];
  quiz: {
    questionEs: string;
    questionHy: string;
    options: string[];
    correctIndex: number;
    feedbackHy: string;
  };
}

export interface HotspotItem {
  id: string;
  labelEs: string;
  labelHy: string;
  phraseEs: string;
  phraseHy: string;
  xPercent: number;
  yPercent: number;
}

export interface QuickQuestion {
  id: string;
  world: WorldId;
  level: DifficultyLevel;
  situationEs: string;
  situationHy: string;
  options: string[];
  correctIndex: number;
  explanationHy: string;
  openPromptEs?: string;
}

export interface ListeningChallenge {
  id: string;
  world: WorldId;
  level: DifficultyLevel;
  audioEs: string;
  audioHy: string;
  questionEs: string;
  options: string[];
  correctIndex: number;
  explanationHy: string;
}

export interface ErrorChallenge {
  id: string;
  world: WorldId;
  level: DifficultyLevel;
  wrongEs: string;
  correctEs: string;
  wrongWord: string;
  correctWord: string;
  explanationHy: string;
}

export interface RoleplayScenario {
  id: string;
  world: WorldId;
  titleEs: string;
  contextEs: string;
  contextHy: string;
  roleAName: string;
  roleAGoalsEs: string[];
  roleAGoalsHy: string[];
  roleBName: string;
  roleBGoalsEs: string[];
  roleBGoalsHy: string[];
  usefulWords: string[];
}

export interface SpeakingPrompt {
  id: string;
  world: WorldId;
  promptEs: string;
  promptHy: string;
  helperWords: string[];
  sampleEs: string;
}

export interface WorldData {
  id: WorldId;
  nameEs: string;
  subtitleEs: string;
  subtitleHy: string;
  icon: string;
  image: string;
  accentColor: string;
  vocab: VocabItem[];
  expressions: ExpressionItem[];
  miniDialogues: DialogueSample[];
  fullDialogues: DialogueSample[];
  grammar: GrammarPoint[];
  hotspots: HotspotItem[];
  quickQuestions: QuickQuestion[];
  listening: ListeningChallenge[];
  errors: ErrorChallenge[];
  roleplays: RoleplayScenario[];
  speakingPrompts: SpeakingPrompt[];
}

export interface MatchHistoryItem {
  id: string;
  dateIso: string;
  gameId: GameId;
  gameTitleEs: string;
  world: WorldId | 'todos';
  razmikScore: number;
  gayaneScore: number;
  razmikTimeSec: number;
  gayaneTimeSec: number;
  winner: PlayerId | 'empate';
}

export interface PlayerProgress {
  id: PlayerId;
  name: string;
  points: number;
  wins: number;
  correctAnswers: number;
  errors: number;
  streak: number;
  bestStreak: number;
  learnedWords: string[];
  hardWords: string[];
  completedLessons: string[];
  completedMissions: string[];
  bestTimes: Record<string, number>;
  medals: string[];
  dailyCompletedDates: string[];
}

export interface TeacherConfig {
  selectedWorld: WorldId | 'todos';
  selectedGame: GameId;
  roundsCount: number;
  timerSeconds: number;
  difficulty: DifficultyLevel;
  timerMode: TimerMode;
}

export interface AppStorageState {
  version: number;
  razmik: PlayerProgress;
  gayane: PlayerProgress;
  history: MatchHistoryItem[];
  lastWorld: WorldId;
  lastSection: string;
  teacherConfig: TeacherConfig;
}

export const ASSETS = {
  razmikAvatar: '/images/razmik-2026.svg',
  gayaneAvatar: '/images/gayane-2026.svg',
  airport: '/images/airport.svg',
  hotel: '/images/hotel.svg',
  restaurant: '/images/restaurant.svg',
  supermarket: '/images/supermarket.svg',
};

export interface GameCatalogEntry {
  id: GameId;
  titleEs: string;
  descEs: string;
  descHy: string;
  category: 'competir' | 'hablar' | 'escuchar' | 'juntos';
  emoji: string;
  defaultSeconds: number;
}

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    id: 'responde_rapido',
    titleEs: '¡Responde rápido!',
    descEs: 'Preguntas rápidas de la vida real con cuenta atrás.',
    descHy: 'Արագ հարցեր իրական իրավիճակներից՝ ժամաչափով:',
    category: 'competir',
    emoji: '⚡',
    defaultSeconds: 15,
  },
  {
    id: 'cambio_papeles',
    titleEs: '¡Cambio de papeles!',
    descEs: 'Diálogo real por turnos con objetivos secretos y cambio de rol.',
    descHy: 'Իրական դերախաղ երկխոսություն՝ գաղտնի նպատակներով և դերերի փոփոխությամբ:',
    category: 'hablar',
    emoji: '🎭',
    defaultSeconds: 90,
  },
  {
    id: 'dialogo_loco',
    titleEs: '¡Diálogo loco!',
    descEs: 'Ordena las frases mezcladas para reconstruir la conversación.',
    descHy: 'Դասավորիր խառնված նախադասությունները ճիշտ հերթականությամբ:',
    category: 'competir',
    emoji: '🧩',
    defaultSeconds: 45,
  },
  {
    id: 'escucha_gana',
    titleEs: '¡Escucha y gana!',
    descEs: 'Escucha el audio en español sin ver el texto y responde bien.',
    descHy: 'Լսիր իսպաներեն խոսքը առանց տեքստի և ընտրիր կամ ասա ճիշտ պատասխանը:',
    category: 'escuchar',
    emoji: '🎧',
    defaultSeconds: 30,
  },
  {
    id: 'encuentra_error',
    titleEs: '¡Encuentra el error!',
    descEs: 'Detecta y corrige el error gramatical en 30 segundos.',
    descHy: 'Գտիր և ուղղիր քերականական սխալը 30 վայրկյանում:',
    category: 'competir',
    emoji: '🕵️',
    defaultSeconds: 30,
  },
  {
    id: 'compra_inteligente',
    titleEs: '¡Compra más inteligente!',
    descEs: 'Compra con 20€ de presupuesto y habla en la caja.',
    descHy: 'Կատարիր գնումներ 20 եվրո բյուջեով և խոսիր դրամարկղի մոտ:',
    category: 'juntos',
    emoji: '🛒',
    defaultSeconds: 90,
  },
  {
    id: 'camarero_dia',
    titleEs: '¡Camarero por un día!',
    descEs: 'Restaurante virtual: atiende mesas y pide en 6 pasos.',
    descHy: 'Վիրտուալ ռեստորան. սպասարկիր սեղանները և պատվիրիր 6 քայլով:',
    category: 'hablar',
    emoji: '🍕',
    defaultSeconds: 120,
  },
  {
    id: 'no_pierdas_avion',
    titleEs: '¡No pierdas el avión!',
    descEs: 'Supera las 5 zonas del aeropuerto antes del despegue.',
    descHy: 'Անցիր օդանավակայանի 5 գոտիները նախքան թռիչքը:',
    category: 'competir',
    emoji: '✈️',
    defaultSeconds: 120,
  },
  {
    id: 'hotel_misterioso',
    titleEs: '¡Hotel misterioso!',
    descEs: 'Resuelve 15+ imprevistos reales en la recepción del hotel.',
    descHy: 'Լուծիր 15+ անսպասելի իրավիճակ հյուրանոցի ընդունարանում:',
    category: 'hablar',
    emoji: '🏨',
    defaultSeconds: 60,
  },
  {
    id: 'continua_dialogo',
    titleEs: '¡Continúa el diálogo!',
    descEs: 'Construye una conversación de 8–10 turnos paso a paso.',
    descHy: 'Շարունակիր երկխոսությունը 8-10 քայլով՝ միասին ստեղծելով խոսք:',
    category: 'juntos',
    emoji: '💬',
    defaultSeconds: 90,
  },
  {
    id: 'sorpresa',
    titleEs: '¡Sorpresa!',
    descEs: 'Gira la ruleta mágica y cumple el reto que te toque.',
    descHy: 'Պտտեցրու անիվը և կատարիր պատահական առաջադրանքը:',
    category: 'competir',
    emoji: '🎲',
    defaultSeconds: 45,
  },
  {
    id: 'gran_final',
    titleEs: '¡La Gran Final!',
    descEs: 'Viaje completo por España: 20 desafíos en los 4 mundos.',
    descHy: 'Մեծ եզրափակիչ. 20 փորձություն Իսպանիայի 4 աշխարհներում:',
    category: 'competir',
    emoji: '🏆',
    defaultSeconds: 45,
  },
  {
    id: 'habla_sin_parar',
    titleEs: '¡Habla sin parar!',
    descEs: 'Monólogo de 30, 45 o 60 segundos usando palabras clave.',
    descHy: 'Խոսիր անդադար 30, 45 կամ 60 վայրկյան՝ օգտագործելով բանալի բառեր:',
    category: 'hablar',
    emoji: '🎤',
    defaultSeconds: 45,
  },
  {
    id: 'preguntas_cadena',
    titleEs: '¡Preguntas en cadena!',
    descEs: 'Responde y lanza otra pregunta en español durante 2 minutos.',
    descHy: 'Պատասխանիր և անմիջապես նոր հարց տուր 2 րոպե շարունակ:',
    category: 'juntos',
    emoji: '🔥',
    defaultSeconds: 120,
  },
  {
    id: 'mision_secreta',
    titleEs: '¡Misión secreta!',
    descEs: 'Cada jugador tiene datos ocultos: preguntad para resolver.',
    descHy: 'Յուրաքանչյուրն ունի գաղտնի քարտ. հարցերով գտեք ընդհանուր լուծումը:',
    category: 'juntos',
    emoji: '🔐',
    defaultSeconds: 120,
  },
  {
    id: 'mira_explica',
    titleEs: '¡Mira y explica!',
    descEs: 'Describe la escena ilustrada y haz 3 preguntas al compañero.',
    descHy: 'Նկարագրիր նկարը և տուր 3 հարց ընկերոջդ իսպաներենով:',
    category: 'hablar',
    emoji: '🖼️',
    defaultSeconds: 60,
  },
  {
    id: 'roba_carta',
    titleEs: '¡Roba la carta! (30 cartas · 2 min)',
    descEs: 'Saca hasta 30 cartas aleatorias del mazo en 2 minutos y compite por temas.',
    descHy: 'Քաշիր մինչև 30 պատահական քարտ կապոցից 2 րոպեում և մրցիր թեմաներով:',
    category: 'competir',
    emoji: '🃏',
    defaultSeconds: 120,
  },
  {
    id: 'reto_30',
    titleEs: 'Reto de 30 preguntas (2 min)',
    descEs: '30 preguntas variadas del tema con 4 opciones y 2 minutos de tiempo total.',
    descHy: '30 տարբեր հարց թեմայից՝ 4 տարբերակով և 2 րոպե ընդհանուր ժամանակով:',
    category: 'competir',
    emoji: '⏱️',
    defaultSeconds: 120,
  },
];

export interface MedalDefinition {
  id: string;
  nameEs: string;
  descHy: string;
  icon: string;
}

export const MEDALS: MedalDefinition[] = [
  { id: 'primera_victoria', nameEs: 'Primera Victoria', descHy: 'Հաղթել առաջին խաղային փուլում', icon: '🥇' },
  { id: 'maestro_palabras', nameEs: 'Maestro de Palabras', descHy: 'Սովորել առնվազն 25 իսպաներեն բառ', icon: '📚' },
  { id: 'gran_orador', nameEs: 'Gran Orador', descHy: 'Վաստակել 100+ միավոր խոսակցական առաջադրանքներում', icon: '🎤' },
  { id: 'oido_fino', nameEs: 'Oído Fino', descHy: 'Անցնել լսողական փորձությունները', icon: '🎧' },
  { id: 'viajero_experto', nameEs: 'Viajero Experto', descHy: 'Անցնել բոլոր 4 աշխարհների առաջադրանքները', icon: '🌍' },
  { id: 'racha_oro', nameEs: 'Racha de Oro', descHy: '5 ճիշտ պատասխան անընդմեջ', icon: '🔥' },
];

export type UserRole = 'razmik' | 'gayane' | 'profesor';

export interface UserProfileDoc {
  uid: string;
  role: UserRole;
  displayName: string;
  codeHash: string;
  parentalConsentGranted: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CloudAnswerSummary {
  questionEs: string;
  chosenEs: string;
  correctEs: string;
  isCorrect: boolean;
}

export interface CloudGameSession {
  id: string;
  studentId: PlayerId;
  ownerUid: string;
  studentName: string;
  gameId: GameId | string;
  gameTitleEs: string;
  world: WorldId | 'todos';
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  score: number;
  accuracyPercent: number;
  durationSec: number;
  answersSummary: CloudAnswerSummary[];
  submittedToTeacher: boolean;
  submittedAt: string;
  teacherNote: string;
  createdAtIso?: string;
}

export interface CloudVoiceRecording {
  id: string;
  studentId: PlayerId;
  ownerUid: string;
  studentName: string;
  world: WorldId | 'todos';
  gameId: GameId | string;
  questionEs: string;
  transcriptEs: string;
  aiSuggestionEs: string;
  storagePath: string;
  hasFirestoreAudio: boolean;
  durationSec: number;
  mimeType: string;
  status: 'pending' | 'reviewed';
  verdict: 'none' | 'correcto' | 'necesita_practicar';
  teacherComment: string;
  teacherPoints: number;
  createdAtIso?: string;
  reviewedAt: string;
}

export interface LeaderboardEntry {
  studentId: PlayerId;
  name: string;
  gamesCompleted: number;
  correctAnswers: number;
  totalQuestions: number;
  avgAccuracyPercent: number;
  bestTimeSec: number;
  totalPoints: number;
  wins: number;
  updatedByUid: string;
}

export interface TeacherCodesSettings {
  razmikCodeHash: string;
  gayaneCodeHash: string;
  razmikCodeLabel: string;
  gayaneCodeLabel: string;
}

