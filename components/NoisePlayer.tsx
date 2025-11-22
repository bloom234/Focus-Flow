
import React, { useState } from 'react';
import { Volume2, VolumeX, Play, Square, Music, ChevronDown } from 'lucide-react';
import { audioService } from '../services/audioService';
import { NoiseType, ThemeColors } from '../types';

interface NoisePlayerProps {
  colors: ThemeColors;
}

export const NoisePlayer: React.FC<NoisePlayerProps> = ({ colors }) => {
  const [selectedNoise, setSelectedNoise] = useState<NoiseType>(NoiseType.White);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isVisible, setIsVisible] = useState(true);

  const handlePlayToggle = () => {
    if (isPlaying) {
      audioService.stop();
      setIsPlaying(false);
    } else {
      audioService.play(selectedNoise, volume);
      setIsPlaying(true);
    }
  };

  const handleNoiseChange = (type: NoiseType) => {
    setSelectedNoise(type);
    if (isPlaying) {
      audioService.play(type, volume);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (isPlaying) {
      audioService.setVolume(val);
    }
  };

  return (
    <>
      {/* Minimized Trigger Button - Slides up when player slides down */}
      <button 
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-6 left-6 z-30 p-3 rounded-full shadow-xl hover:scale-110 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${colors.accent} text-white ${
          !isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
        title="Show Music Player"
      >
        <Music size={24} />
      </button>

      {/* Main Player Card - Slides down to hide */}
      <div 
        className={`fixed bottom-6 left-1/2 w-[95%] sm:w-[90%] max-w-2xl ${colors.cardBg} border ${colors.border} rounded-2xl shadow-2xl p-3 sm:p-4 flex flex-col items-center z-30 backdrop-blur-md bg-opacity-95 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform ${
          isVisible ? 'translate-x-[-50%] translate-y-0 opacity-100' : 'translate-x-[-50%] translate-y-[150%] opacity-0 pointer-events-none'
        }`}
      >
        
        {/* Header / Close Button */}
        <button 
          onClick={() => setIsVisible(false)}
          className={`absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 ${colors.text} opacity-60 hover:opacity-100 transition`}
          title="Minimize Player"
        >
          <ChevronDown size={20} />
        </button>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full mt-1">
          
          {/* Play/Pause & Selection */}
          <div className="flex items-center space-x-4 w-full sm:w-auto justify-center">
            <button 
              onClick={handlePlayToggle}
              className={`p-3 rounded-full ${colors.accent} text-white shadow-lg hover:scale-105 transition flex-shrink-0`}
            >
              {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>

            <div className="flex space-x-1 bg-black/10 p-1 rounded-lg overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar scroll-smooth">
              {Object.values(NoiseType).map((type) => (
                <button
                  key={type}
                  onClick={() => handleNoiseChange(type)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedNoise === type 
                      ? `${colors.bg} ${colors.text} shadow-sm` 
                      : `${colors.text} opacity-60 hover:opacity-100`
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2 w-full sm:w-48 px-2">
            <button onClick={() => setVolume(volume === 0 ? 0.5 : 0)} className={colors.text}>
               {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-current"
              style={{ accentColor: 'currentColor' }} 
            />
          </div>
        </div>
      </div>
    </>
  );
};
