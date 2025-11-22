
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { ThemeColors } from '../types';

interface FlipClockProps {
  colors: ThemeColors;
}

interface TimeParts {
  hours: number;
  minutes: number;
  seconds: number;
}

const AnimatedFlipCard: React.FC<{ 
  digit: string; 
  label: string; 
  colors: ThemeColors; 
  onUp?: () => void; 
  onDown?: () => void; 
  isEditing: boolean 
}> = ({ digit, label, colors, onUp, onDown, isEditing }) => {
  const [prevDigit, setPrevDigit] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (digit !== prevDigit) {
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setIsFlipping(false);
        setPrevDigit(digit);
      }, 600); 
      return () => clearTimeout(timer);
    }
  }, [digit, prevDigit]);

  return (
    <div className="flex flex-col items-center mx-1 sm:mx-2 md:mx-3">
      <div className={`relative w-20 h-24 sm:w-28 sm:h-36 md:w-40 md:h-52 rounded-xl shadow-2xl flip-clock-container group transition-transform duration-300 hover:scale-105`}>
        
        {/* Edit Controls */}
        {isEditing && (
          <div className="absolute inset-0 z-40 flex flex-col justify-between py-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm rounded-xl">
            <button onClick={onUp} className="w-full flex-1 flex justify-center items-start text-white/80 hover:text-white pt-2 hover:bg-white/10 transition">
              <ChevronUp size={24} />
            </button>
            <button onClick={onDown} className="w-full flex-1 flex justify-center items-end text-white/80 hover:text-white pb-2 hover:bg-white/10 transition">
              <ChevronDown size={24} />
            </button>
          </div>
        )}

        {/* Background/Static Card */}
        <div className={`absolute inset-0 flex flex-col rounded-xl overflow-hidden ${colors.cardBg} border ${colors.border}`}>
          {/* Top Half - New Digit (Underneath) */}
          <div className={`relative h-1/2 w-full overflow-hidden border-b ${colors.border}`}>
            <span className={`absolute top-[100%] left-1/2 transform -translate-x-1/2 -translate-y-[50%] text-5xl sm:text-7xl md:text-8xl font-mono font-bold ${colors.text}`}>
              {digit}
            </span>
          </div>
          {/* Bottom Half - Old Digit (Underneath) */}
          <div className={`relative h-1/2 w-full overflow-hidden`}>
             <span className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-[50%] text-5xl sm:text-7xl md:text-8xl font-mono font-bold ${colors.text}`}>
              {prevDigit}
            </span>
          </div>
        </div>

        {/* Animating Flaps */}
        {isFlipping && (
          <div className={`absolute inset-0 flip-card flipped z-20`}>
            
            {/* Top Flap - OLD Digit (Flips Down) */}
            <div className={`absolute top-0 left-0 w-full h-1/2 overflow-hidden rounded-t-xl backface-hidden top-flip ${colors.cardBg} border-b ${colors.border}`}>
               <span className={`absolute top-[100%] left-1/2 transform -translate-x-1/2 -translate-y-[50%] text-5xl sm:text-7xl md:text-8xl font-mono font-bold ${colors.text}`}>
                {prevDigit}
              </span>
            </div>

            {/* Bottom Flap - NEW Digit (Flips Down) */}
            <div className={`absolute bottom-0 left-0 w-full h-1/2 overflow-hidden rounded-b-xl backface-hidden bottom-flip ${colors.cardBg}`}>
               <span className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-[50%] text-5xl sm:text-7xl md:text-8xl font-mono font-bold ${colors.text}`}>
                {digit}
              </span>
            </div>
          </div>
        )}

        {/* Top Static Cover (Visible when NOT flipping to show current digit) */}
        {!isFlipping && (
             <div className={`absolute top-0 left-0 w-full h-1/2 overflow-hidden rounded-t-xl z-30 ${colors.cardBg} border-b ${colors.border}`}>
                <span className={`absolute top-[100%] left-1/2 transform -translate-x-1/2 -translate-y-[50%] text-5xl sm:text-7xl md:text-8xl font-mono font-bold ${colors.text}`}>
                {digit}
                </span>
            </div>
        )}
        
         {/* Bottom Static Cover (Visible when NOT flipping to show current digit) */}
         {!isFlipping && (
             <div className={`absolute bottom-0 left-0 w-full h-1/2 overflow-hidden rounded-b-xl z-30 ${colors.cardBg}`}>
                <span className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-[50%] text-5xl sm:text-7xl md:text-8xl font-mono font-bold ${colors.text}`}>
                {digit}
                </span>
            </div>
        )}

      </div>
      <span className={`mt-4 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] ${colors.text} opacity-60`}>
        {label}
      </span>
    </div>
  );
};

export const FlipClock: React.FC<FlipClockProps> = ({ colors }) => {
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); 
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const formatTime = (totalSeconds: number): TimeParts => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
  };

  const { hours, minutes, seconds } = formatTime(timeLeft);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const adjustTime = (unit: 'hours' | 'minutes' | 'seconds', amount: number) => {
    let newTime = timeLeft;
    if (unit === 'hours') newTime += amount * 3600;
    if (unit === 'minutes') newTime += amount * 60;
    if (unit === 'seconds') newTime += amount;
    
    if (newTime < 0) newTime = 0;
    setTimeLeft(newTime);
  };

  const pad = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 animate-fade-in">
      <div className="flex items-center justify-center mb-16 scale-75 sm:scale-90 md:scale-100 transform transition-transform duration-500">
        <AnimatedFlipCard 
          digit={pad(hours)} 
          label="Hours" 
          colors={colors} 
          isEditing={!isActive}
          onUp={() => adjustTime('hours', 1)}
          onDown={() => adjustTime('hours', -1)}
        />
        <span className={`text-4xl sm:text-6xl font-bold -mt-12 mx-1 ${colors.text} opacity-50 animate-pulse`}>:</span>
        <AnimatedFlipCard 
          digit={pad(minutes)} 
          label="Minutes" 
          colors={colors} 
          isEditing={!isActive}
          onUp={() => adjustTime('minutes', 1)}
          onDown={() => adjustTime('minutes', -1)}
        />
        <span className={`text-4xl sm:text-6xl font-bold -mt-12 mx-1 ${colors.text} opacity-50 animate-pulse`}>:</span>
        <AnimatedFlipCard 
          digit={pad(seconds)} 
          label="Seconds" 
          colors={colors} 
          isEditing={!isActive}
          onUp={() => adjustTime('seconds', 1)}
          onDown={() => adjustTime('seconds', -1)}
        />
      </div>

      <div className="flex space-x-8">
        <button
          onClick={toggleTimer}
          className={`p-5 rounded-full shadow-xl transition-all transform hover:scale-110 active:scale-95 ${isActive ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white ring-4 ring-opacity-20 ring-current`}
        >
          {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
        </button>
        
        <button
          onClick={resetTimer}
          className={`p-5 rounded-full shadow-xl transition-all transform hover:scale-110 active:scale-95 ${colors.accent} text-white ring-4 ring-opacity-20 ring-current`}
        >
          <RotateCcw size={28} />
        </button>
      </div>
    </div>
  );
};
