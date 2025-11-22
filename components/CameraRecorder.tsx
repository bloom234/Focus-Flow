
import React, { useRef, useEffect, useState } from 'react';
import { Camera, Square, Video, RefreshCw, PictureInPicture2, X } from 'lucide-react';
import { ThemeColors, RecordedSession } from '../types';
import { audioService } from '../services/audioService';

interface CameraRecorderProps {
  colors: ThemeColors;
  isHidden: boolean;
  onSaveSession: (session: RecordedSession) => void;
  isPip: boolean;
  onTogglePip: () => void;
}

export const CameraRecorder: React.FC<CameraRecorderProps> = ({ colors, isHidden, onSaveSession, isPip, onTogglePip }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Ref for Raw Recording (Video + Mic)
  const rawRecorderRef = useRef<MediaRecorder | null>(null);
  const rawChunksRef = useRef<Blob[]>([]);

  // Ref for Mixed Recording (Video + Mic + Background Noise)
  const mixedRecorderRef = useRef<MediaRecorder | null>(null);
  const mixedChunksRef = useRef<Blob[]>([]);

  // Audio Context for Mixing
  const mixContextRef = useRef<AudioContext | null>(null);
  const mixDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasAudio, setHasAudio] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }
        
        // Try Video + Audio
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: facingMode },
          audio: true 
        });
        
        setHasAudio(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.volume = 0; // Mute local playback to prevent feedback
        }
        setStreamError(null);

      } catch (err) {
        console.warn("Initial camera/mic request failed, retrying video only:", err);
        
        // Fallback: Try Video Only
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facingMode },
                audio: false 
            });
            setHasAudio(false);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.volume = 0; 
            }
            setStreamError(null);
        } catch (videoErr) {
            console.error("Error accessing camera (video only):", videoErr);
            setStreamError("Camera/Mic access denied.");
        }
      }
    };

    if (!isHidden || isPip) { // Keep active if hidden BUT in PiP mode
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isHidden, facingMode, isPip]);

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    
    const cameraStream = videoRef.current.srcObject as MediaStream;
    
    // --- 1. Set up Raw Recorder (Standard) ---
    const rawRecorder = new MediaRecorder(cameraStream, { mimeType: 'video/webm' });
    rawRecorderRef.current = rawRecorder;
    rawChunksRef.current = [];
    rawRecorder.ondataavailable = (e) => { if (e.data.size > 0) rawChunksRef.current.push(e.data); };
    rawRecorder.start(1000);

    // --- 2. Set up Mixed Recorder (With Background Noise) ---
    try {
        const audioCtx = audioService.initContext();
        if (audioCtx) {
            mixContextRef.current = audioCtx;
            const dest = audioCtx.createMediaStreamDestination();
            mixDestRef.current = dest;

            // Connect Mic to Dest (if exists)
            if (cameraStream.getAudioTracks().length > 0) {
                const micSource = audioCtx.createMediaStreamSource(cameraStream);
                micSource.connect(dest);
            }

            // Connect Background Noise (AudioService) to Dest
            audioService.connectTo(dest);

            // Combine Camera Video + Mixed Audio
            const mixedTracks = [
                ...cameraStream.getVideoTracks(),
                ...dest.stream.getAudioTracks()
            ];
            const mixedStream = new MediaStream(mixedTracks);
            
            const mixedRecorder = new MediaRecorder(mixedStream, { mimeType: 'video/webm' });
            mixedRecorderRef.current = mixedRecorder;
            mixedChunksRef.current = [];
            mixedRecorder.ondataavailable = (e) => { if (e.data.size > 0) mixedChunksRef.current.push(e.data); };
            mixedRecorder.start(1000);
        }
    } catch (e) {
        console.error("Audio mixing failed", e);
    }

    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    if (isRecording) {
      // Stop Raw
      if (rawRecorderRef.current && rawRecorderRef.current.state !== 'inactive') {
        rawRecorderRef.current.stop();
      }
      // Stop Mixed
      if (mixedRecorderRef.current && mixedRecorderRef.current.state !== 'inactive') {
        mixedRecorderRef.current.stop();
      }

      // Wait briefly for last chunk to arrive
      setTimeout(() => {
         finishSession();
      }, 500);

      setIsRecording(false);

      // Cleanup Audio Mixing
      if (mixDestRef.current) {
          audioService.disconnectFrom(mixDestRef.current);
          mixDestRef.current = null;
      }
    }
  };

  const finishSession = () => {
      const rawBlob = new Blob(rawChunksRef.current, { type: 'video/webm' });
      
      let mixedBlob: Blob | null = null;
      if (mixedChunksRef.current.length > 0) {
          mixedBlob = new Blob(mixedChunksRef.current, { type: 'video/webm' });
      }

      // Generate Thumbnail
      let thumbnailUrl = '';
      if (videoRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 240;
          canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          thumbnailUrl = canvas.toDataURL('image/jpeg');
      }

      const session: RecordedSession = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          duration: recordingTime,
          rawBlob,
          mixedBlob,
          thumbnailUrl
      };

      onSaveSession(session);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isHidden) return null;

  // Dynamic classes for PiP vs Standard
  const containerClasses = isPip 
    ? `fixed top-6 right-6 w-48 h-48 z-50 rounded-3xl shadow-2xl border-4 ${colors.border} overflow-hidden transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)`
    : `relative h-full w-full flex flex-col ${colors.secondaryBg} overflow-hidden transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)`;

  const videoClasses = isPip
    ? "absolute inset-0 w-full h-full object-cover"
    : `absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`;

  return (
    <div className={containerClasses}>
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center group h-full">
        {streamError ? (
          <div className="text-white p-4 text-center text-xs">
            <p className="mb-2">{streamError}</p>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={videoClasses} 
          />
        )}
        
        {/* Overlay UI - Time */}
        <div className={`absolute top-3 left-3 bg-black/60 px-2 py-1 rounded-full flex items-center space-x-2 pointer-events-none z-10 ${isPip ? 'scale-75 origin-top-left' : ''}`}>
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-white text-xs font-mono">{formatTime(recordingTime)}</span>
        </div>

        {/* PiP Toggle Button (Top Right in standard, hidden in PiP to prevent locking) */}
        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button 
                onClick={onTogglePip} 
                className="p-2 bg-black/50 rounded-full text-white hover:bg-white hover:text-black transition shadow-lg backdrop-blur-sm"
                title={isPip ? "Expand" : "Picture in Picture"}
            >
                {isPip ? <X size={16} /> : <PictureInPicture2 size={16} />}
            </button>
        </div>

        {/* Flip Button (Only standard view) */}
        {!isPip && !isRecording && (
          <div className="absolute top-3 right-14 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={toggleCamera} 
                className="p-2 bg-black/50 rounded-full text-white hover:bg-white hover:text-black transition shadow-lg backdrop-blur-sm"
                title="Switch Camera"
              >
                  <RefreshCw size={16} />
              </button>
          </div>
        )}

        {/* Controls for PiP (Overlay at bottom) */}
        {isPip && (
           <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {!isRecording ? (
                <button onClick={startRecording} className="p-2 bg-red-600 rounded-full text-white"><Camera size={16} /></button>
              ) : (
                <button onClick={stopRecording} className="p-2 bg-gray-700 rounded-full text-white"><Square size={16} /></button>
              )}
           </div>
        )}
      </div>

      {/* Standard Controls (Hidden in PiP) */}
      {!isPip && (
        <div className={`p-3 md:p-4 ${colors.bg} border-t ${colors.border} flex justify-between items-center flex-wrap gap-2`}>
            <div className="flex items-center space-x-2">
            <Video size={20} className={colors.text} />
            <span className={`text-sm font-semibold ${colors.text} hidden sm:inline`}>
                Time Lapse Cam {!hasAudio && <span className="text-[10px] opacity-70 font-normal">(Video Only)</span>}
            </span>
            </div>
            
            <div className="flex space-x-2 md:space-x-3">
            {!isRecording ? (
                <button 
                onClick={startRecording}
                disabled={!!streamError}
                className="flex items-center px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                <Camera size={16} className="mr-2" />
                Rec
                </button>
            ) : (
                <button 
                onClick={stopRecording}
                className="flex items-center px-4 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition shadow-md animate-pulse"
                >
                <Square size={16} className="mr-2 fill-current" />
                Stop
                </button>
            )}
            </div>
        </div>
      )}
    </div>
  );
};
