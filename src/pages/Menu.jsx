import React, { useEffect, useRef, useState } from "react";

export default function Menu({ startGame }) {
  const canvasRef = useRef(null);
  const [showHowTo, setShowHowTo] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const [buttonLoaded, setButtonLoaded] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);

  // Animated diamonds & particles
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const diamonds = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 20 + 10,
      dy: Math.random() * 0.7 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      rotation: Math.random() * Math.PI * 2,
      dRotation: (Math.random() - 0.5) * 0.02,
    }));

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gradient shift
      const time = Date.now() * 0.0003;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, `hsl(${(time*360)%360}, 70%, 10%)`);
      gradient.addColorStop(1, `hsl(${(time*360+60)%360}, 60%, 15%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw diamonds with rotation & glow
      diamonds.forEach((d) => {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation);
        ctx.fillStyle = "rgba(173,216,230,0.7)";
        ctx.shadowColor = "cyan";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -d.size / 2);
        ctx.lineTo(d.size / 2, 0);
        ctx.lineTo(0, d.size / 2);
        ctx.lineTo(-d.size / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Update position & rotation
        d.y += d.dy;
        d.x += d.dx;
        d.rotation += d.dRotation;

        if (d.y > canvas.height + 20) d.y = -20;
        if (d.x > canvas.width + 20) d.x = -20;
        if (d.x < -20) d.x = canvas.width + 20;
      });

      // Sparkles overlay
      sparkles.forEach((s) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        s.alpha -= 0.02;
      });

      requestAnimationFrame(loop);
    };
    loop();
  }, [sparkles]);

  // Sparkle generation
  useEffect(() => {
    const interval = setInterval(() => {
      setSparkles((prev) => [
        ...prev.filter((s) => s.alpha > 0),
        {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          alpha: 1,
          size: Math.random() * 3 + 2,
        },
      ]);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Animate buttons
  useEffect(() => {
    const timeout = setTimeout(() => setButtonLoaded(true), 200);
    return () => clearTimeout(timeout);
  }, []);

  const handleModeClick = (mode) => {
    setSelectedMode(mode);
    setShowLevelModal(true);
  };

  const handleLevelSelect = (level) => {
    startGame(selectedMode, level);
  };

  return (
    <div className="w-full h-screen relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
        <h1 className="text-6xl font-extrabold mb-12 drop-shadow-lg animate-gradient-text">
          Grab the Diamond
        </h1>
        <div className="flex flex-col space-y-6">
          <button
            onClick={() => handleModeClick("bot")}
            className={`px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl shadow-lg hover:scale-105 transition transform duration-300 hover:from-blue-400 hover:to-blue-600 text-xl font-semibold relative overflow-hidden button-glow
              ${buttonLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}`}
            style={{ transition: "all 0.6s ease-out" }}
          >
            Play with Bot
          </button>

          <button
            onClick={() => handleModeClick("friend")}
            className={`px-8 py-4 bg-gradient-to-r from-green-500 to-green-700 rounded-2xl shadow-lg hover:scale-105 transition transform duration-300 hover:from-green-400 hover:to-green-600 text-xl font-semibold relative overflow-hidden button-glow
              ${buttonLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}`}
            style={{ transition: "all 0.7s ease-out" }}
          >
            Play with Friend
          </button>

          <button
            onClick={() => setShowHowTo(true)}
            className={`px-6 py-2 bg-yellow-500 rounded-xl shadow-md hover:scale-105 transition transform duration-300 hover:bg-yellow-400 text-lg font-medium mt-4 button-glow
              ${buttonLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}`}
            style={{ transition: "all 0.8s ease-out" }}
          >
            How to Play
          </button>
        </div>
      </div>

      {/* Difficulty Selection Modal */}
      {showLevelModal && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded-lg w-80 flex flex-col items-center space-y-4">
            <h2 className="text-xl font-bold mb-2">Choose Difficulty</h2>
            {["easy", "medium", "hard"].map((level) => (
              <button
                key={level}
                onClick={() => handleLevelSelect(level)}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transform transition duration-300 w-full"
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* How to Play Modal */}
      {showHowTo && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded-lg w-96 relative">
            <h2 className="text-xl font-bold mb-4">How to Play</h2>
            <p className="mb-2">Player 1 (Click/Touch): Tap/click your hand to grab when light is off.</p>
            <p className="mb-2">Player 2 (Desktop Keyboard): Press Spacebar to grab when light is off.</p>
            <p className="mb-2">Player 2 (Mobile/Click): Tap/click your hand to grab when light is off.</p>
            <p className="mb-2">Bot mode: Bot automatically grabs when light is off.</p>
            <p className="mb-2">Only one hand can grab the diamond at a time.</p>
            <p className="mb-2">First to grab the diamond gets 5 points.</p>
            <button
              onClick={() => setShowHowTo(false)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-400"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Glow & Sparkle CSS */}
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
        @keyframes gradientAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-text {
          background: linear-gradient(270deg, #ff4f81, #ffcc33, #33ccff, #8e2de2);
          background-size: 800% 800%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientAnimation 8s ease infinite;
        }
      `}</style>
    </div>
  );
}
