
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Settings, 
  Trophy, 
  ChevronRight, 
  Star,
  ShieldCheck,
  User,
  RotateCcw,
  Castle,
  Zap,
  Gamepad2,
  Heart,
  Loader2
} from 'lucide-react';
import { View, AppState, UserStats, WordPack, Word, ReviewEntry } from './types';
import { WORD_PACKS } from './constants';
import LearnView from './components/LearnView';
import PlayView from './components/PlayView';
import TestView from './components/TestView';
import ParentDashboard from './components/ParentDashboard';
import ReviewView from './components/ReviewView';
import { generateCharacterIcon, getCachedIcon, cacheIcon } from './geminiService';

const STORAGE_KEY = 'disney_paradise_v3';
const DAILY_GOAL = 15;

const REVIEW_INTERVALS = [
  1 * 60 * 60 * 1000,        // 1 hour
  24 * 60 * 60 * 1000,       // 1 day
  3 * 24 * 60 * 60 * 1000,   // 3 days
  7 * 24 * 60 * 60 * 1000,   // 1 week
  14 * 24 * 60 * 60 * 1000,  // 2 weeks
  30 * 24 * 60 * 60 * 1000,  // 1 month
];

const INITIAL_STATS: UserStats = {
  stars: 5,
  wordsMastered: 0,
  studyMinutes: 0,
  streak: 1,
  lastActive: new Date().toISOString(),
  wordsLearnedToday: 0,
  dailyGoal: DAILY_GOAL
};

