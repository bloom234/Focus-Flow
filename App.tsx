import React, { useState, useRef, useEffect } from 'react';
import { Settings, Maximize2, Minimize2, GripHorizontal, GripVertical } from 'lucide-react';
import { Theme, THEME_STYLES, SplitDirection, RecordedSession } from './types';
import { FlipClock } from './components/FlipClock';
import { CameraRecorder } from './components/CameraRecorder';
import { NoisePlayer } from './components/NoisePlayer';
import { SidePanel } from './components/SidePanel';

const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(Theme.LightAndDark);
  const [isSplitScreen, setIsSplitScreen] = useState(true);
  const [splitDirection, setSplitDirection] = useState<SplitDirection>('horizontal');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSettingsTrigger, setShowSettingsTrigger] = useState(false);
  const [sessions, setSessions] = useState<RecordedSession[]>([]);
  
  // PiP State - Default to TRUE as requested
  const [isPip, setIsPip] = useState(true);

  // Resizable Layout State
  const [splitRatio, setSplitRatio] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const colors = THEME_STYLES[currentTheme];

  // Handle saving a new session from recorder
  const handleSaveSession = (session: RecordedSession) => {
    setSessions(prev => [session, ...prev]);
  };

  // Handle deleting a session
  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  // Unified Drag Start Logic
  const handleDragStart = () => {
    if (!isSplitScreen || isPip) return;
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      let newRatio = 50;

      if (splitDirection === 'horizontal') {
        const offsetX = clientX - containerRect.left;
        newRatio = (offsetX / containerRect.width) * 100;
      } else {
        const offsetY = clientY - containerRect.top;
        newRatio = (offsetY / containerRect.height) * 100;
      }

      // Clamp ratio between 10% and 90%
      newRatio = Math.max(10, Math.min(90, newRatio));
      setSplitRatio(newRatio);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            e.preventDefault();
            handleMove(e.clientX, e.clientY);
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (isDragging) {
            e.preventDefault(); 
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, splitDirection]);

  // Layout Logic
  const isHorizontal = splitDirection === 'horizontal';
  const isCompact = isSplitScreen && !isPip;
  
  // Determine sizes based on state
  const getCameraStyle = (): React.CSSProperties => {
    if (isPip) return { flexBasis: '0%', overflow: 'visible', zIndex: 50 };
    if (!isSplitScreen) return { flexBasis: '0%', overflow: 'hidden' };
    return { flexBasis: `${splitRatio}%`, overflow: 'hidden' };
  };

  const getTimerStyle = (): React.CSSProperties => {
    if (isPip) return { flexBasis: '100%', overflowY: 'auto' };
    if (!isSplitScreen) return { flexBasis: '100%', overflowY: 'auto' };
    return { flexBasis: `${100 - splitRatio}%`, overflowY: 'auto' };
  };

  const transitionClass = isDragging ? '' : 'transition-[flex-basis] duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)';

  // "Minimized" visual effect when in split screen mode (not PiP)
  // Added more padding (p-2) in split mode to create visible separation
  const contentScaleClass = isCompact
    ? 'rounded-3xl shadow-2xl ring-1 ring-black/5 m-2' // Margin added for gap
    : 'transform-none rounded-none m-0';

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col ${colors.bg} transition-colors duration-500`}>
      
      {/* Top Right Hover Trigger for Settings - More Visible/Interactable */}
      <div 
        className="fixed top-0 right-0 w-24 h-24 z-[60] flex justify-end items-start p-4"
        onMouseEnter={() => setShowSettingsTrigger(true)}
        onMouseLeave={() => setShowSettingsTrigger(false)}
      >
        <button
          onClick={() => setIsSettingsOpen(true)}
          className={`p-3 rounded-full bg-white/20 backdrop-blur-md shadow-2xl transition-all duration-500 ease-out transform ${
            showSettingsTrigger || isSettingsOpen ? 'opacity-100 translate-y-0 rotate-0 scale-100' : 'opacity-70 translate-y-0 rotate-0 scale-90 md:opacity-0 md:-translate-y-8 md:rotate-90 md:scale-75'
          } ${colors.text} hover:scale-110 hover:bg-white/30 hover:opacity-100`}
          title="Open Settings"
        >
          <Settings size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <main 
        ref={containerRef}
        className={`flex-1 flex relative overflow-hidden ${isHorizontal ? 'flex-row' : 'flex-col'} ${isCompact ? 'p-2 gap-2' : ''}`}
      >
        
        {/* Camera Section (First) */}
        <div 
          style={getCameraStyle()}
          className={`relative z-50 ${transitionClass} flex items-center justify-center`}
        >
          {/* Wrapper must allow overflow when PiP so fixed child isn't clipped by 0-size parent */}
          <div className={`w-full h-full ${isPip ? 'overflow-visible' : 'overflow-hidden'} transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${contentScaleClass}`}>
            <CameraRecorder 
              colors={colors} 
              isHidden={!isSplitScreen && !isPip} 
              onSaveSession={handleSaveSession}
              isPip={isPip}
              onTogglePip={() => setIsPip(!isPip)}
              isCompact={isCompact}
            />
          </div>
        </div>

        {/* Resizer Handle (The "Seam") */}
        {isCompact && (
          <div
            onMouseDown={(e) => { e.preventDefault(); handleDragStart(); }}
            onTouchStart={handleDragStart}
            className={`z-30 flex items-center justify-center transition-all duration-300 ${
              isHorizontal 
                ? 'w-6 cursor-col-resize -ml-3 h-full' 
                : 'h-6 cursor-row-resize -mt-3 w-full'
            }`}
            style={{ 
                position: 'absolute', 
                [isHorizontal ? 'left' : 'top']: `${splitRatio}%`, 
                [isHorizontal ? 'top' : 'left']: 0,
                [isHorizontal ? 'bottom' : 'right']: 0,
                transform: isHorizontal ? 'translateX(-50%)' : 'translateY(-50%)',
                touchAction: 'none' 
            }}
          >
             {/* Visual Handle Pill */}
             <div className={`
                transition-all duration-300 rounded-full shadow-lg flex items-center justify-center backdrop-blur-sm
                ${isHorizontal ? 'w-1.5 h-16 hover:h-24' : 'h-1.5 w-16 hover:w-24'}
                ${colors.accent}
             `}>
                 {/* Inner dot for detail */}
                 <div className="w-0.5 h-0.5 rounded-full bg-white/50"></div>
             </div>
          </div>
        )}

        {/* Timer Section (Second) */}
        <div 
            style={getTimerStyle()}
            className={`relative ${transitionClass} flex items-center justify-center`}
        >
          <div className={`w-full h-full flex overflow-hidden transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${colors.secondaryBg} ${contentScaleClass}`}>
            
            <div className="w-full h-full overflow-y-auto custom-scrollbar relative">
              <FlipClock colors={colors} isCompact={isCompact} />
            </div>

            {/* Slider/Layout Toggle Handle (Visible when NOT in settings and NOT PiP) - Always visible now */}
            {!isPip && (
              <div className="absolute bottom-6 right-6 z-10 animate-fade-in">
                  <button
                  onClick={() => setIsSplitScreen(!isSplitScreen)}
                  className={`p-3 rounded-full ${colors.cardBg} ${colors.text} shadow-lg hover:scale-110 transition border ${colors.border} opacity-60 hover:opacity-100`}
                  title={isSplitScreen ? "Maximize Timer" : "Show Split Screen"}
                  >
                  {isSplitScreen ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
                  </button>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Audio Player Footer */}
      <NoisePlayer colors={colors} />

      {/* Side Panel Settings */}
      <SidePanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        colors={colors}
        isSplitScreen={isSplitScreen}
        onToggleSplitScreen={() => setIsSplitScreen(!isSplitScreen)}
        splitDirection={splitDirection}
        onDirectionChange={setSplitDirection}
        sessions={sessions}
        onDeleteSession={handleDeleteSession}
      />

    </div>
  );
};

export default App;