
export enum Theme {
  BlackAndWhite = 'BlackAndWhite',
  LightAndDark = 'LightAndDark',
  PinkAndBlack = 'PinkAndBlack',
  WhiteAndDarkBlue = 'WhiteAndDarkBlue',
  PinkAndYellow = 'PinkAndYellow',
}

export enum NoiseType {
  White = 'White',
  Pink = 'Pink',
  Brown = 'Brown',
  Green = 'Green',
}

export type SplitDirection = 'horizontal' | 'vertical';

export interface NoiseState {
  isPlaying: boolean;
  volume: number; // 0 to 1
  type: NoiseType;
}

export interface ThemeColors {
  bg: string;
  text: string;
  accent: string;
  secondaryBg: string;
  border: string;
  cardBg: string;
}

export interface RecordedSession {
  id: string;
  timestamp: number;
  duration: number;
  rawBlob: Blob;   // Video + Mic only
  mixedBlob: Blob | null; // Video + Mic + Background Noise (if playing)
  thumbnailUrl: string;
}

export const THEME_STYLES: Record<Theme, ThemeColors> = {
  [Theme.BlackAndWhite]: {
    bg: 'bg-black',
    text: 'text-white',
    accent: 'bg-gray-700',
    secondaryBg: 'bg-gray-900',
    border: 'border-gray-700',
    cardBg: 'bg-gray-800'
  },
  [Theme.LightAndDark]: {
    bg: 'bg-gray-100',
    text: 'text-gray-900',
    accent: 'bg-gray-800',
    secondaryBg: 'bg-white',
    border: 'border-gray-300',
    cardBg: 'bg-gray-200'
  },
  [Theme.PinkAndBlack]: {
    bg: 'bg-black',
    text: 'text-pink-500',
    accent: 'bg-pink-600',
    secondaryBg: 'bg-gray-900',
    border: 'border-pink-900',
    cardBg: 'bg-gray-900'
  },
  [Theme.WhiteAndDarkBlue]: {
    bg: 'bg-slate-900',
    text: 'text-white',
    accent: 'bg-blue-600',
    secondaryBg: 'bg-slate-800',
    border: 'border-slate-600',
    cardBg: 'bg-slate-800'
  },
  [Theme.PinkAndYellow]: {
    bg: 'bg-pink-500',
    text: 'text-yellow-200',
    accent: 'bg-pink-700',
    secondaryBg: 'bg-pink-600',
    border: 'border-pink-400',
    cardBg: 'bg-pink-700'
  },
};