const CharacterIcon: React.FC<{ pack: WordPack }> = ({ pack }) => {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIcon = async () => {
      const cacheKey = `icon_${pack.character}`;
      const savedIcon = await getCachedIcon(cacheKey);
      
      if (savedIcon) {
        setIconUrl(savedIcon);
        setLoading(false);
        return;
      }

      const url = await generateCharacterIcon(pack.characterPrompt);
      if (url) {
        setIconUrl(url);
        await cacheIcon(cacheKey, url);
      }
      setLoading(false);
    };
    fetchIcon();
  }, [pack]);

  return (
    <div className={`w-24 h-24 mx-auto rounded-[2.5rem] ${pack.color} flex items-center justify-center shadow-2xl shadow-pink-100 group-hover:rotate-12 transition-transform overflow-hidden relative`}>
      {loading ? (
        <Loader2 className="text-pink-300 animate-spin" size={32} />
      ) : iconUrl ? (
        <img src={iconUrl} alt={pack.character} className="w-full h-full object-cover scale-110" />
      ) : (
        <span className="text-5xl">{pack.icon}</span>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const todayStr = new Date().toDateString();
    
    if (saved) {
      const parsed = JSON.parse(saved);
      const lastActiveDate = new Date(parsed.stats.lastActive).toDateString();
      
      if (lastActiveDate !== todayStr) {
        parsed.stats.wordsLearnedToday = 0;
        parsed.stats.lastActive = new Date().toISOString();
      }
      
      return {
        view: View.HOME,
        stats: { ...INITIAL_STATS, ...parsed.stats },
        currentCategory: parsed.currentCategory || 'Unit 1 学科王国',
        wrongWords: parsed.wrongWords || [],
        reviewData: parsed.reviewData || {}
      };
    }
    return {
      view: View.HOME,
      stats: INITIAL_STATS,
      currentCategory: 'Unit 1 学科王国',
      wrongWords: [],
      reviewData: {}
    };
  });

  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setShowWarning(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dueReviewWords = useMemo(() => {
    const now = Date.now();
    return Object.values(state.reviewData).filter((entry: ReviewEntry) => {
      if (entry.stage >= REVIEW_INTERVALS.length) return false;
      const interval = REVIEW_INTERVALS[entry.stage];
      return now - entry.lastReviewTime >= interval;
    });
  }, [state.reviewData]);

  const markWordMastered = (wordId: string) => {
    setState(prev => {
      const isNew = !prev.reviewData[wordId];
      return {
        ...prev,
        stats: { 
          ...prev.stats, 
          wordsMastered: isNew ? prev.stats.wordsMastered + 1 : prev.stats.wordsMastered,
          wordsLearnedToday: isNew ? prev.stats.wordsLearnedToday + 1 : prev.stats.wordsLearnedToday,
          lastActive: new Date().toISOString()
        },
        reviewData: {
          ...prev.reviewData,
          [wordId]: {
            wordId,
            lastReviewTime: Date.now(),
            stage: 0
          }
        }
      };
    });
  };

  const updateReviewResult = (wordId: string, success: boolean) => {
    setState(prev => {
      const entry = prev.reviewData[wordId];
      if (!entry) return prev;
      
      return {
        ...prev,
        reviewData: {
          ...prev.reviewData,
          [wordId]: {
            ...entry,
            lastReviewTime: Date.now(),
            stage: success ? entry.stage + 1 : 0
          }
        }
      };
    });
  };

  const renderHome = () => {
    const progressPercent = Math.min((state.stats.wordsLearnedToday / state.stats.dailyGoal) * 100, 100);
    const goalReached = state.stats.wordsLearnedToday >= state.stats.dailyGoal;

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="space-y-6">
          <section className="relative h-80 rounded-[3.5rem] overflow-hidden shadow-2xl bouncy-hover">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff9a9e] via-[#fad0c4] to-[#fad0c4] opacity-90"></div>
            <div className="absolute top-10 right-20 w-32 h-32 bg-white/30 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-48 h-48 bg-purple-300/20 rounded-full blur-3xl"></div>
            
            <div className="relative h-full z-10 flex flex-col justify-center px-16 text-[#5d4037]">
              <div className="flex items-center gap-2 mb-3 bg-white/40 w-fit px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20">
                <Heart size={14} className="text-pink-500 fill-pink-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-pink-600">蜜蜜的梦幻乐园</span>
              </div>
              <h2 className="text-6xl font-black mb-3 drop-shadow-sm text-pink-700">你好，蜜蜜!</h2>
              <p className="text-xl opacity-80 font-semibold max-w-md">今天我们要探索 {state.stats.dailyGoal} 个奇妙单词，准备好开始这段魔法旅程了吗？</p>
              
              <button 
                onClick={() => setState(s => ({ ...s, view: View.LEARN }))}
                className="mt-8 w-fit bg-pink-500 text-white px-12 py-4 rounded-[2rem] font-black text-xl hover:bg-pink-400 transition-all shadow-[0_8px_0_rgb(190,24,93)] active:translate-y-1 active:shadow-none flex items-center gap-2"
              >
                开启魔法冒险 <ChevronRight size={24} />
              </button>
            </div>
            <div className="absolute top-10 right-10 animate-bounce delay-75"><Star className="text-yellow-200 fill-yellow-200" size={32}/></div>
            <div className="absolute bottom-20 right-40 animate-pulse"><Sparkles className="text-white" size={24}/></div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="pixar-card p-10 rounded-[3rem] space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-pink-50 rounded-[1.5rem] text-pink-500 shadow-inner">
                      <BookOpen size={28} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-xl">今日成就</h4>
                      <p className="text-sm text-pink-400 font-bold">目标：{state.stats.dailyGoal} 个单词</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-pink-500">{state.stats.wordsLearnedToday}</div>
                    <div className="text-[10px] text-pink-300 font-black uppercase tracking-tighter">Completed</div>
                  </div>
               </div>
               <div className="relative h-5 bg-pink-50 rounded-full overflow-hidden p-1 shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${goalReached ? 'bg-gradient-to-r from-yellow-300 to-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.4)]' : 'bg-gradient-to-r from-pink-300 to-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.3)]'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
               </div>
            </div>

            <button 
              onClick={() => setState(s => ({ ...s, view: View.REVIEW }))}
              className="pixar-card p-10 rounded-[3rem] flex items-center justify-between group hover:border-pink-300 transition-all relative overflow-hidden text-left"
            >
               <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-50 rounded-[2rem] flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform shadow-inner">
                    <Castle size={36} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-2xl">记忆城堡</h4>
                    <p className="text-base text-pink-300 font-bold">守护蜜蜜学会的单词</p>
                  </div>
               </div>
               {dueReviewWords.length > 0 && (
                 <div className="relative z-10 bg-rose-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-black text-lg animate-bounce shadow-xl shadow-rose-200 border-4 border-white">
                    {dueReviewWords.length}
                 </div>
               )}
               <div className="absolute -top-10 -right-10 p-2 opacity-[0.05] rotate-12 group-hover:rotate-0 transition-transform">
                 <Zap size={180} />
               </div>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-3xl font-black mb-10 flex items-center gap-4 text-slate-800">
            <div className="w-2 h-10 bg-pink-400 rounded-full"></div>
            魔法主题岛屿
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {WORD_PACKS.map((pack) => (
              <button
                key={pack.name}
                onClick={() => {
                  setState(s => ({ ...s, currentCategory: pack.name, view: View.LEARN }));
                }}
                className="group p-10 rounded-[3.5rem] pixar-card hover:border-pink-200 transition-all text-center space-y-6 bouncy-hover border border-white/40"
              >
                <CharacterIcon pack={pack} />
                <div>
                  <p className="font-black text-slate-700 text-xl leading-tight">{pack.name.split(' ')[1]}</p>
                  <div className="mt-2 text-[11px] font-black text-pink-300 uppercase tracking-widest">{pack.words.length} MAGIC WORDS</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-32">
      {state.view !== View.REVIEW && state.view !== View.LEARN && state.view !== View.PLAY && state.view !== View.TEST && (
        <header className="bg-white/40 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/50 px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setState(s => ({ ...s, view: View.HOME }))}>
            <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-12 hover:rotate-0 transition-transform">
              <Sparkles size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">
                单词迪斯尼乐园
              </h1>
              <div className="flex items-center gap-1.5">
                <Heart size={10} className="text-pink-400 fill-pink-400" />
                <p className="text-[11px] text-pink-300 font-black tracking-widest uppercase">Dreamy Edition</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 bg-pink-500 px-6 py-3 rounded-[1.5rem] shadow-[0_4px_0_rgb(190,24,93)] active:translate-y-0.5 active:shadow-none transition-all">
              <Star className="text-white fill-white" size={22} />
              <span className="font-black text-white text-xl">{state.stats.stars}</span>
            </div>
            <button onClick={() => setState(s => ({ ...s, view: View.PARENT }))} className="p-3 bg-white/50 hover:bg-white rounded-2xl text-pink-400 transition-colors border border-white/30">
              <Settings size={28} />
            </button>
          </div>
        </header>
      )}
      
      <main>
        {state.view === View.HOME && renderHome()}
        {state.view === View.LEARN && (
          <LearnView 
            category={state.currentCategory} 
            onBack={() => setState(s => ({ ...s, view: View.HOME }))}
            onMastered={(id) => markWordMastered(id)}
            onComplete={() => setState(s => ({ ...s, view: View.TEST }))}
          />
        )}
        {state.view === View.REVIEW && (
          <ReviewView 
            dueWords={dueReviewWords}
            onBack={() => setState(s => ({ ...s, view: View.HOME }))}
            onResult={updateReviewResult}
            onComplete={() => {
              setState(s => ({ ...s, view: View.HOME }));
              const reward = dueReviewWords.length * 2;
              setState(prev => ({...prev, stats: {...prev.stats, stars: prev.stats.stars + reward}}));
            }}
          />
        )}
        {state.view === View.PLAY && (
          <PlayView onBack={() => setState(s => ({ ...s, view: View.HOME }))} onWin={(stars) => {
            setState(prev => ({...prev, stats: {...prev.stats, stars: prev.stats.stars + stars}}));
          }} />
        )}
        {state.view === View.TEST && (
          <TestView onBack={() => setState(s => ({ ...s, view: View.HOME }))} onResult={(score) => {
            setState(prev => ({...prev, stats: {...prev.stats, stars: prev.stats.stars + score}}));
          }} />
        )}
        {state.view === View.PARENT && (
          <ParentDashboard 
            stats={state.stats}
            wrongWords={state.wrongWords}
            onBack={() => setState(s => ({ ...s, view: View.HOME }))}
          />
        )}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-fit bg-white/60 backdrop-blur-3xl border-2 border-white/40 flex items-center gap-4 p-4 z-50 rounded-[3rem] shadow-2xl">
        {[
          { icon: <BookOpen />, label: '魔法学习', view: View.LEARN },
          { icon: <RotateCcw />, label: '复习城堡', view: View.REVIEW },
          { icon: <Gamepad2 />, label: '游乐场', view: View.PLAY },
          { icon: <User />, label: '家长岛', view: View.PARENT },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setState(s => ({ ...s, view: item.view }))}
            className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] transition-all font-black text-sm ${
              state.view === item.view 
                ? 'bg-pink-500 text-white shadow-xl shadow-pink-200' 
                : 'text-pink-300 hover:text-pink-500 hover:bg-pink-50/50'
            }`}
          >
            {React.cloneElement(item.icon as React.ReactElement, { size: 22 })}
            <span className="tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      {showWarning && (
        <div className="fixed inset-0 bg-pink-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-8">
          <div className="bg-white rounded-[4rem] p-16 max-w-md w-full text-center space-y-10 shadow-2xl border-4 border-pink-100">
            <div className="w-28 h-28 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck size={64} />
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-black text-pink-700 tracking-tight leading-tight">蜜蜜宝贝，<br/>让眼睛休息一下吧！</h3>
              <p className="text-slate-500 font-bold text-lg leading-relaxed">
                你已经很努力啦！现在去窗边看看远处的风景，或者和爸爸妈妈分享一下你的魔法新单词吧！
              </p>
            </div>
            <button 
              onClick={() => { setShowWarning(false); setTimeLeft(15 * 60); }}
              className="w-full bg-pink-500 text-white py-6 rounded-[2.5rem] font-black text-2xl hover:bg-pink-600 transition-all shadow-[0_8px_0_rgb(190,24,93)] active:translate-y-1 active:shadow-none"
            >
              我知道啦，去休息！
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
