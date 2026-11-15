import React, { useState } from 'react';
import { Volume2, MapPin, BookOpen, Gamepad2, Headphones, Mic, Clock } from 'lucide-react';
import { HotspotItem, WorldData } from './types';
import { speakEs } from './audio';
import { SpPhrase } from './ClickSpanish';

interface WorldSceneProps {
  world: WorldData;
  completionPercent: number;
  activeTab: 'explorar' | 'teoria' | 'juegos';
  onChangeTab: (tab: 'explorar' | 'teoria' | 'juegos') => void;
  onQuickAction: (mode: 'hablar' | 'escuchar' | 'competir' | 'reto_30') => void;
}

export const WorldScene: React.FC<WorldSceneProps> = ({
  world,
  completionPercent,
  activeTab,
  onChangeTab,
  onQuickAction,
}) => {
  const [selectedSpot, setSelectedSpot] = useState<HotspotItem | null>(world.hotspots[0] || null);
  const [exploredIds, setExploredIds] = useState<string[]>([]);

  const handleSelectHotspot = (spot: HotspotItem) => {
    setSelectedSpot(spot);
    speakEs(spot.phraseEs);
    if (!exploredIds.includes(spot.id)) {
      setExploredIds((prev) => [...prev, spot.id]);
    }
  };

  return (
    <section className="space-y-6">
      {/* World Banner Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-500">
            Mundo interactivo · {world.vocab.length} palabras · {world.expressions.length} expresiones · Progreso {completionPercent}%
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {world.icon} {world.nameEs}
          </h1>
          <p className="text-slate-600 text-base">
            <SpPhrase es={world.subtitleEs} hy={world.subtitleHy} />
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => onChangeTab('explorar')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'explorar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Explorar escena
            </button>
            <button
              type="button"
              onClick={() => onChangeTab('teoria')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'teoria' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Aprendemos antes de jugar
            </button>
            <button
              type="button"
              onClick={() => onChangeTab('juegos')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'juegos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              Juegos del mundo
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Illustration Explorer */}
      {activeTab === 'explorar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video">
            <img
              src={world.image}
              alt={world.nameEs}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-4 right-4 text-xs sm:text-sm text-white font-medium pointer-events-none">
              Pulsa los puntos en la escena para escuchar español y ver el significado en armenio ({exploredIds.length}/{world.hotspots.length})
            </div>

            {world.hotspots.map((spot, idx) => {
              const isSelected = selectedSpot?.id === spot.id;
              const isVisited = exploredIds.includes(spot.id);
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => handleSelectHotspot(spot)}
                  style={{ left: `${spot.xPercent}%`, top: `${spot.yPercent}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] px-2.5 py-1.5 rounded-full font-display text-xs font-bold shadow-lg border-2 transition-transform cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 border-white scale-110 z-20'
                      : isVisited
                        ? 'bg-emerald-600 text-white border-white hover:scale-105 z-10'
                        : 'bg-blue-600 text-white border-white hover:scale-105 z-10'
                  }`}
                >
                  <span>{idx + 1}</span>
                  <span className="hidden sm:inline whitespace-nowrap">{spot.labelEs}</span>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4">
            {selectedSpot ? (
              <div className="space-y-4">
                <div className="text-xs font-medium text-slate-500">Objeto interactivo seleccionado (pulsa para traducir)</div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  <SpPhrase es={selectedSpot.labelEs} hy={selectedSpot.labelHy} showAudio={false} />
                </h2>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-xs font-medium text-slate-500">Frase útil en esta zona:</div>
                  <div className="text-base font-semibold text-slate-900">
                    <SpPhrase es={selectedSpot.phraseEs} hy={selectedSpot.phraseHy} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => speakEs(selectedSpot.phraseEs, false)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      Escuchar normal
                    </button>
                    <button
                      type="button"
                      onClick={() => speakEs(selectedSpot.phraseEs, true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                    >
                      Más despacio
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">Pulsa cualquier punto numerado de la imagen.</div>
            )}

            <div className="space-y-2 pt-4 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-500">Accesos rápidos de práctica:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => onQuickAction('reto_30')}
                  className="w-full py-2.5 px-4 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors text-left flex items-center justify-between cursor-pointer"
                >
                  <span>⏱️ Reto de 30 preguntas (2 min)</span>
                  <Clock className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTab('teoria')}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors text-left flex items-center justify-between cursor-pointer"
                >
                  <span>Ir a teoría ({world.vocab.length} palabras)</span>
                  <BookOpen className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onQuickAction('hablar')}
                    className="py-2.5 px-3 text-xs font-semibold text-pink-700 bg-pink-50 border border-pink-200 hover:bg-pink-100 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    Hablar
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickAction('escuchar')}
                    className="py-2.5 px-3 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Headphones className="w-4 h-4" />
                    Escuchar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
