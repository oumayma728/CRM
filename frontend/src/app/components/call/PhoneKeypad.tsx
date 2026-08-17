import React, { useState } from 'react';
import { Phone, X } from 'lucide-react';

interface PhoneKeypadProps {
  onCall: (number: string) => void;
}

const KEYPAD_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

export function PhoneKeypad({ onCall }: PhoneKeypadProps) {
  const [number, setNumber] = useState('');

  const handleKeyPress = (key: string) => {
    if (number.length < 20) {
      setNumber(prev => prev + key);
    }
  };

  const handleDelete = () => {
    setNumber(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setNumber('');
  };

  const handleCall = () => {
    if (number.trim()) {
      onCall(number.trim());
    }
  };

  const formatNumber = (num: string) => {
    if (!num) return '';
    const cleaned = num.replace(/[^\d+*#]/g, '');
    if (cleaned.startsWith('+')) {
      const rest = cleaned.slice(1);
      const parts = [];
      for (let i = 0; i < rest.length; i += 2) {
        parts.push(rest.slice(i, i + 2));
      }
      return '+' + parts.join(' ');
    }
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      parts.push(cleaned.slice(i, i + 2));
    }
    return parts.join(' ');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <input
          type="text"
          value={formatNumber(number)}
          onChange={(e) => {
            const raw = e.target.value.replace(/\s/g, '');
            setNumber(raw);
          }}
          placeholder="+32 __ __ __ __ __"
          className="w-full pl-4 pr-10 py-3.5 bg-card border border-border rounded-2xl text-lg font-mono font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all tracking-widest"
        />
        {number.length > 0 && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {KEYPAD_KEYS.flat().map((key) => (
          <button
            key={key}
            onClick={() => handleKeyPress(key)}
            className="h-14 rounded-2xl bg-card border border-border text-foreground font-bold text-xl hover:bg-muted hover:border-primary/30 active:scale-95 transition-all shadow-sm"
          >
            {key}
          </button>
        ))}
        <button
          onClick={handleDelete}
          className="h-14 rounded-2xl bg-card border border-border text-muted-foreground font-bold text-sm hover:bg-muted hover:border-destructive/30 active:scale-95 transition-all uppercase tracking-wider"
        >
          Effacer
        </button>
        <button
          onClick={handleCall}
          disabled={!number.trim()}
          className="col-span-2 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
        >
          <Phone size={16} />
          Appeler
        </button>
      </div>
    </div>
  );
}
