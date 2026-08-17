import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  ShieldCheck,
  Smartphone,
  UserCheck
} from 'lucide-react';
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { InstallAppModal } from './InstallAppModal';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  companyName?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, companyName }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = authService.login(username, password);
      setIsLoading(false);
      if (res.success) {
        onLoginSuccess();
      } else {
        setError(res.message || 'Échec de la connexion.');
      }
    }, 400);
  };

  const fillDemoCredentials = () => {
    setUsername('admin');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-extrabold text-2xl mx-auto">
            F
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              Factura <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-medium">BTP & Services</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {companyName || 'Accès sécurisé à la gestion de facturation'}
            </p>
          </div>
        </div>

        {/* Protection Banner Notice */}
        <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 flex items-start space-x-3 text-xs text-slate-300">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block mb-0.5">Application Protégée</span>
            <span>Entrez votre nom d'utilisateur et votre mot de passe pour accéder à vos devis, factures et fiche client.</span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-2xl text-xs text-rose-300 flex items-center space-x-2 animate-shake">
            <Lock className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Nom d'utilisateur</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex: admin"
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/90 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-blue-400" />
                <span>Mot de passe</span>
              </span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-700 bg-slate-800/90 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 text-sm active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-pulse">Vérification...</span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Se Connecter</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Helper */}
        <div className="pt-3 border-t border-slate-800 text-center space-y-2">
          <p className="text-[11px] text-slate-400">
            Compte administrateur par défaut :
          </p>
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="w-full py-2 px-3 bg-slate-800/60 hover:bg-slate-800 text-blue-400 hover:text-blue-300 font-mono text-xs rounded-xl border border-slate-700/60 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Remplir démo (admin / admin123)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowInstallModal(true)}
            className="w-full py-2 px-3 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 text-xs rounded-xl border border-blue-800/50 transition-colors flex items-center justify-center space-x-2"
          >
            <Smartphone className="h-3.5 w-3.5 text-blue-400" />
            <span>Installer l'application sur Android</span>
          </button>
        </div>
      </div>

      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      {/* Footer copyright */}
      <div className="mt-8 text-center text-slate-500 text-[11px] space-y-1 relative z-10">
        <p>© 2026 Factura BTP & Services Algérie. Tous droits réservés.</p>
        <p className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Authentification sécurisée</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3 text-blue-400" /> Conformité Fiscale Algérie</span>
        </p>
      </div>
    </div>
  );
};
