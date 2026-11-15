// Spanish TTS via Web Speech API + gentle sound effects via Web Audio API + Real Voice Recorder (MediaRecorder) + Optional SpeechRecognition

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playTone(freq: number, durationMs: number, type: OscillatorType = 'sine', volume = 0.12, delayMs = 0) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime + delayMs / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.02);
}

export function playCorrectSound() {
  playTone(523.25, 120, 'triangle', 0.14, 0);
  playTone(659.25, 140, 'triangle', 0.14, 90);
  playTone(783.99, 220, 'triangle', 0.14, 180);
}

export function playWrongSound() {
  playTone(240, 160, 'sawtooth', 0.08, 0);
  playTone(185, 240, 'sawtooth', 0.08, 120);
}

export function playVictorySound() {
  playTone(523.25, 120, 'triangle', 0.15, 0);
  playTone(659.25, 120, 'triangle', 0.15, 110);
  playTone(783.99, 120, 'triangle', 0.15, 220);
  playTone(1046.5, 360, 'triangle', 0.16, 330);
}

export function playTickSound() {
  playTone(880, 45, 'sine', 0.05, 0);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function speakEs(text: string, slow = false, onEnd?: () => void) {
  if (!isSpeechSynthesisSupported()) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = slow ? 0.68 : 0.96;
  utterance.pitch = 1.02;

  const voices = window.speechSynthesis.getVoices();
  const spanishVoice =
    voices.find((v) => v.lang.toLowerCase().startsWith('es-es')) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('es'));
  if (spanishVoice) {
    utterance.voice = spanishVoice;
  }

  if (onEnd) {
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();
  }
  window.speechSynthesis.speak(utterance);
}

export function speakDialogueSequence(lines: { es: string }[], slow = false, onIndexChange?: (idx: number) => void, onDone?: () => void) {
  if (!isSpeechSynthesisSupported() || lines.length === 0) {
    onDone?.();
    return;
  }
  let cancelled = false;
  let current = 0;

  const next = () => {
    if (cancelled || current >= lines.length) {
      onIndexChange?.(-1);
      onDone?.();
      return;
    }
    onIndexChange?.(current);
    const idx = current;
    current += 1;
    speakEs(lines[idx].es, slow, () => {
      if (!cancelled) {
        setTimeout(next, 280);
      }
    });
  };

  next();
  return () => {
    cancelled = true;
    stopSpeaking();
    onIndexChange?.(-1);
  };
}

export interface VoiceRecorderController {
  stop: () => void;
}

export function isMediaRecorderSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  );
}

export async function startVoiceRecording(
  onComplete: (audioUrl: string, audioBlob: Blob, mimeType: string) => void,
  onError: (msg: string) => void
): Promise<VoiceRecorderController | null> {
  if (!isMediaRecorderSupported()) {
    onError('Tu navegador no permite grabar audio directamente. Puedes escribir tu frase o hablar con el profesor.');
    return null;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeCandidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    const supportedMime = mimeCandidates.find((m) => {
      try {
        return MediaRecorder.isTypeSupported(m);
      } catch {
        return false;
      }
    });

    const recorder = supportedMime
      ? new MediaRecorder(stream, { mimeType: supportedMime, audioBitsPerSecond: 16000 })
      : new MediaRecorder(stream, { audioBitsPerSecond: 16000 });

    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onerror = () => {
      stream.getTracks().forEach((t) => t.stop());
      onError('Error al grabar audio con el micrófono.');
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const mimeType = recorder.mimeType || 'audio/webm';
      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size > 0) {
        const url = URL.createObjectURL(blob);
        onComplete(url, blob, mimeType);
      } else {
        onError('No se detectó sonido en la grabación. Inténtalo de nuevo.');
      }
    };

    recorder.start(250);

    return {
      stop: () => {
        try {
          if (recorder.state !== 'inactive') {
            recorder.stop();
          } else {
            stream.getTracks().forEach((t) => t.stop());
          }
        } catch {
          stream.getTracks().forEach((t) => t.stop());
        }
      },
    };
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      onError('Permiso de micrófono denegado. Permite el micrófono en el navegador para grabar tu voz.');
    } else if (name === 'NotFoundError') {
      onError('No se encontró ningún micrófono conectado en este dispositivo.');
    } else {
      onError('No se pudo acceder al micrófono en este entorno. Usa el cuadro de texto o habla en voz alta.');
    }
    return null;
  }
}

export interface SpeechRecognitionController {
  stop: () => void;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function startListeningEs(
  onTranscript: (text: string, isFinal: boolean) => void,
  onError: (msg: string) => void,
  onEnd: () => void
): SpeechRecognitionController | null {
  if (!isSpeechRecognitionSupported()) {
    return null;
  }
  const w = window as unknown as {
    SpeechRecognition?: new () => {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void;
      onerror: (e: { error: string }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };
    webkitSpeechRecognition?: new () => {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void;
      onerror: (e: { error: string }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };
  };
  const Rec = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Rec) return null;

  const recognition = new Rec();
  recognition.lang = 'es-ES';
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onresult = (event) => {
    let full = '';
    let isFinal = false;
    for (let i = 0; i < event.results.length; i++) {
      full += event.results[i][0].transcript + ' ';
      if (event.results[i].isFinal) isFinal = true;
    }
    onTranscript(full.trim(), isFinal);
  };

  recognition.onerror = (event) => {
    if (event.error !== 'aborted' && event.error !== 'no-speech') {
      onError('Transcripción automática no disponible, pero tu audio sí se está grabando.');
    }
  };

  recognition.onend = () => {
    onEnd();
  };

  try {
    recognition.start();
  } catch {
    return null;
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    },
  };
}
