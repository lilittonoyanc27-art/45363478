import React, { useMemo, useState } from 'react';
import { Volume2, CheckCircle2, Star, RotateCw, BookOpen, MessageSquare, GraduationCap, Layers, HelpCircle } from 'lucide-react';
import { speakDialogueSequence, speakEs, stopSpeaking, playCorrectSound, playWrongSound } from './audio';
import { SpPhrase } from './ClickSpanish';
import { PlayerId, PlayerProgress, VocabItem, WorldData } from './types';

interface TheorySectionProps {
  world: WorldData;
  activeStudent: PlayerId;
  onChangeStudent: (p: PlayerId) => void;
  studentProgress: PlayerProgress;
  onToggleLearnedWord: (player: PlayerId, wordId: string) => void;
  onToggleHardWord: (player: PlayerId, wordId: string) => void;
  onCompleteLesson: (player: PlayerId, lessonId: string) => void;
}

type TheorySubTab = 'palabras' | 'expresiones' | 'dialogos' | 'gramatica' | 'tarjetas';

export const TheorySection: React.FC<TheorySectionProps> = ({
  world,
  activeStudent,
  onChangeStudent,
  studentProgress,
  onToggleLearnedWord,
  onToggleHardWord,
  onCompleteLesson,
}) => {
  const [subTab, setSubTab] = useState<TheorySubTab>('palabras');
  const [onlyHard, setOnlyHard] = useState(false);
  const [activeBlockIdx, setActiveBlockIdx] = useState(0);
  const [playingDialogueId, setPlayingDialogueId] = useState<string | null>(null);
  const [activeLineIdx, setActiveLineIdx] = useState<number>(-1);
  const [grammarAnswers, setGrammarAnswers] = useState<Record<string, number>>({});
  const [blockQuizChoices, setBlockQuizChoices] = useState<Record<number, number>>({});

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Split vocab into blocks of ~10 words so each block pairs with a mini-dialogue
  const vocabBlocks = useMemo(() => {
    const blocks: VocabItem[][] = [];
    const chunkSize = Math.ceil(world.vocab.length / Math.max(1, world.miniDialogues.length));
    for (let i = 0; i < world.vocab.length; i += chunkSize) {
      blocks.push(world.vocab.slice(i, i + chunkSize));
    }
    return blocks;
  }, [world.vocab, world.miniDialogues.length]);

  const flashcardPool = useMemo(() => {
    if (onlyHard) {
      const filtered = world.vocab.filter((v) => studentProgress.hardWords.includes(v.id));
      return filtered.length > 0 ? filtered : world.vocab;
    }
    return world.vocab;
  }, [world.vocab, onlyHard, studentProgress.hardWords]);

  const currentCard = flashcardPool[cardIndex % flashcardPool.length] || world.vocab[0];

  const learnedCount = world.vocab.filter((v) => studentProgress.learnedWords.includes(v.id)).length;
  const hardCount = world.vocab.filter((v) => studentProgress.hardWords.includes(v.id)).length;

  const handlePlayDialogue = (id: string, lines: { es: string }[], slow = false) => {
    if (playingDialogueId === id) {
      stopSpeaking();
      setPlayingDialogueId(null);
      setActiveLineIdx(-1);
      return;
    }
    setPlayingDialogueId(id);
    speakDialogueSequence(
      lines,
      slow,
      (idx) => setActiveLineIdx(idx),
      () => {
        setPlayingDialogueId(null);
        setActiveLineIdx(-1);
        onCompleteLesson(activeStudent, `${world.id}_dialogo_${id}`);
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Student Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500">
            Aprendemos antes de jugar · {learnedCount}/{world.vocab.length} palabras aprendidas · {hardCount} difíciles
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Teoría interactiva: {world.nameEs}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pulsa cualquier frase en español para ver su traducción al armenio (Սեղմիր ցանկացած իսպաներեն նախադասության վրա՝ հայերեն թարգմանությունը տեսնելու համար):
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => onChangeStudent('razmik')}
              className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeStudent === 'razmik' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Razmik 🔵
            </button>
            <button
              type="button"
              onClick={() => onChangeStudent('gayane')}
              className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeStudent === 'gayane' ? 'bg-pink-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gayane 🩷
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOnlyHard((h) => !h)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              onlyHard
                ? 'bg-amber-100 border-amber-400 text-amber-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {onlyHard ? 'Mostrando difíciles ★' : `Repasar difíciles (${hardCount})`}
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-1 p-1.5 bg-slate-100 rounded-xl w-fit">
        {[
          { id: 'palabras' as TheorySubTab, label: `Palabras (${world.vocab.length})`, icon: BookOpen },
          { id: 'expresiones' as TheorySubTab, label: `Expresiones (${world.expressions.length})`, icon: MessageSquare },
          { id: 'dialogos' as TheorySubTab, label: 'Diálogos reales', icon: MessageSquare },
          { id: 'gramatica' as TheorySubTab, label: 'Gramática (Հայերեն)', icon: GraduationCap },
          { id: 'tarjetas' as TheorySubTab, label: 'Tarjetas con audio', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                subTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PALABRAS EN BLOQUES + MINI-DIÁLOGOS */}
      {subTab === 'palabras' && (
        <div className="space-y-6">
          {/* Block Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {vocabBlocks.map((blk, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveBlockIdx(i)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
                  activeBlockIdx === i
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Bloque {i + 1} · {blk[0]?.category} ({blk.length})
              </button>
            ))}
          </div>

          {/* Vocabulary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(vocabBlocks[activeBlockIdx] || [])
              .filter((w) => !onlyHard || studentProgress.hardWords.includes(w.id))
              .map((item) => {
                const isLearned = studentProgress.learnedWords.includes(item.id);
                const isHard = studentProgress.hardWords.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                      isLearned ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl" aria-hidden="true">{item.icon}</span>
                          <div>
                            <div className="font-display text-lg font-bold text-slate-900">
                              <SpPhrase es={item.es} hy={item.hy} showAudio={false} />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => speakEs(item.es)}
                            title="Escuchar palabra"
                            className="p-2 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => speakEs(item.es, true)}
                            title="Más despacio"
                            className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                          >
                            0.7x
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-sm">
                        <SpPhrase es={item.exampleEs} hy={item.exampleHy} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => onToggleLearnedWord(activeStudent, item.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          isLearned
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isLearned ? 'Aprendida' : 'Marcar aprendida'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleHardWord(activeStudent, item.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          isHard
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-slate-100 text-slate-600 hover:bg-amber-100'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5" />
                        {isHard ? 'Difícil' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Mini-diálogo after every 8-10 words */}
          {world.miniDialogues[activeBlockIdx] && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-blue-700">Mini-diálogo práctico del bloque {activeBlockIdx + 1}</div>
                  <h3 className="font-display text-xl font-bold text-slate-900">
                    <SpPhrase
                      es={world.miniDialogues[activeBlockIdx].titleEs}
                      hy={world.miniDialogues[activeBlockIdx].titleHy}
                      showAudio={false}
                    />
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handlePlayDialogue(
                        world.miniDialogues[activeBlockIdx].id,
                        world.miniDialogues[activeBlockIdx].lines,
                        false
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    {playingDialogueId === world.miniDialogues[activeBlockIdx].id ? 'Parar audio' : 'Escuchar diálogo'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handlePlayDialogue(
                        world.miniDialogues[activeBlockIdx].id,
                        world.miniDialogues[activeBlockIdx].lines,
                        true
                      )
                    }
                    className="px-3 py-2 text-sm font-semibold text-blue-800 bg-white border border-blue-200 hover:bg-blue-100 rounded-xl cursor-pointer"
                  >
                    Más despacio
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {world.miniDialogues[activeBlockIdx].lines.map((line, lIdx) => {
                  const isActive =
                    playingDialogueId === world.miniDialogues[activeBlockIdx].id && activeLineIdx === lIdx;
                  return (
                    <div
                      key={lIdx}
                      className={`p-3 rounded-xl border transition-colors ${
                        isActive ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-500 mr-2">{line.speaker}:</span>
                      <SpPhrase es={line.es} hy={line.hy} />
                    </div>
                  );
                })}
              </div>

              {/* Quick Block Comprehension Check */}
              {vocabBlocks[activeBlockIdx]?.[0] && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    Pregunta rápida de comprensión: ¿Qué significa «{vocabBlocks[activeBlockIdx][1]?.es || vocabBlocks[activeBlockIdx][0].es}» en armenio?
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      vocabBlocks[activeBlockIdx][1] || vocabBlocks[activeBlockIdx][0],
                      world.vocab[(activeBlockIdx * 5 + 12) % world.vocab.length],
                      world.vocab[(activeBlockIdx * 7 + 23) % world.vocab.length],
                    ].map((opt, oIdx) => {
                      const picked = blockQuizChoices[activeBlockIdx] === oIdx;
                      const isCorrect = oIdx === 0;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => {
                            setBlockQuizChoices((prev) => ({ ...prev, [activeBlockIdx]: oIdx }));
                            if (isCorrect) {
                              playCorrectSound();
                              onCompleteLesson(activeStudent, `${world.id}_bloque_${activeBlockIdx}`);
                            } else {
                              playWrongSound();
                            }
                          }}
                          className={`p-2.5 text-sm font-medium rounded-lg border text-left transition-colors cursor-pointer ${
                            picked
                              ? isCorrect
                                ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                                : 'bg-red-100 border-red-400 text-red-900'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          {opt.hy}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPRESIONES ÚTILES */}
      {subTab === 'expresiones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {world.expressions.map((exp, idx) => (
            <div key={exp.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="text-xs font-medium text-slate-500">
                Expresión {idx + 1} · <SpPhrase es={exp.situationEs} hy={exp.situationHy} showAudio={false} />
              </div>
              <div className="text-lg font-semibold">
                <SpPhrase es={exp.es} hy={exp.hy} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: DIÁLOGOS COMPLETOS */}
      {subTab === 'dialogos' && (
        <div className="space-y-6">
          {world.fullDialogues.map((dlg) => (
            <div key={dlg.id} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900">
                    <SpPhrase es={dlg.titleEs} hy={dlg.titleHy} showAudio={false} />
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayDialogue(dlg.id, dlg.lines, false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    {playingDialogueId === dlg.id ? 'Detener' : 'Escuchar todo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlayDialogue(dlg.id, dlg.lines, true)}
                    className="px-3 py-2 text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    Lento
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {dlg.lines.map((line, i) => {
                  const isActive = playingDialogueId === dlg.id && activeLineIdx === i;
                  return (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl border ${
                        isActive ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-blue-700 mr-2">{line.speaker}:</span>
                      <SpPhrase es={line.es} hy={line.hy} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: GRAMÁTICA EN ARMENIO */}
      {subTab === 'gramatica' && (
        <div className="space-y-6">
          {world.grammar.map((gram) => {
            const chosen = grammarAnswers[gram.id];
            const isLessonDone = studentProgress.completedLessons.includes(`${world.id}_${gram.id}`);
            return (
              <div key={gram.id} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-xl font-bold text-slate-900">{gram.titleEs}</h3>
                  {isLessonDone && (
                    <span className="text-xs font-semibold text-emerald-700">✓ Completada</span>
                  )}
                </div>

                <div className="bg-violet-50/70 border border-violet-200 rounded-xl p-4 text-sm sm:text-base text-slate-800 whitespace-pre-line leading-relaxed">
                  {gram.explanationHy}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-500">Ejemplos (pulsa para escuchar y traducir):</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {gram.examples.map((ex, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                        <SpPhrase es={ex.es} hy={ex.hy} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mini grammar check */}
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="text-sm font-bold text-slate-900">
                    <SpPhrase es={gram.quiz.questionEs} hy={gram.quiz.questionHy} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {gram.quiz.options.map((opt, idx) => {
                      const isPicked = chosen === idx;
                      const isRight = idx === gram.quiz.correctIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setGrammarAnswers((prev) => ({ ...prev, [gram.id]: idx }));
                            if (isRight) {
                              playCorrectSound();
                              onCompleteLesson(activeStudent, `${world.id}_${gram.id}`);
                            } else {
                              playWrongSound();
                            }
                          }}
                          className={`p-3 text-sm font-semibold rounded-xl border text-left transition-colors cursor-pointer ${
                            isPicked
                              ? isRight
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-red-600 text-white border-red-600'
                              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {chosen !== undefined && (
                    <div
                      className={`text-sm font-medium p-3 rounded-xl border ${
                        chosen === gram.quiz.correctIndex
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      {gram.quiz.feedbackHy}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 5: TARJETAS INTERACTIVAS CON AUDIO */}
      {subTab === 'tarjetas' && currentCard && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>
              Tarjeta {(cardIndex % flashcardPool.length) + 1} de {flashcardPool.length} · {currentCard.category}
            </span>
            <span>Pulsa la tarjeta para girar</span>
          </div>

          <div
            onClick={() => setCardFlipped((f) => !f)}
            className="bg-white border-2 border-slate-200 hover:border-blue-400 rounded-2xl p-8 min-h-[270px] flex flex-col items-center justify-center text-center gap-4 cursor-pointer transition-colors shadow-sm"
          >
            <div className="text-5xl" aria-hidden="true">{currentCard.icon}</div>
            {!cardFlipped ? (
              <>
                <div className="font-display text-3xl font-extrabold text-slate-900">{currentCard.es}</div>
                <div className="text-sm text-slate-500">Pulsa para ver traducción al armenio y ejemplo</div>
              </>
            ) : (
              <>
                <div className="font-display text-2xl font-bold text-violet-700">{currentCard.hy}</div>
                <div className="text-base font-medium text-slate-800">{currentCard.exampleEs}</div>
                <div className="text-sm text-slate-500">{currentCard.exampleHy}</div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => speakEs(currentCard.es, false)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                Escuchar palabra
              </button>
              <button
                type="button"
                onClick={() => speakEs(currentCard.exampleEs, true)}
                className="px-3.5 py-2.5 text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Ejemplo lento
              </button>
              <button
                type="button"
                onClick={() => setCardFlipped((f) => !f)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                Girar
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onToggleHardWord(activeStudent, currentCard.id);
                  setCardFlipped(false);
                  setCardIndex((i) => i + 1);
                }}
                className="px-3.5 py-2.5 text-sm font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-xl cursor-pointer"
              >
                Repetir luego
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!studentProgress.learnedWords.includes(currentCard.id)) {
                    onToggleLearnedWord(activeStudent, currentCard.id);
                  }
                  playCorrectSound();
                  setCardFlipped(false);
                  setCardIndex((i) => i + 1);
                }}
                className="px-4 py-2.5 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl cursor-pointer"
              >
                ¡Ya la sé! Siguiente →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
