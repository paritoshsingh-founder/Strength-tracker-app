'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Show manual instructions
      setShowInstructions(true);
    }
  };

  // Don't show if already installed
  if (isInstalled) return null;

  return (
    <>
      <button
        onClick={handleInstall}
        className="fixed bottom-6 left-6 flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium text-white shadow-lg transition-all z-50"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Install App
      </button>

      {/* Manual Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Install App</h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-gray-300 space-y-3">
              <p className="font-medium">To install this app:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Tap the <strong>menu (⋮)</strong> in Chrome top-right</li>
                <li>Look for one of these options:
                  <ul className="list-disc list-inside ml-4 mt-1 text-gray-400">
                    <li>&quot;Install app&quot;</li>
                    <li>&quot;Add to Home screen&quot;</li>
                    <li>&quot;Add to phone&quot;</li>
                  </ul>
                </li>
                <li>Tap <strong>&quot;Install&quot;</strong> or <strong>&quot;Add&quot;</strong></li>
              </ol>
              <p className="text-xs text-gray-500 mt-4">
                Not seeing it? Try: Settings → Site settings → this site → &quot;Add to Home screen&quot;
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
