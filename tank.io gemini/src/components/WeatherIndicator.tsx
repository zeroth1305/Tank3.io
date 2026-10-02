import React from 'react';
import { WeatherState } from '../types/game.ts';
import { Sun, CloudRain, Wind, Sparkles } from 'lucide-react';

interface WeatherIndicatorProps {
  weather: WeatherState;
}

export const WeatherIndicator: React.FC<WeatherIndicatorProps> = ({ weather }) => {
  const getIcon = () => {
    switch (weather.type) {
      case 'rain':
        return <CloudRain className="w-4 h-4 text-sky-400 animate-pulse" />;
      case 'sandstorm':
        return <Wind className="w-4 h-4 text-amber-400 animate-spin" />;
      case 'aurora':
        return <Sparkles className="w-4 h-4 text-purple-400 animate-bounce" />;
      case 'clear':
      default:
        return <Sun className="w-4 h-4 text-amber-300" />;
    }
  };

  const getBorderColor = () => {
    switch (weather.type) {
      case 'rain':
        return 'border-sky-500/40 text-sky-300';
      case 'sandstorm':
        return 'border-amber-500/40 text-amber-300';
      case 'aurora':
        return 'border-purple-500/40 text-purple-300';
      case 'clear':
      default:
        return 'border-slate-700/60 text-slate-300';
    }
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border ${getBorderColor()} shadow-lg select-none text-xs`}
    >
      {getIcon()}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 font-bold leading-tight">
          <span>{weather.name}</span>
          <span className="text-[10px] font-mono text-slate-400">
            ({Math.ceil(weather.timeRemaining)}s)
          </span>
        </div>
        <span className="text-[10px] text-slate-400 line-clamp-1">
          {weather.description}
        </span>
      </div>
    </div>
  );
};
