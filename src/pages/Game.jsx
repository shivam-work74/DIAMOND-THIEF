import React, { useState, useRef } from "react";
import GameCanvas from "../components/GameCanvas";

export default function Game({ mode, difficulty, goBack }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const canvasKey = useRef(0); // force GameCanvas reset
  const [clickParticles, setClickParticles] = useState([]);

  const spawnClickParticles = (x, y) => {
    const newParticles = Array.from({ length: 20 }, () => ({
      x,
      y,
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 6,
      life: 20 + Math.random() * 10,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    }));
    setClickParticles((prev) => [...prev, ...newParticles]);
  };

  const resetGame = () => {
    spawnClickParticles(window.innerWidth - 100, 60); // near button
    setScores({ player1: 0, player2: 0 });
    canvasKey.current += 1;
  };

  const handleBack = () => {
    spawnClickParticles(window.innerWidth - 100, 120); // near back button
    goBack();
  };

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col items-center relative overflow-hidden">
      {/* Scores */}
      <div className="text-white mt-4 text-2xl mb-2 drop-shadow-lg">
        Player: {scores.player1} | {mode === "bot" ? "Bot" : "Friend"}: {scores.player2}
      </div>

      {/* Game Canvas */}
      <GameCanvas
        key={canvasKey.current}
        setScores={setScores}
        mode={mode}
        difficulty={difficulty}
        clickParticles={clickParticles}
        setClickParticles={setClickParticles}
      />

      {/* Control Buttons */}
      <div className="absolute top-4 right-4 flex flex-col space-y-4">
        <button
          onClick={resetGame}
          className="relative px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:from-blue-400 hover:to-blue-600 button-glow"
        >
          Reset
          <span className="absolute -inset-1 bg-white opacity-10 rounded-2xl blur-lg animate-pulse"></span>
        </button>

        <button
          onClick={handleBack}
          className="relative px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:from-red-400 hover:to-red-600 button-glow"
        >
          Back
          <span className="absolute -inset-1 bg-white opacity-10 rounded-2xl blur-lg animate-pulse"></span>
        </button>
      </div>

      {/* Glow effect CSS */}
      <style>{`
        .button-glow::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
          opacity: 0;
          transform: scale(0);
          transition: all 0.5s ease;
          border-radius: 50%;
          pointer-events: none;
        }
        .button-glow:hover::before {
          opacity: 1;
          transform: scale(1);
        }
      `}</style>
    </div>
  );
}
