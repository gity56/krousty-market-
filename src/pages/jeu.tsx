import { type CSSProperties, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './jeu.css';

interface Prize {
  name: string;
  probability: number;
  color: string;
  rarity: string;
}

const prizes: Prize[] = [
  { name: 'Caprisun', probability: 85, color: '#FCD34D', rarity: '' },
  { name: 'Red Bull', probability: 2, color: '#EF4444', rarity: '' },
  { name: 'Tacos Market', probability: 0.7, color: '#F97316', rarity: '' },
  { name: 'Tacos Tenders', probability: 0.7, color: '#FB923C', rarity: '' },
  { name: 'Panini Nutella', probability: 2, color: '#A78BFA', rarity: '' },
  { name: 'Panini Speculos', probability: 2, color: '#C084FC', rarity: '' },
  { name: 'Canette classique', probability: 2, color: '#60A5FA', rarity: '' },
  { name: 'Pizza junior', probability: 0.3, color: '#EC4899', rarity: '' },
  { name: 'Kinder Bueno', probability: 2, color: '#34D399', rarity: '' },
  { name: 'Tiramisu', probability: 0.7, color: '#FBBF24', rarity: '' },
  { name: 'Bonbon au choix', probability: 2, color: '#F472B6', rarity: '' },
  { name: 'Chewing-gum', probability: 2, color: '#2DD4BF', rarity: '' },
  { name: 'Franuit', probability: 0.3, color: '#818CF8', rarity: '' },
  { name: "Bon d'achat 5 EUR", probability: 0.3, color: '#10B981', rarity: '' },
  { name: "Bon d'achat 50 EUR", probability: 0, color: '#F59E0B', rarity: '' },
];

const referenceWheelColors = ['#ec1479', '#050505', '#28aeea', '#ffffff'];

const GOOGLE_MAPS_URL = import.meta.env.VITE_GOOGLE_MAPS_URL || 'https://maps.app.goo.gl/6Nnff6RjLSPY4F3x7?g_st=ic';

const SpinWheel = () => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [reviewPopupOpen, setReviewPopupOpen] = useState(false);
  const [reviewUnlocked, setReviewUnlocked] = useState(false);
  const [linkOpened, setLinkOpened] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const wheelSliceSide = 100 - Math.tan((45 - 360 / prizes.length / 2) * (Math.PI / 180)) * 100;

  const selectPrize = () => {
    const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0);
    const random = Math.random() * totalProbability;
    let cumulative = 0;

    for (let prize of prizes) {
      cumulative += prize.probability;
      if (random <= cumulative) {
        return prize;
      }
    }
    return prizes[0];
  };

  const openReviewPopup = () => {
    setReviewPopupOpen(true);
  };

  const spinWheel = () => {
    if (isSpinning) return;

    if (!reviewUnlocked) {
      openReviewPopup();
      return;
    }

    setIsSpinning(true);
    setShowResult(false);

    const selectedPrize = selectPrize();
    setWonPrize(selectedPrize);

    const prizeIndex = prizes.findIndex(p => p.name === selectedPrize.name);
    const segmentAngle = 360 / prizes.length;
    const segmentCenterAngle = prizeIndex * segmentAngle + (segmentAngle / 2);
    const targetAngle = -segmentCenterAngle;
    const baseSpins = selectedPrize.probability > 10 ? 5 : selectedPrize.probability > 2 ? 7 : 10;
    const extraRotation = baseSpins * 360;
    const finalRotation = rotation + extraRotation + targetAngle - (rotation % 360);

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setShowResult(true);
    }, 5000);
  };

  const handleMapsClick = () => {
    setLinkOpened(true);
    setReviewUnlocked(true);
    setReviewPopupOpen(false);
  };

  const closeResult = () => {
    setShowResult(false);
    setWonPrize(null);
  };

  return (
    <div className="game-page fixed inset-0 w-screen h-screen overflow-hidden">
      <div className="game-arcade-background" />
      <div className="crazy-smile-background" aria-hidden="true">
        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'].map((glyph, index) => (
          <span key={glyph} style={{ '--smile-index': index } as CSSProperties}>{glyph}</span>
        ))}
      </div>

      <style>{`
        @keyframes filt {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }

        @keyframes wee {
          0% {
            background-position:
              0px 0px,
              6px 10.39230485px,
              300% 300%,
              -400% -400%,
              200% 200%,
              100% 41.5692194px;
          }
          100% {
            background-position:
              0px 0px,
              6px 10.39230485px,
              0% 0%,
              0% 0%,
              0% 0%,
              0% 0%;
          }
        }
      `}</style>

      <div className="relative z-10 w-full h-full overflow-hidden">
        <motion.header
          className="game-brand"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <img src="/market-transparent.png" alt="Market Pizza" className="game-brand-logo mb-4" />
          <p className='text-3xl'>Tournez la roue et tentez de gagner une délicieuse surprise&nbsp;!</p>
        </motion.header>

        <div className="wheel-stage">
          <motion.div
            className="wheel-light wheel-light-pink"
            animate={{ opacity: [0.35, 0.8, 0.35], scale: [0.95, 1.08, 0.95] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="wheel-light wheel-light-blue"
            animate={{ opacity: [0.7, 0.3, 0.7], scale: [1.08, 0.96, 1.08] }}
            transition={{ duration: 3.6, repeat: Infinity }}
          />

          <motion.div
            className="reference-spin-container"
            onClick={spinWheel}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                spinWheel();
              }
            }}
            role="button"
            tabIndex={isSpinning ? -1 : 0}
            aria-label="Tourner la roue de la fortune"
            aria-disabled={isSpinning}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div
              ref={wheelRef}
              className="reference-spin-wheel"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 5s ease' : 'none'
              }}
            >
              {prizes.map((prize, index) => (
                <div
                  key={prize.name}
                  className="reference-spin-option"
                  style={{
                    backgroundColor: referenceWheelColors[index % referenceWheelColors.length],
                    transform: `rotate(${(360 / prizes.length) * index + 45}deg)`,
                    clipPath: `polygon(0 0, ${wheelSliceSide}% 0, 100% 100%, 0 ${wheelSliceSide}%)`
                  }}
                >
                  <span style={{ color: index % referenceWheelColors.length === 3 ? '#050505' : '#ffffff' }}>
                    {prize.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="wheel-selection-arrow" aria-hidden="true" />
          <motion.button
            type="button"
            className="wheel-spin-cta"
            onClick={spinWheel}
            disabled={isSpinning}
            whileHover={isSpinning ? undefined : { scale: 1.05 }}
            whileTap={isSpinning ? undefined : { scale: 0.96 }}
          >
            {isSpinning ? 'La roue tourne…' : 'Tourner la roue'}
          </motion.button>
        </div>

        <AnimatePresence>
          {reviewPopupOpen && !reviewUnlocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-40 p-4"
            >
              <motion.div
                initial={{ y: 30, scale: 0.96, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 30, scale: 0.96, opacity: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="w-full max-w-xl bg-white text-gray-950 rounded-[28px] shadow-2xl p-6 sm:p-8 text-center"
              >
                <h2 className="text-3xl sm:text-5xl font-black mb-6 leading-tight">
                  Ouvrez Google Maps pour debloquer la roue
                </h2>

                <div className="bg-gray-100 rounded-2xl p-4 mb-5">
                  <p className="text-lg sm:text-2xl font-black text-purple-700">
                    Cliquez sur le lien, puis revenez ici pour tourner la roue.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={GOOGLE_MAPS_URL}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleMapsClick}
                    className="flex-1 px-5 py-4 rounded-full font-black text-white shadow-lg transition bg-gradient-to-r from-green-500 to-emerald-700 hover:from-green-600 hover:to-emerald-800"
                  >
                    Ouvrir Google Maps
                  </a>
                  <button
                    type="button"
                    onClick={() => setReviewPopupOpen(false)}
                    className="px-5 py-4 rounded-full font-black bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
                  >
                    Plus tard
                  </button>
                </div>

                <div className="min-h-[40px] mt-5 text-sm font-semibold">
                  {linkOpened ? (
                    <p className="text-purple-700">Lien ouvert. La roue est debloquee.</p>
                  ) : (
                    <p className="text-gray-600">La roue se debloque des que vous cliquez sur Google Maps.</p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResult && wonPrize && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-30 p-4"
              onClick={closeResult}
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  duration: 0.6
                }}
                className="bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 p-8 sm:p-12 md:p-16 rounded-3xl shadow-2xl text-center max-w-sm sm:max-w-2xl mx-4 relative"
                onClick={(e) => e.stopPropagation()}
              >
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-3xl sm:text-5xl"
                    style={{
                      top: i < 4 ? '-1.5rem' : 'auto',
                      bottom: i >= 4 ? '-1.5rem' : 'auto',
                      left: i % 2 === 0 ? `${(i % 4) * 25}%` : 'auto',
                      right: i % 2 === 1 ? `${(i % 4) * 25}%` : 'auto',
                    }}
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.3, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                  >
                    *
                  </motion.div>
                ))}

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <h2 className="text-3xl hh sm:text-5xl md:text-6xl font-black text-white mb-4 sm:mb-6 drop-shadow-lg">
                    FELICITATIONS !
                  </h2>
                  <div className="bg-white/30 backdrop-blur-md rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-inner">
                    <p className="text-xl sm:text-2xl md:text-3xl text-white mb-3 sm:mb-4 font-semibold">Vous avez gagne :</p>
                    <motion.p
                      className="text-2xl sm:text-4xl md:text-6xl font-black text-white drop-shadow-lg"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {wonPrize.name}
                    </motion.p>
                  </div>
                  <motion.button
                    onClick={closeResult}
                    className="px-8 sm:px-12 py-3 sm:py-4 bg-white text-purple-600 font-bold text-lg sm:text-xl rounded-full shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    Fermer
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SpinWheel;
