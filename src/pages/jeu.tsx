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
  { name: 'Caprisun', probability: 98, color: '#FCD34D', rarity: '' },
  { name: 'Krousty M', probability: 0.199, color: '#EF4444', rarity: '' },
  { name: 'Crousti L', probability: 0.199, color: '#F97316', rarity: '' },
  { name: 'Crousti Boursin', probability: 0.199, color: '#FB923C', rarity: '' },
  { name: 'Canette', probability: 0.199, color: '#60A5FA', rarity: '' },
  { name: 'Tiramisu', probability: 0.199, color: '#C084FC', rarity: '' },
  { name: 'Nems au poulet', probability: 0.199, color: '#34D399', rarity: '' },
  { name: 'Nems crevette', probability: 0.199, color: '#FBBF24', rarity: '' },
  { name: 'Un an de Krousty', probability: 0.01, color: '#F59E0B', rarity: '' },
  { name: 'Supplement sauce', probability: 0.2, color: '#F472B6', rarity: '' },
  { name: 'Menu Krousty', probability: 0.199, color: '#10B981', rarity: '' },
  { name: 'Tenders', probability: 0.199, color: '#818CF8', rarity: '' },
];

const referenceWheelColors = ['#ec1479', '#050505', '#28aeea', '#ffffff'];

const GOOGLE_MAPS_URL = 'https://g.page/r/CcfZNj_s6Sy7EBM/review';

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
    if (isSpinning || wonPrize) return;

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
    const sliceCenterAngle = -90 + (prizeIndex * segmentAngle);
    const targetAngle = ((-sliceCenterAngle - (rotation % 360)) + 360) % 360;
    const baseSpins = selectedPrize.probability > 10 ? 5 : selectedPrize.probability > 2 ? 7 : 10;
    const extraRotation = baseSpins * 360;
    const finalRotation = rotation + extraRotation + targetAngle;

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
            tabIndex={isSpinning || wonPrize ? -1 : 0}
            aria-label="Tourner la roue de la fortune"
            aria-disabled={isSpinning || Boolean(wonPrize)}
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

          <div className="wheel-selection-marker" aria-hidden="true">-</div>
          <motion.button
            type="button"
            className="wheel-spin-cta"
            onClick={spinWheel}
            disabled={isSpinning || Boolean(wonPrize)}
            whileHover={isSpinning || wonPrize ? undefined : { scale: 1.05 }}
            whileTap={isSpinning || wonPrize ? undefined : { scale: 0.96 }}
          >
            {isSpinning ? 'La roue tourne…' : wonPrize ? 'Deja joue !' : 'Tourner et gagner !'}
          </motion.button>
        </div>

        <AnimatePresence>
          {reviewPopupOpen && !reviewUnlocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="game-modal-overlay z-40"
            >
              <motion.div
                initial={{ y: 30, scale: 0.96, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 30, scale: 0.96, opacity: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="game-modal-card game-review-modal"
              >
                <span className="game-modal-smile game-modal-smile-one" aria-hidden="true">a</span>
                <span className="game-modal-smile game-modal-smile-two" aria-hidden="true">f</span>

                <h2 className="game-modal-title">
                  Ouvrez Google Maps pour debloquer la roue
                </h2>

                <div className="game-modal-panel">
                  <p>
                    Cliquez sur le lien, puis revenez ici pour tourner la roue.
                  </p>
                </div>

                <div className="game-modal-actions">
                  <a
                    href={GOOGLE_MAPS_URL}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleMapsClick}
                    className="game-modal-primary"
                  >
                    Ouvrir Google Maps
                  </a>
                  <button
                    type="button"
                    onClick={() => setReviewPopupOpen(false)}
                    className="game-modal-secondary"
                  >
                    Plus tard
                  </button>
                </div>

                <div className="game-modal-note">
                  {linkOpened ? (
                    <p>Lien ouvert. La roue est debloquee.</p>
                  ) : (
                    <p>La roue se debloque des que vous cliquez sur Google Maps.</p>
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
              className="game-modal-overlay z-30"
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
                className="game-modal-card game-result-modal"
                onClick={(e) => e.stopPropagation()}
              >
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="game-result-spark"
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
                    {['a', 'b', 'c', 'd'][i % 4]}
                  </motion.div>
                ))}

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <h2 className="game-modal-title game-result-title">
                    FELICITATIONS !
                  </h2>
                  <div className="game-modal-panel game-prize-panel">
                    <p>Vous avez gagne :</p>
                    <motion.p
                      className="game-prize-name"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {wonPrize.name}
                    </motion.p>
                  </div>
                  <motion.button
                    onClick={closeResult}
                    className="game-modal-primary game-result-close"
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
