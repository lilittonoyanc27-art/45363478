import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { KeyRound, ShieldCheck, LogOut, Loader2, ArrowRight, GraduationCap } from 'lucide-react';
import { ASSETS, UserProfileDoc, UserRole } from './types';
import { SpPhrase } from './ClickSpanish';
import {
  claimStudentProfile,
  claimTeacherProfile,
  signInWithGoogle,
  signOutUser,
} from './firebaseClient';

interface ProfileGateProps {
  authUser: User | null;
  onProfileReady: (profile: UserProfileDoc) => void;
}

export const ProfileGate: React.FC<ProfileGateProps> = ({ authUser, onProfileReady }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('razmik');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleEnterStudent = async (role: 'razmik' | 'gayane') => {
    const clean = accessCode.trim().toUpperCase();
    if (clean.length < 4) {
      setErrorMsg('Introduce el código de acceso que te dio tu profesor (mínimo 4 caracteres).');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const user = authUser || (await signInWithGoogle());
      const profile = await claimStudentProfile(user, role, clean);
      onProfileReady(profile);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo iniciar sesión. Inténtalo otra vez.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterTeacher = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const user = authUser || (await signInWithGoogle());
      const profile = await claimTeacherProfile(user);
      onProfileReady(profile);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo verificar la cuenta del profesor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === 'profesor') {
      void handleEnterTeacher();
    } else {
      void handleEnterStudent(selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-3xl w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold text-blue-700 tracking-wide uppercase">
            ¡HABLA Y GANA! 🇪🇸 · Acceso protegido en la nube
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
            RAZMIK 🔵 GAYANE 🩷
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            <SpPhrase
              es="Elige tu perfil para guardar automáticamente tu progreso, puntos y grabaciones."
              hy="Ընտրիր քո պրոֆիլը՝ առաջընթացդ, միավորներդ և ձայնագրություններդ ավտոմատ պահելու համար:"
            />
          </p>
        </div>

        {/* 3 Profile Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('razmik');
              setErrorMsg('');
            }}
            className={`p-5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-3 ${
              selectedRole === 'razmik'
                ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                : 'border-slate-200 bg-white hover:border-blue-300'
            }`}
          >
            <img
              src={ASSETS.razmikAvatar}
              alt="Razmik"
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500"
            />
            <div>
              <div className="font-display text-xl font-extrabold text-blue-950">👦 Razmik</div>
              <div className="text-xs text-slate-500 font-medium">Perfil de alumno</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('gayane');
              setErrorMsg('');
            }}
            className={`p-5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-3 ${
              selectedRole === 'gayane'
                ? 'border-pink-600 bg-pink-50/70 shadow-sm'
                : 'border-slate-200 bg-white hover:border-pink-300'
            }`}
          >
            <img
              src={ASSETS.gayaneAvatar}
              alt="Gayane"
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-pink-500"
            />
            <div>
              <div className="font-display text-xl font-extrabold text-pink-950">👧 Gayane</div>
              <div className="text-xs text-slate-500 font-medium">Perfil de alumna</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('profesor');
              setErrorMsg('');
            }}
            className={`p-5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
              selectedRole === 'profesor'
                ? 'border-slate-900 bg-slate-100 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-400'
            }`}
          >
            <div className="w-20 h-20 rounded-2xl bg-slate-900 text-amber-300 flex items-center justify-center">
              <GraduationCap className="w-10 h-10" />
            </div>
            <div>
              <div className="font-display text-xl font-extrabold text-slate-900">👩‍🏫 Profesor</div>
              <div className="text-xs text-slate-500 font-medium">Panel de evaluación</div>
            </div>
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
          {authUser && (
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 text-xs text-slate-600">
              <span>
                Cuenta conectada: <strong>{authUser.email}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  void signOutUser();
                }}
                className="inline-flex items-center gap-1 text-red-700 font-semibold hover:underline cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cambiar cuenta de Google
              </button>
            </div>
          )}

          {selectedRole !== 'profesor' ? (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                Código de acceso personal para {selectedRole === 'razmik' ? 'Razmik 🔵' : 'Gayane 🩷'}
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder={selectedRole === 'razmik' ? 'Ejemplo: RAZMIK-2026' : 'Ejemplo: GAYANE-2026'}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-mono-num font-bold tracking-wider uppercase focus:border-blue-500 focus:outline-none"
                autoComplete="off"
              />
              <p className="text-xs text-slate-500">
                <SpPhrase
                  es="Pide tu código individual al profesor. Nadie más podrá abrir tus resultados ni tus audios."
                  hy="Հարցրու քո անհատական կոդը ուսուցչից: Ուրիշ ոչ ոք չի կարող տեսնել քո արդյունքներն ու ձայնագրությունները:"
                  showAudio={false}
                />
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-slate-700">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Acceso exclusivo del Profesor (Ուսուցչի մուտք)
              </div>
              <p className="text-xs text-slate-600">
                Solo la cuenta verificada del profesor puede gestionar los códigos, escuchar las grabaciones de los alumnos y revisar sus respuestas.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-6 text-base font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 ${
              selectedRole === 'razmik'
                ? 'bg-blue-600 hover:bg-blue-700'
                : selectedRole === 'gayane'
                  ? 'bg-pink-600 hover:bg-pink-700'
                  : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verificando perfil en la nube...
              </>
            ) : (
              <>
                {authUser ? 'Entrar a mi perfil ahora' : 'Continuar con Google y entrar'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
