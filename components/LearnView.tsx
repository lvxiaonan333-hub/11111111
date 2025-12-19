
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ChevronLeft, ChevronRight, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { WORD_PACKS } from '../constants';
import { generateDisneyImage, generatePronunciation, decodeAudioBuffer } from '../geminiService';
import { Word } from '../types';

interface LearnViewProps {
  category: string;
  onBack: () => void;
  onMastered: (id: string) => void;
  onComplete: () => void;
}

const LearnView: React.FC<LearnViewProps> = ({ category, onBack, onMastered, onComplete }) => {
  const pack = WORD_PACKS.find(p => p.name === category) || WORD_PACKS[0];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentWord = pack.words[currentIndex];

  useEffect(() => {
    loadContent(currentWord);
  }, [currentIndex]);

  const loadContent = async (word: Word) => {
    if (images[word.id]) return;
    
    setLoading(true);
    const imgUrl = await generateDisneyImage(word.en);
    if (imgUrl) {
      setImages(prev => ({ ...prev, [word.id]: imgUrl }));
    }
    setLoading(false);
  };

  const playAudio = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const audioData = await generatePronunciation(currentWord.en);
    if (audioData) {
      const buffer = await decodeAudioBuffer(audioData, audioCtxRef.current);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtxRef.current.destination);
      source.start();
    }
  };

  const handleNext = () => {
    onMastered(currentWord.id);
    if (currentIndex < pack.words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col items-center gap-8 min-h-[80vh] justify-center">
      <div className="w-full flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-slate-400 flex items-center gap-2 hover:text-slate-600">
          <ChevronLeft /> 返回王国
        </button>
        <div className="text-slate-400 font-bold uppercase tracking-wider text-sm">
          {category} · {currentIndex + 1}/{pack.words.length}
        </div>
      </div>

      <div className="w-full bg-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group min-h-[450px] flex flex-col border-4 border-purple-50">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-purple-400">
            <Loader2 className="animate-spin" size={48} />
            <p className="font-bold animate-pulse">正在召唤魔法插画...</p>
          </div>
        ) : (
          <>
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-8 bg-slate-50">
              {images[currentWord.id] ? (
                <img 
                  src={images[currentWord.id]} 
                  alt={currentWord.en} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200">
                  <Sparkles size={64} />
                </div>
              )}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full p-3 shadow-lg cursor-pointer hover:bg-white hover:scale-110 transition-all text-purple-600" onClick={playAudio}>
                <Volume2 size={32} />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-5xl font-black text-slate-800 tracking-tight leading-tight">{currentWord.en}</h2>
              <p className="text-2xl text-purple-400 font-bold">{currentWord.cn}</p>
            </div>
          </>
        )}
      </div>

      <div className="w-full flex gap-4">
        <button 
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          disabled={currentIndex === 0}
        >
          上一个
        </button>
        <button 
          onClick={handleNext}
          className="flex-[2] py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-purple-200"
        >
          {currentIndex === pack.words.length - 1 ? '学完啦！' : '我记住了！'} <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default LearnView;
