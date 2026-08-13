import { useState, useEffect, useRef } from 'react';

const QUACKS = [
  'Quack!',
  'If its not on sale, its not for me.',
  'POV: You closed Shopee/Tiktok and won.',
  'Before buying, ask: Do I need it, or is TikTok making me want it?',
  'Delayed gratification > instant budol',
  'Saving ₱50 every day is ₱18,250 a year.',
  'Future you is watching your checkout button.',
  'Quackity Quack Quack',
  'And then he waddled away... waddle waddle'
];

export const WanderingDuck = () => {
  const [isDisabled, setIsDisabled] = useState(() => {
    return localStorage.getItem('pet_duck_disabled') !== 'false';
  });
  const [petType, setPetType] = useState(() => localStorage.getItem('pet_type') || 'duck');
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [posX, setPosX] = useState(15);
  const [direction, setDirection] = useState('right');
  const [isWalking, setIsWalking] = useState(true);
  const [isHopping, setIsHopping] = useState(false);
  const [speech, setSpeech] = useState('Quack!');
  const [speechVisible, setSpeechVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);
  const speechTimerRef = useRef(null);

  // Listen for pet type change
  useEffect(() => {
    const handleTypeChange = () => {
      const newType = localStorage.getItem('pet_type') || 'duck';
      setPetType(newType);
      setSpeech(newType === 'cat' ? 'Meow! 🐱' : 'Quack! 🐥');
      setSpeechVisible(true);
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
      speechTimerRef.current = setTimeout(() => setSpeechVisible(false), 3000);
    };
    window.addEventListener('pet_type_change', handleTypeChange);
    return () => window.removeEventListener('pet_type_change', handleTypeChange);
  }, []);

  // Listen for sidebar pet toggle event with animation
  useEffect(() => {
    const handleToggle = () => {
      const disabledNow = localStorage.getItem('pet_duck_disabled') !== 'false';
      if (disabledNow) {
        setIsLeaving(true);
        setSpeech('Bye bye!');
        setSpeechVisible(true);
        setTimeout(() => {
          setIsDisabled(true);
          setIsLeaving(false);
        }, 360);
      } else {
        setIsDisabled(false);
        setIsEntering(true);
        setSpeech("Quack! I'm back!");
        setSpeechVisible(true);
        setTimeout(() => {
          setIsEntering(false);
        }, 500);

        if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
        speechTimerRef.current = setTimeout(() => {
          setSpeechVisible(false);
        }, 3500);
      }
    };
    window.addEventListener('pet_duck_toggle', handleToggle);
    return () => window.removeEventListener('pet_duck_toggle', handleToggle);
  }, []);



  // Window resize handler for sidebar offset calculation
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Wandering logic loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (isHopping) return;

      const randomChoice = Math.random();

      if (randomChoice < 0.65) {
        // Walk in current direction
        setIsWalking(true);
        setPosX((prev) => {
          let step = direction === 'right' ? 3 : -3;
          let next = prev + step;

          if (next >= 68) {
            setDirection('left');
            return 68;
          }
          if (next <= 5) {
            setDirection('right');
            return 5;
          }
          return next;
        });
      } else if (randomChoice < 0.85) {
        // Pause and look around
        setIsWalking(false);
      } else {
        // Turn around
        setDirection((prev) => (prev === 'right' ? 'left' : 'right'));
        setIsWalking(true);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [direction, isHopping]);

  // Handle Duck click / tap interaction
  const handleDuckClick = () => {
    setIsHopping(true);
    setIsWalking(false);

    // Pick random quack message
    const randomMsg = QUACKS[Math.floor(Math.random() * QUACKS.length)];
    setSpeech(randomMsg);
    setSpeechVisible(true);

    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    speechTimerRef.current = setTimeout(() => {
      setSpeechVisible(false);
    }, 3500);

    // Stop hopping after animation completes
    setTimeout(() => {
      setIsHopping(false);
      setIsWalking(true);
    }, 900);
  };

  const computeLeftStyle = () => {
    if (isDesktop) {
      return `calc(270px + (100vw - 320px) * ${posX / 100})`;
    }
    return `${posX}%`;
  };

  if (isDisabled) return null;

  return (
    <div
      className="fixed bottom-6 sm:bottom-8 z-50 transition-all duration-1000 ease-out select-none pointer-events-auto"
      style={{ left: computeLeftStyle() }}
    >
      <div className="relative cursor-pointer group" onClick={handleDuckClick} title="Click your pet duck! 🐥">
        {/* Speech Bubble */}
        {speechVisible && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white text-rose-900 px-3.5 py-1.5 rounded-2xl shadow-xl border-2 border-pink-300 text-xs font-black tracking-wide whitespace-nowrap animate-speech-pop z-50">
            {speech}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-pink-300 rotate-45" />
          </div>
        )}

        {/* Cute 2D Front-Facing Wandering Pet SVG */}
        <div
          className={`transition-transform duration-300 ${
            isLeaving
              ? 'animate-duck-exit'
              : isEntering
              ? 'animate-duck-enter'
              : isHopping
              ? 'animate-duck-hop'
              : isWalking
              ? 'animate-duck-waddle'
              : ''
          }`}
        >
          {petType === 'cat' ? (
            <svg
              width="64"
              height="64"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-xl transform hover:scale-115 transition-transform"
            >
              {/* Paws */}
              <ellipse cx="36" cy="87" rx="8" ry="5" fill="#E8E8E8" stroke="#D0D0D0" strokeWidth="1.5" className={isWalking ? 'animate-pulse' : ''} />
              <ellipse cx="64" cy="87" rx="8" ry="5" fill="#E8E8E8" stroke="#D0D0D0" strokeWidth="1.5" className={isWalking ? 'animate-pulse' : ''} />

              {/* Body */}
              <ellipse cx="50" cy="66" rx="26" ry="22" fill="#F5F5F5" stroke="#DCDCDC" strokeWidth="2" />
              {/* Belly patch */}
              <ellipse cx="50" cy="70" rx="14" ry="11" fill="#FFFFFF" opacity="0.8" />

              {/* Tail */}
              <path d="M 74 75 Q 95 65 90 50 Q 88 44 82 50 Q 87 55 76 68 Z" fill="#F0F0F0" stroke="#DCDCDC" strokeWidth="1.5" />

              {/* Head */}
              <circle cx="50" cy="38" r="24" fill="#F5F5F5" stroke="#DCDCDC" strokeWidth="2" />

              {/* Pointy ears */}
              <polygon points="26,22 20,4 36,16" fill="#F0F0F0" stroke="#DCDCDC" strokeWidth="2" />
              <polygon points="74,22 80,4 64,16" fill="#F0F0F0" stroke="#DCDCDC" strokeWidth="2" />
              {/* Inner ear pink */}
              <polygon points="27,21 22,8 34,17" fill="#F9A8D4" opacity="0.7" />
              <polygon points="73,21 78,8 66,17" fill="#F9A8D4" opacity="0.7" />

              {/* Eyes — left green, right yellow */}
              <ellipse cx="38" cy="36" rx="5.5" ry="6" fill="#22C55E" />
              <ellipse cx="38" cy="36" rx="2.5" ry="5" fill="#1E293B" />
              <circle cx="36" cy="33" r="1.5" fill="#FFFFFF" />

              <ellipse cx="62" cy="36" rx="5.5" ry="6" fill="#EAB308" />
              <ellipse cx="62" cy="36" rx="2.5" ry="5" fill="#1E293B" />
              <circle cx="60" cy="33" r="1.5" fill="#FFFFFF" />

              {/* Rosy cheeks */}
              <circle cx="27" cy="44" r="4" fill="#F472B6" opacity="0.6" />
              <circle cx="73" cy="44" r="4" fill="#F472B6" opacity="0.6" />

              {/* Nose */}
              <polygon points="50,46 47,50 53,50" fill="#F9A8D4" />
              {/* Mouth */}
              <path d="M 47 50 Q 50 54 53 50" stroke="#DCDCDC" strokeWidth="1.5" fill="none" />

              {/* Whiskers */}
              <line x1="20" y1="44" x2="44" y2="46" stroke="#BDBDBD" strokeWidth="1.2" />
              <line x1="20" y1="48" x2="44" y2="48" stroke="#BDBDBD" strokeWidth="1.2" />
              <line x1="56" y1="46" x2="80" y2="44" stroke="#BDBDBD" strokeWidth="1.2" />
              <line x1="56" y1="48" x2="80" y2="48" stroke="#BDBDBD" strokeWidth="1.2" />


            </svg>
          ) : (
            <svg
              width="64"
              height="64"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-xl transform hover:scale-115 transition-transform"
            >
              {/* Left & Right Webbed Feet */}
              <ellipse cx="36" cy="86" rx="9" ry="5" fill="#F97316" className={isWalking ? 'animate-pulse' : ''} />
              <ellipse cx="64" cy="86" rx="9" ry="5" fill="#F97316" className={isWalking ? 'animate-pulse' : ''} />

              {/* Main Round Yellow Body (Front-Facing) */}
              <circle cx="50" cy="62" r="26" fill="#FDE047" stroke="#EAB308" strokeWidth="3" />
              <ellipse cx="50" cy="66" rx="16" ry="12" fill="#FEF08A" opacity="0.6" />

              {/* Left & Right Flapping Wings (Front-Facing) */}
              <path d="M 24 55 Q 12 60 22 72 Q 28 68 26 58 Z" fill="#FACC15" stroke="#EAB308" strokeWidth="2" />
              <path d="M 76 55 Q 88 60 78 72 Q 72 68 74 58 Z" fill="#FACC15" stroke="#EAB308" strokeWidth="2" />

              {/* Head (Front-Facing) */}
              <circle cx="50" cy="38" r="22" fill="#FDE047" stroke="#EAB308" strokeWidth="3" />

              {/* Big Shiny Eyes Looking Straight at the User */}
              <circle cx="38" cy="34" r="4.5" fill="#1E293B" />
              <circle cx="40" cy="32" r="1.8" fill="#FFFFFF" />

              <circle cx="62" cy="34" r="4.5" fill="#1E293B" />
              <circle cx="64" cy="32" r="1.8" fill="#FFFFFF" />

              {/* Cute Rosy Blushing Cheeks */}
              <circle cx="27" cy="42" r="4.5" fill="#F472B6" opacity="0.85" />
              <circle cx="73" cy="42" r="4.5" fill="#F472B6" opacity="0.85" />

              {/* Front-Facing Orange Beak */}
              <ellipse cx="50" cy="44" rx="8" ry="5" fill="#FB923C" stroke="#EA580C" strokeWidth="2" />

              {/* Cute Red Bowknot Top Center */}
              <path d="M 42 16 Q 50 20 42 24 Z" fill="#E11D48" />
              <path d="M 58 16 Q 50 20 58 24 Z" fill="#E11D48" />
              <circle cx="50" cy="20" r="3.5" fill="#BE123C" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
