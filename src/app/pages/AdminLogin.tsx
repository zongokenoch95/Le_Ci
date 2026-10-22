import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Crown, 
  ChefHat, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { loginAdmin, getAuthToken, getStoredAdminUser } from '../services/api';

export function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  useEffect(() => {
    // Si déjà authentifié avec token valide, aller directement au dashboard
    const token = getAuthToken();
    const user = getStoredAdminUser();
    if (token && user) {
      navigate('/admin', { replace: true });
    }

    // Détecter si on a été redirigé suite à une session expirée
    if (location.state && (location.state as any).expired) {
      setSessionExpiredNotice(true);
    }
  }, [navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Veuillez renseigner votre adresse email et mot de passe.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await loginAdmin({ email, password });
      if (res.success && res.token) {
        navigate('/admin', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Identifiants invalides ou compte restreint.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'gerant' | 'employe') => {
    if (role === 'gerant') {
      setEmail('gerant@lesdouceursdeleci.com');
      setPassword('Admin@Leci2026!');
    } else {
      setEmail('cuisine@lesdouceursdeleci.com');
      setPassword('Staff@Leci2026!');
    }
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Halo lumineux de fond */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] text-black shadow-xl shadow-[#D4AF37]/20 mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Portail Restreint
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Accès sécurisé pour la Gérance et la Brigade de cuisine
          </p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-[#1E293B]/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/10"
        >
          {sessionExpiredNotice && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs leading-relaxed">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>Votre session a expiré après une période d'inactivité. Par mesure de sécurité, veuillez vous reconnecter.</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs leading-relaxed">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Adresse Email Professionnelle
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@lesdouceursdeleci.com"
                  className="block w-full pl-10 pr-4 py-3 bg-[#0F172A] border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Mot de Passe Sécurisé
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <KeyRound size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-12 py-3 bg-[#0F172A] border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#D4AF37] hover:bg-[#c29d2b] text-black font-extrabold text-sm shadow-xl shadow-[#D4AF37]/20 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Vérification du jeton de sécurité...</span>
                  </>
                ) : (
                  <>
                    <span>Ouvrir ma Session Sécurisée</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Accès rapide pour démonstration */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center mb-3">
              Comptes Démonstration RBAC
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillDemoCredentials('gerant')}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 text-left transition flex items-center gap-2 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0">
                  <Crown size={15} />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white">Gérant</div>
                  <div className="text-[10px] text-gray-400">Tous droits & CA</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoCredentials('employe')}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-sky-500/20 border border-white/10 text-left transition flex items-center gap-2 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <ChefHat size={15} />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white">Employé</div>
                  <div className="text-[10px] text-gray-400">KDS Cuisine seul</div>
                </div>
              </button>
            </div>
          </div>

          {/* Badges de sécurité */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-4 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-400" /> Session JWT (4h)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={14} className="text-emerald-400" /> Contrôle RBAC Actif
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
