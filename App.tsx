
import React, { useState, useRef, useEffect } from 'react';
import { Settings, Maximize2, Minimize2, GripHorizontal, GripVertical } from 'lucide-react';
import { Theme, THEME_STYLES, SplitDirection, RecordedSession } from './types';
import { FlipClock } from './components/FlipClock';
import { CameraRecorder } from './components/CameraRecorder';
import { NoisePlayer } from './components/NoisePlayer';
import { SidePanel } from './components/SidePanel';

const App: React.FC = () => {
  // Changed default to 'horizontal' (Side-by-Side layout, Vertical Split Bar)
  const [currentTheme, setCurrentTheme] = useState<Theme>(Theme.LightAndDark);
  const [isSplitScreen, setIsSplitScreen] = useState(true);
  const [splitDirection, setSplitDirection] = useState<SplitDirection>('horizontal');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSettingsTrigger, setShowSettingsTrigger] = useState(false);
  const [sessions, setSessions] = useState<RecordedSession[]>([]);
  
  // PiP State lifted to App to control layout
  const [isPip, setIsPip] = useState(false);

  // Resizable Layout State
  const [splitRatio, setSplitRatio] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const colors = THEME_STYLES[currentTheme];

  // Handle saving a new session from recorder
  const handleSaveSession = (session: RecordedSession) => {
    setSessions(prev => [session, ...prev]);
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
            // Critical: prevent scrolling the page while dragging the handle
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
      // Passive: false required to use preventDefault inside touch handler
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
  
  // Determine sizes based on state
  const getCameraStyle = (): React.CSSProperties => {
    if (isPip) return { flexBasis: '0%', overflow: 'visible', zIndex: 50 }; // Allow PiP to float out
    if (!isSplitScreen) return { flexBasis: '0%', overflow: 'hidden' };
    return { flexBasis: `${splitRatio}%`, overflow: 'hidden' };
  };

  const getTimerStyle = (): React.CSSProperties => {
    // overflowY: 'auto' enables the "slide with a scrollbar" feature if content overflows
    if (isPip) return { flexBasis: '100%', overflowY: 'auto' };
    if (!isSplitScreen) return { flexBasis: '100%', overflowY: 'auto' };
    return { flexBasis: `${100 - splitRatio}%`, overflowY: 'auto' };
  };

  // Conditional transition class: Disable transition when dragging for smoothness (responsive to finger/mouse)
  const transitionClass = isDragging ? '' : 'transition-[flex-basis] duration-700 cubic-bezier(0.4, 0, 0.2, 1)';

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col ${colors.bg} transition-colors duration-500`}>
      
      {/* Top Right Hover Trigger for Settings */}
      <div 
        className="fixed top-0 right-0 w-32 h-32 z-40 flex justify-end items-start p-6 pointer-events-none"
        onMouseEnter={() => setShowSettingsTrigger(true)}
        onMouseLeave={() => setShowSettingsTrigger(false)}
      >
        <button
          onClick={() => setIsSettingsOpen(true)}
          className={`p-3 rounded-full bg-white/10 backdrop-blur-md shadow-2xl transition-all duration-500 ease-out pointer-events-auto transform ${
            showSettingsTrigger || isSettingsOpen ? 'opacity-100 translate-y-0 rotate-0 scale-100' : 'opacity-0 -translate-y-8 rotate-90 scale-75'
          } ${colors.text} hover:scale-110 hover:bg-white/20`}
          title="Open Settings"
        >
          <Settings size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <main 
        ref={containerRef}
        className={`flex-1 flex relative overflow-hidden ${isHorizontal ? 'flex-row' : 'flex-col'}`}
      >
        
        {/* Camera Section (First) */}
        <div 
          style={getCameraStyle()}
          className={`relative z-20 ${transitionClass} ${isPip ? '' : colors.border} ${!isPip && isSplitScreen ? (isHorizontal ? 'border-r' : 'border-b') : ''}`}
        >
          <CameraRecorder 
            colors={colors} 
            isHidden={!isSplitScreen && !isPip} 
            onSaveSession={handleSaveSession}
            isPip={isPip}
            onTogglePip={() => setIsPip(!isPip)}
          />
        </div>

        {/* Resizer Handle */}
        {isSplitScreen && !isPip && (
          <div
            onMouseDown={(e) => { e.preventDefault(); handleDragStart(); }}
            onTouchStart={handleDragStart}
            className={`z-30 flex items-center justify-center transition-colors hover:bg-blue-500/50 ${colors.border} ${
              isHorizontal 
                ? 'w-4 cursor-col-resize -ml-2 border-l border-r bg-transparent hover:w-5' 
                : 'h-4 cursor-row-resize -mt-2 border-t border-b bg-transparent hover:h-5'
            }`}
            style={{ 
                position: 'absolute', 
                [isHorizontal ? 'left' : 'top']: `${splitRatio}%`, 
                [isHorizontal ? 'top' : 'left']: 0,
                [isHorizontal ? 'bottom' : 'right']: 0,
                [isHorizontal ? 'width' : 'height']: '16px',
                transform: isHorizontal ? 'translateX(-50%)' : 'translateY(-50%)',
                touchAction: 'none' // Important for browser to defer touch handling to JS
            }}
          >
             {/* Grip Icon */}
             <div className={`opacity-0 hover:opacity-100 transition-opacity ${colors.text}`}>
                 {isHorizontal ? <GripVertical size={16} /> : <GripHorizontal size={16} />}
             </div>
          </div>
        )}

        {/* Timer Section (Second) */}
        <div 
            style={getTimerStyle()}
            className={`relative custom-scrollbar ${transitionClass}`}
        >
          <FlipClock colors={colors} />
          
          {/* Slider/Layout Toggle Handle (Visible when NOT in settings and NOT PiP) */}
          {!isPip && (
            <div className="absolute bottom-6 right-6 z-10 hidden md:block animate-fade-in">
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
      />

    </div>
  );
};

export default App;
