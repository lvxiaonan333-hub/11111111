
import React, { useState, useEffect } from 'react';
import { Trophy, ChevronLeft, Star, Heart, Sparkles } from 'lucide-react';
import { WORD_PACKS } from '../constants';
import { Word } from '../types';

interface PlayViewProps {
  onBack: () => void;
  onWin: (stars: number) => void;
}

const PlayView: React.FC<PlayViewProps> = ({ onBack, onWin }) => {
  const [gameWords, setGameWords] = useState<Word[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [clickedOption, setClickedOption] = useState<string | null>(null);

  useEffect(() => {
    const allWords = WORD_PACKS.flatMap(p => p.words);
    const shuffled = [...allWords].sort(() => Math.random() - 0.5).slice(0, 5);
    setGameWords(shuffled);
    prepareQuestion(shuffled[0], allWords);
  }, []);

  const prepareQuestion = (correctWord: Word, allWords: Word[]) => {
    const distractors = allWords
      .filter(w => w.en !== correctWord.en)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.en);
    
    setOptions([...distractors, correctWord.en].sort(() => Math.random() - 0.5));
    setFeedback(null);
    setClickedOption(null);
  };

  const handleChoice = (choice: string) => {
    if (gameOver || feedback !== null) return;

    setClickedOption(choice);
    const isCorrect = choice === gameWords[currentIndex].en;

    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
      setTimeout(() => {
        if (currentIndex < gameWords.length - 1) {
          setCurrentIndex(i => i + 1);
          prepareQuestion(gameWords[currentIndex + 1], WORD_PACKS.flatMap(p => p.words));
        } else {
          setGameOver(true);
          onWin(score + 10);
        }
      }, 1200);
    } else {
      setLives(l => l - 1);
      setFeedback('wrong');
      if (lives <= 1) {
        setTimeout(() => setGameOver(true), 800);
      } else {
        setTimeout(() => {
          setFeedback(null);
          setClickedOption(null);
        }, 1200);
      }
    }
  };

  if (gameOver) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="w-40 h-40 bg-pink-100 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-float relative">
          <Trophy size={80} className="text-pink-500" />
          <div className="absolute -top-4 -right-4"><Sparkles className="text-yellow-400" /></div>
        </div>
        <div className="space-y-3">
          <h2 className="text-5xl font-black text-pink-700">挑战结束！</h2>
          <p className="text-pink-400 text-xl font-bold italic">“蜜蜜表现得就像小仙女一样棒！”</p>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-10 rounded-[3.5rem] shadow-xl border-4 border-pink-100 flex justify-around">
          <div>
            <div className="text-xs font-black text-pink-300 uppercase tracking-widest mb-1">成功挑战</div>
            <div className="text-5xl font-black text-pink-600">{score}</div>
          </div>
          <div className="w-[2px] bg-pink-50" />
          <div>
            <div className="text-xs font-black text-pink-300 uppercase tracking-widest mb-1">魔法星星</div>
            <div className="text-5xl font-black text-yellow-500 flex items-center justify-center gap-2">
              <Star fill="currentColor" size={32} /> {score * 5 + 10}
            </div>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="w-full py-6 bg-pink-500 text-white rounded-[2rem] font-black text-2xl shadow-xl hover:bg-pink-600 transition-all shadow-[0_8px_0_rgb(190,24,93)] active:translate-y-1 active:shadow-none"
        >
          收下礼物并返回
        </button>
      </div>
    );
  }

  const currentWord = gameWords[currentIndex];

  return (
    <div className="max-w-xl mx-auto p-6 space-y-12 min-h-[85vh] flex flex-col justify-center">
      <div className="flex justify-between items-center px-4">
        <button onClick={onBack} className="text-pink-300 hover:text-pink-500 flex items-center gap-2 font-bold transition-colors">
          <ChevronLeft /> 离开
        </button>
        <div className="flex gap-3 bg-white/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/50">
          {[...Array(3)].map((_, i) => (
            <Heart 
              key={i} 
              size={24} 
              className={`transition-all duration-500 ${i < lives ? 'text-rose-500 fill-rose-500 scale-110' : 'text-slate-200 scale-90 opacity-40'}`} 
            />
          ))}
        </div>
      </div>

      <div className="text-center space-y-8">
        <div className="text-sm font-black text-pink-400 uppercase tracking-[0.3em]">
          ✨ 第 {currentIndex + 1} 关 · 共 {gameWords.length} 关 ✨
        </div>
        <div className="bg-white/70 backdrop-blur-lg p-14 rounded-[4rem] shadow-2xl border-4 border-pink-50 flex items-center justify-center min-h-[260px] animate-float relative overflow-hidden">
          <h3 className="text-8xl font-black text-pink-700 drop-shadow-sm z-10">{currentWord?.cn}</h3>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-10 left-10"><Sparkles size={40} /></div>
             <div className="absolute bottom-10 right-10"><Sparkles size={40} /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {options.map((option, idx) => {
          const isCorrect = option === currentWord.en;
          const isClicked = option === clickedOption;
          
          let btnStyle = "bg-white/80 text-pink-700 hover:bg-pink-50 border-2 border-white hover:border-pink-200 shadow-lg";
          
          if (feedback === 'correct') {
            if (isCorrect) btnStyle = "bg-pink-500 text-white scale-105 shadow-xl shadow-pink-200 animate-pop border-pink-500";
            else btnStyle = "bg-white/40 text-pink-200 border-transparent opacity-50";
          } else if (feedback === 'wrong') {
            if (isClicked) btnStyle = "bg-rose-400 text-white animate-shake shadow-lg border-rose-400";
            else if (isCorrect) btnStyle = "bg-white border-pink-300 border-dashed text-pink-400";
            else btnStyle = "bg-white/40 text-pink-200 border-transparent opacity-50";
          }

          return (
            <button
              key={idx}
              onClick={() => handleChoice(option)}
              disabled={feedback !== null}
              className={`
                py-6 px-10 rounded-[2.5rem] text-3xl font-black transition-all transform active:scale-95
                ${btnStyle}
              `}
            >
              {option}
            </button>
          );
        })}
      </div>

      {feedback === 'correct' && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[100]">
           <div className="sparkle-effect text-pink-400">
             <Sparkles size={300} fill="currentColor" />
           </div>
        </div>
      )}
    </div>
  );
};

export default PlayView;
