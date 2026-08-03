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
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [posX, setPosX] = useState(15); // Percentage offset within main content area (5% to 70%)
  const [direction, setDirection] = useState('right'); // 'right' | 'left'
  const [isWalking, setIsWalking] = useState(true);
  const [isHopping, setIsHopping] = useState(false);
  const [speech, setSpeech] = useState('Quack!');
  const [speechVisible, setSpeechVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);
  const speechTimerRef = useRef(null);

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

        {/* Cute 2D Front-Facing Wandering Duck SVG */}
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
        </div>
      </div>
    </div>
  );
};
