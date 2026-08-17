import { CheckCircle2, Download, Smartphone, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 text-2xl font-bold">
            <Smartphone className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Installer Factura sur Android
            </h2>
            <p className="text-xs text-slate-400">
              Application Web Progressive (PWA) plein écran sans barre d'adresse
            </p>
          </div>
        </div>

        {/* State Banner */}
        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center space-x-3 text-xs">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Application déjà installée !</p>
              <p>Factura est configurée sur votre appareil et accessible depuis votre écran d'accueil.</p>
            </div>
          </div>
        ) : deferredPrompt ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Votre navigateur prend en charge l'installation directe en 1 clic :
            </p>
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 text-sm transition-all active:scale-98 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Installer l'application maintenant</span>
            </button>
          </div>
        ) : null}

        {/* Instructions for Android Chrome */}
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 space-y-3">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Comment installer manuellement sur Android (Google Chrome) :
          </h3>
          <ol className="text-xs text-slate-300 space-y-2.5 list-decimal list-inside">
            <li className="leading-relaxed">
              Ouvrez l'application dans <strong>Google Chrome</strong> sur votre téléphone ou tablette Android.
            </li>
            <li className="leading-relaxed">
              Appuyez sur le menu en haut à droite (les <strong>3 petits points verticaux ⋮</strong>).
            </li>
            <li className="leading-relaxed">
              Sélectionnez <strong>« Installer l'application »</strong> (ou <strong>« Ajouter à l'écran d'accueil »</strong>).
            </li>
            <li className="leading-relaxed">
              Validez en cliquant sur <strong>« Installer »</strong>. L'icône Factura apparaîtra sur votre écran d'accueil comme une application native !
            </li>
          </ol>
        </div>

        {/* Features of the installed version */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
            <span className="font-semibold text-slate-200 block mb-0.5">📱 Expérience Plein Écran</span>
            <span className="text-slate-400 text-[11px]">Fonctionne sans barre de navigation de navigateur.</span>
          </div>
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
            <span className="font-semibold text-slate-200 block mb-0.5">⚡ Lancement Rapide</span>
            <span className="text-slate-400 text-[11px]">Accessible directement depuis vos applications Android.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
