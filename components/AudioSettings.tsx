
import React from 'react';

interface AudioSettingsProps {
  show: boolean;
  onClose: () => void;
  isBgmPlaying: boolean;
  toggleBgm: () => void;
  bgmVolume: number;
  setBgmVolume: (volume: number) => void;
  sfxVolume: number;
  setSfxVolume: (volume: number) => void;
  // Removed isVoiceEnabled: boolean;
  // Removed setVoiceEnabled: (enabled: boolean) => void;
}

const AudioSettings: React.FC<AudioSettingsProps> = ({
  show,
  onClose,
  isBgmPlaying,
  toggleBgm,
  bgmVolume,
  setBgmVolume,
  sfxVolume,
  setSfxVolume,
  // Removed isVoiceEnabled,
  // Removed setVoiceEnabled,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 border-8 border-double border-stone-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-500 hover:text-stone-800 transition-colors"
          aria-label="Close settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-stone-800 mb-6 border-b-2 pb-2">音效設定</h2>

        <div className="space-y-6">
          {/* Background Music Toggle */}
          <div className="flex items-center justify-between px-3">
            <span className="text-stone-700 font-medium text-sm">背景音樂</span>
            <button
              onClick={toggleBgm}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isBgmPlaying ? 'bg-stone-800 focus:ring-stone-900' : 'bg-stone-300 focus:ring-stone-400'}`}
              role="switch"
              aria-checked={isBgmPlaying}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${isBgmPlaying ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {/* Background Music Volume Slider */}
          <div className="px-3">
            <label htmlFor="bgmVolume" className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">背景音樂音量</label>
            <input
              type="range"
              id="bgmVolume"
              min="0"
              max="1"
              step="0.05"
              value={bgmVolume}
              onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer range-lg accent-stone-800"
            />
          </div>

          {/* SFX Volume Slider */}
          <div className="px-3">
            <label htmlFor="sfxVolume" className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">音效音量</label>
            <input
              type="range"
              id="sfxVolume"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer range-lg accent-blue-600"
            />
          </div>

          {/* Removed Voice Enabled Toggle */}

        </div>
        
        <div className="mt-8 text-center">
            <button onClick={onClose} className="bg-stone-800 text-white px-8 py-2 rounded-full font-bold text-sm shadow-md hover:bg-black transition-all">完成設定</button>
        </div>
      </div>
    </div>
  );
};

export default AudioSettings;