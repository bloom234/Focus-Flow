
import React, { useState } from 'react';
import { X, Palette, Layout, Columns, Rows, Film, Download, Music, Mic } from 'lucide-react';
import { Theme, THEME_STYLES, ThemeColors, SplitDirection, RecordedSession } from '../types';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  colors: ThemeColors;
  isSplitScreen: boolean;
  onToggleSplitScreen: () => void;
  splitDirection: SplitDirection;
  onDirectionChange: (direction: SplitDirection) => void;
  sessions: RecordedSession[];
}

export const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  colors,
  isSplitScreen,
  onToggleSplitScreen,
  splitDirection,
  onDirectionChange,
  sessions
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'gallery'>('settings');

  const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };
  
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-96 max-w-[90vw] ${colors.secondaryBg} shadow-2xl transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'} border-l ${colors.border} flex flex-col`}>
        
        <div className={`p-4 border-b ${colors.border} flex justify-between items-center flex-shrink-0`}>
           {/* Tabs */}
           <div className="flex space-x-1 bg-black/10 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'settings' ? 'bg-white shadow text-black' : `${colors.text} opacity-60 hover:opacity-100`}`}
              >
                Settings
              </button>
              <button 
                onClick={() => setActiveTab('gallery')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'gallery' ? 'bg-white shadow text-black' : `${colors.text} opacity-60 hover:opacity-100`}`}
              >
                Gallery
              </button>
           </div>

          <button onClick={onClose} className={`${colors.text} hover:scale-110 transition`}>
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-8 animate-slide-up">
              {/* Layout Section */}
              <section>
                <h3 className={`text-xs uppercase tracking-wider font-bold ${colors.text} opacity-60 mb-4 flex items-center`}>
                  <Layout size={14} className="mr-2" /> Layout Options
                </h3>
                
                {/* Toggle Split Screen */}
                <div className={`flex items-center justify-between p-4 rounded-xl ${colors.cardBg} border ${colors.border} mb-4 shadow-sm`}>
                  <span className={`text-sm font-medium ${colors.text}`}>Show Camera</span>
                  <button 
                    onClick={onToggleSplitScreen}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSplitScreen ? 'bg-green-500' : 'bg-gray-400'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${isSplitScreen ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Split Direction */}
                <div className={`transition-all duration-500 ${isSplitScreen ? 'opacity-100 h-auto' : 'opacity-50 pointer-events-none grayscale'}`}>
                  <p className={`text-xs mb-3 ${colors.text} opacity-70 font-medium`}>Split Orientation</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onDirectionChange('horizontal')}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${
                        splitDirection === 'horizontal' 
                          ? `${colors.accent} text-white border-transparent shadow-md scale-105` 
                          : `${colors.cardBg} ${colors.text} ${colors.border} hover:border-gray-400`
                      }`}
                    >
                      <Columns size={24} className="mb-2" />
                      <span className="text-xs font-medium">Side by Side</span>
                    </button>
                    <button
                      onClick={() => onDirectionChange('vertical')}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${
                        splitDirection === 'vertical' 
                          ? `${colors.accent} text-white border-transparent shadow-md scale-105` 
                          : `${colors.cardBg} ${colors.text} ${colors.border} hover:border-gray-400`
                      }`}
                    >
                      <Rows size={24} className="mb-2" />
                      <span className="text-xs font-medium">Stacked</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Theme Section */}
              <section>
                <h3 className={`text-xs uppercase tracking-wider font-bold ${colors.text} opacity-60 mb-4 flex items-center`}>
                  <Palette size={14} className="mr-2" /> Color Themes
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {(Object.keys(THEME_STYLES) as Theme[]).map((themeName) => (
                    <button
                      key={themeName}
                      onClick={() => onThemeChange(themeName)}
                      className={`flex items-center p-3 rounded-xl border-2 transition-all duration-300 ${
                        currentTheme === themeName 
                          ? `border-current ring-1 ring-offset-1 ring-current shadow-md scale-[1.02]` 
                          : 'border-transparent hover:bg-black/5'
                      } ${THEME_STYLES[themeName].cardBg} ${THEME_STYLES[themeName].text}`}
                    >
                      <div className={`w-8 h-8 rounded-full mr-3 border ${THEME_STYLES[themeName].border} shadow-inner`} style={{ background: 'linear-gradient(135deg, currentColor 50%, transparent 50%)' }}></div>
                      <span className="text-sm font-semibold">
                        {themeName.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div className="space-y-6 animate-slide-up">
                 <h3 className={`text-xs uppercase tracking-wider font-bold ${colors.text} opacity-60 flex items-center`}>
                  <Film size={14} className="mr-2" /> Recorded Sessions
                </h3>

                {sessions.length === 0 ? (
                    <div className={`p-8 rounded-xl border-dashed border-2 ${colors.border} flex flex-col items-center justify-center text-center opacity-50`}>
                        <Film size={32} className={`mb-2 ${colors.text}`} />
                        <p className={`text-sm ${colors.text}`}>No recordings yet.</p>
                        <p className="text-xs mt-1">Record a session to see it here.</p>
                    </div>
                ) : (
                    sessions.map(session => (
                        <div key={session.id} className={`rounded-xl overflow-hidden border ${colors.border} ${colors.cardBg} shadow-lg transition-all hover:shadow-xl`}>
                            <div className="relative aspect-video bg-black">
                                <img src={session.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover opacity-80" />
                                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-xs font-mono">
                                    {Math.floor(session.duration / 60)}:{(session.duration % 60).toString().padStart(2, '0')}
                                </div>
                                <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
                                    {new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                            
                            <div className="p-3 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    {/* Raw Download */}
                                    <button 
                                        onClick={() => downloadBlob(session.rawBlob, `focus-flow-raw-${session.id}.webm`)}
                                        className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-bold border ${colors.border} hover:bg-black/5 transition ${colors.text}`}
                                        title="Download with Microphone Audio only"
                                    >
                                        <Mic size={14} className="mr-1.5" /> No Bg Sound
                                    </button>
                                    
                                    {/* Mixed Download */}
                                    <button 
                                        onClick={() => {
                                            if (session.mixedBlob) {
                                                downloadBlob(session.mixedBlob, `focus-flow-mixed-${session.id}.webm`);
                                            }
                                        }}
                                        disabled={!session.mixedBlob}
                                        className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-bold ${colors.accent} text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                                        title="Download with Background Noise"
                                    >
                                        <Music size={14} className="mr-1.5" /> With Bg Sound
                                    </button>
                                </div>
                                {!session.mixedBlob && (
                                    <p className="text-[10px] text-center opacity-60 italic">Background sound was off during recording</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
          )}

          {/* Footer Info */}
          <section className="pt-4 border-t border-gray-200/20 mt-8">
             <p className={`text-[10px] ${colors.text} opacity-40 text-center`}>
               Focus Flow v1.2
             </p>
          </section>
        </div>
      </div>
    </>
  );
};
