import React, { useState, useEffect } from 'react';
import Button from './Button'; // Assuming Button component exists

interface CoinTossModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

const CoinIcon: React.FC<{
  side?: 'Heads' | 'Tails' | null;
  isFlipping?: boolean;
  logoUrl?: string;
}> = ({ side, isFlipping, logoUrl = "/logo.png" }) => {
  const coinBaseClasses = "w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-in-out overflow-hidden";
  // Adjust padding for the logo to fit well within the circle
  const logoImageClasses = "w-full h-full object-contain p-3 sm:p-4"; 

  if (isFlipping) {
    return (
      <div className={`${coinBaseClasses} bg-gray-600`}>
        <img src={logoUrl} alt="Flipping coin" className={`${logoImageClasses} animate-spin opacity-75`} />
      </div>
    );
  }

  let bgColor = 'bg-yellow-500'; // Default for initial state 
  if (side === 'Heads') {
    bgColor = 'bg-green-500';
  } else if (side === 'Tails') {
    bgColor = 'bg-blue-500';
  }

  return (
    <div className={`${coinBaseClasses} ${bgColor}`}>
      <img src={logoUrl} alt={`Coin side: ${side || 'Bat n Ball logo'}`} className={logoImageClasses} />
    </div>
  );
};


const CoinTossModal: React.FC<CoinTossModalProps> = ({ isOpen, onClose, onProceed }) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<'Heads' | 'Tails' | null>(null);

  useEffect(() => {
    // Reset on close
    if (!isOpen) {
      setIsFlipping(false);
      setResult(null);
    }
  }, [isOpen]);

  const handleFlipCoin = () => {
    setIsFlipping(true);
    setResult(null); // Clear previous result
    setTimeout(() => {
      const toss = Math.random() < 0.5 ? 'Heads' : 'Tails';
      setResult(toss);
      setIsFlipping(false);
    }, 1500); // Simulate flip duration
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coin-toss-modal-title"
    >
      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-sm border border-gray-700 text-center">
        <div className="flex justify-between items-center mb-6">
            <h2 id="coin-toss-modal-title" className="text-2xl font-bold text-gray-50">
            Coin Toss
            </h2>
            <button
                onClick={onClose}
                aria-label="Close coin toss modal"
                className="text-gray-400 hover:text-gray-200 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="flex justify-center items-center my-8 h-32">
          <CoinIcon side={result} isFlipping={isFlipping} logoUrl="/logo.png" />
        </div>

        {isFlipping && (
          <p className="text-xl text-gray-300 mb-6 animate-pulse">Flipping...</p>
        )}
        
        {result && !isFlipping && (
          <p className="text-3xl font-bold text-gray-100 mb-6">
            It's <span className={result === 'Heads' ? 'text-green-400' : 'text-blue-400'}>{result}!</span>
          </p>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleFlipCoin}
            disabled={isFlipping}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {isFlipping ? 'Flipping...' : (result ? 'Toss Again' : 'Flip Coin')}
          </Button>

          {result && (
            <Button
              onClick={onProceed}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              Proceed to New Match
            </Button>
          )}
          
          {!result && (
             <Button
                onClick={onClose}
                variant="outline"
                size="md"
                className="w-full"
            >
                Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoinTossModal;