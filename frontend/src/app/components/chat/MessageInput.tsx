import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, AlertCircle, Image as ImageIcon, Paperclip, Smile, Megaphone, GripVertical } from 'lucide-react';
import type { Message } from '../../types/chat';

interface MessageInputProps {
  onSend: (content: string, isUrgent: boolean) => void;
  onBroadcast: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  onAttachImage?: () => void;
  onAttachFile?: () => void;
  onEmoji?: () => void;
  sending: boolean;
}

export function MessageInput({
  onSend,
  onBroadcast,
  onTyping,
  onAttachImage,
  onAttachFile,
  onEmoji,
  sending,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    onTyping(e.target.value.length > 0);
  };

  const handleSend = () => {
    if (!value.trim() || sending) return;
    if (showBroadcast) {
      onBroadcast(value.trim());
      setShowBroadcast(false);
    } else {
      onSend(value.trim(), isUrgent);
    }
    setValue('');
    setIsUrgent(false);
    onTyping(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const file = e.target.files?.[0];
    if (file) {
      const prefix = type === 'image' ? '🖼️ [Image jointe:' : '📎 [Fichier joint:';
      const msg = `${prefix} ${file.name}]`;
      onSend(msg, isUrgent);
      setIsUrgent(false);
    }
    e.target.value = ''; // Reset
  };

  const insertEmoji = (emoji: string) => {
    setValue(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const EMOJIS = ['😊', '😂', '🥰', '👍', '🙏', '🔥', '✨', '🎉', '❤️', '🙌', '🤔', '😎'];

  return (
    <div className="p-4 bg-background border-t border-border shrink-0">
      <div className="relative">
        <div className={`relative bg-card border rounded-2xl flex items-end gap-2 p-2 transition-all ${
          showBroadcast ? 'border-amber-500 ring-2 ring-amber-500/20' : isUrgent ? 'border-destructive ring-2 ring-destructive/20' : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
        }`}>
          <div className="flex items-center gap-1 px-1">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={(e) => handleFileChange(e, 'file')}
            />
            <input 
              type="file" 
              ref={imageInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleFileChange(e, 'image')}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
              title="Pièce jointe"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
              title="Image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez un message..."
            rows={1}
            className="flex-1 bg-transparent border-none focus:outline-none text-[15px] py-3 px-2 text-foreground placeholder:text-muted-foreground resize-none max-h-[120px]"
          />

          <div className="flex items-center gap-1 relative">
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-4 bg-card border border-border rounded-2xl shadow-xl p-3 grid grid-cols-4 gap-2 z-50 w-48"
                >
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="text-2xl hover:bg-muted p-1.5 rounded-xl transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsUrgent(!isUrgent)}
              className={`p-2.5 rounded-xl transition-all ${
                isUrgent
                  ? 'bg-destructive/20 text-destructive'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Message urgent"
            >
              <AlertCircle className="w-5 h-5" />
            </button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={sending || !value.trim()}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                showBroadcast
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              } disabled:opacity-50`}
              title="Envoyer"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-1" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
      <div className="text-center mt-3">
        <span className="text-[11px] text-muted-foreground font-medium">
          Entrée pour envoyer &bull; Maj + Entrée pour nouvelle ligne
        </span>
      </div>
    </div>
  );
}