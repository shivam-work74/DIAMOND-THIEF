import React, { useEffect, useRef, useState, useCallback } from "react";

const getCanvasSize = () => {
  const maxW = 800, maxH = 600;
  const w = Math.min(window.innerWidth * 0.98, maxW);
  const h = Math.min(window.innerHeight * 0.65, maxH);
  return { w, h };
};

const handSizeRatio = 0.13;
const diamondSizeRatio = 0.07;
const grabPoints = 10;
const WIN_SCORE = 50;

export default function GameCanvas({ setScores, mode, difficulty, scores }) {
  const [canvasSize, setCanvasSize] = useState(getCanvasSize());
  const canvasRef = useRef(null);

  const handSize = canvasSize.w * handSizeRatio;
  const diamondSize = canvasSize.w * diamondSizeRatio;

  const [players, setPlayers] = useState({
    player1: { x: canvasSize.w * 0.12, y: canvasSize.h / 2 - handSize / 2, state: "idle" },
    player2: { x: canvasSize.w * 0.78, y: canvasSize.h / 2 - handSize / 2, state: "idle" },
  });
  const [diamond, setDiamond] = useState({
    x: canvasSize.w / 2 - diamondSize / 2,
    y: canvasSize.h / 2 - diamondSize / 2,
  });

  const [lightOn, setLightOn] = useState(true);
  const [canGrab, setCanGrab] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [grabbedBy, setGrabbedBy] = useState(null);
  const [winner, setWinner] = useState(null);
  const particles = useRef([]);
  const sparkles = useRef([]);
  const waves = useRef([]);

  const handLeft = useRef(null);
  const handRight = useRef(null);
  const diamondImg = useRef(null);

  const difficultySpeed = {
    easy: 0.05,
    medium: 0.12,
    hard: 0.22,
  };
  const speed = difficultySpeed[difficulty] || 0.12;

  // Responsive resize
  useEffect(() => {
    const handleResize = () => {
      const size = getCanvasSize();
      setCanvasSize(size);
      setDiamond({
        x: size.w / 2 - size.w * diamondSizeRatio / 2,
        y: size.h / 2 - size.w * diamondSizeRatio / 2,
      });
      setPlayers({
        player1: { x: size.w * 0.12, y: size.h / 2 - size.w * handSizeRatio / 2, state: "idle" },
        player2: { x: size.w * 0.78, y: size.h / 2 - size.w * handSizeRatio / 2, state: "idle" },
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load images
  useEffect(() => {
    const left = new window.Image();
    left.src = "/images/hand-left.png";
    left.onload = () => (handLeft.current = left);

    const right = new window.Image();
    right.src = "/images/hand-right.png";
    right.onload = () => (handRight.current = right);

    const diamondI = new window.Image();
    diamondI.src = "/images/diamond.png";
    diamondI.onload = () => (diamondImg.current = diamondI);
  }, []);

  // Toggle light
  useEffect(() => {
    if (winner) return;
    const toggleLight = () => {
      setLightOn(true);
      setCanGrab(false);
      const delay = Math.random() * 2000 + 1000;
      setTimeout(() => {
        setLightOn(false);
        setCanGrab(true);
      }, delay);
    };

    toggleLight();
    const interval = setInterval(toggleLight, 4000);
    return () => clearInterval(interval);
  }, [winner]);

  // Particles
  const spawnParticles = (x, y, color) => {
    const colors = [
      color,
      "#fff",
      "gold",
      "deepskyblue",
      "hotpink",
      "cyan",
      "red",
      "orange",
    ];
    for (let i = 0; i < 30; i++) {
      particles.current.push({
        x,
        y,
        dx: (Math.random() - 0.5) * 8,
        dy: (Math.random() - 0.5) * 8,
        life: 30 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  };

  // Sparkles
  useEffect(() => {
    const createSparkle = () => {
      sparkles.current.push({
        x: Math.random() * canvasSize.w,
        y: Math.random() * canvasSize.h,
        r: Math.random() * 2 + 1,
        alpha: 1,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
      });
      if (sparkles.current.length > 60) sparkles.current.shift();
    };
    const sparkleInterval = setInterval(createSparkle, 120);
    return () => clearInterval(sparkleInterval);
  }, [canvasSize]);

  // Waves
  useEffect(() => {
    const createWave = () => {
      waves.current.push({
        t: 0,
        color: `hsla(${Math.random() * 360}, 80%, 60%, 0.18)`,
        amp: Math.random() * 15 + 10,
        freq: Math.random() * 0.03 + 0.01,
        speed: Math.random() * 0.02 + 0.01,
      });
      if (waves.current.length > 6) waves.current.shift();
    };
    const waveInterval = setInterval(createWave, 1200);
    return () => clearInterval(waveInterval);
  }, []);

  // Hand grab animation
  const animateHandGrab = useCallback(
    (playerKey) => {
      if (!canGrab || grabbedBy || players[playerKey].state !== "idle" || winner) return;

      setGrabbedBy(playerKey);

      const hand = players[playerKey];
      const startX = hand.x;
      const startY = hand.y;
      const endX = diamond.x;
      const endY = diamond.y;
      let progress = 0;

      const moveToDiamond = () => {
        if (progress < 1) {
          const bounce = Math.sin(progress * Math.PI) * 10;
          const newX = startX + (endX - startX) * progress;
          const newY = startY + (endY - startY) * progress - bounce;
          setPlayers((prev) => ({
            ...prev,
            [playerKey]: { ...prev[playerKey], x: newX, y: newY, state: "moving" },
          }));
          progress += speed;
          requestAnimationFrame(moveToDiamond);
        } else {
          setScores((prev) => {
            const updated = { ...prev, [playerKey]: prev[playerKey] + grabPoints };
            // Winner check
            if (updated[playerKey] >= WIN_SCORE) {
              setWinner(playerKey);
            }
            return updated;
          });
          spawnParticles(
            diamond.x + diamondSize / 2,
            diamond.y + diamondSize / 2,
            playerKey === "player1" ? "cyan" : "red"
          );

          progress = 0;
          const returnHand = () => {
            if (progress < 1) {
              const bounce = Math.sin(progress * Math.PI) * 10;
              const newX = endX + (startX - endX) * progress;
              const newY = endY + (startY - endY) * progress - bounce;
              setPlayers((prev) => ({
                ...prev,
                [playerKey]: { ...prev[playerKey], x: newX, y: newY, state: "returning" },
              }));
              progress += speed;
              requestAnimationFrame(returnHand);
            } else {
              setPlayers((prev) => ({
                ...prev,
                [playerKey]: { ...prev[playerKey], x: startX, y: startY, state: "idle" },
              }));
              setGrabbedBy(null);
              setCanGrab(false);
              setLightOn(true);
            }
          };
          returnHand();
        }
      };
      moveToDiamond();
    },
    [canGrab, grabbedBy, players, setScores, diamond.x, diamond.y, speed, winner]
  );

  // Pointer/touch support
  const handlePointerDown = useCallback(
    (e) => {
      if (!canGrab || grabbedBy || winner) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const mouseX = (clientX - rect.left) * scaleX;
      const mouseY = (clientY - rect.top) * scaleY;

      ["player1", "player2"].forEach((playerKey) => {
        if (playerKey === "player2" && mode === "bot") return;

        const centerX = players[playerKey].x + handSize / 2;
        const centerY = players[playerKey].y + handSize / 2;
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        if (Math.sqrt(dx * dx + dy * dy) < handSize / 2) {
          animateHandGrab(playerKey);
        }
      });
    },
    [canGrab, grabbedBy, players, animateHandGrab, mode, handSize, winner]
  );

  useEffect(() => {
    if (mode === "bot" && canGrab && !grabbedBy && !winner) {
      const timer = setTimeout(() => animateHandGrab("player2"), Math.random() * 700 + 200);
      return () => clearTimeout(timer);
    }
  }, [canGrab, mode, grabbedBy, animateHandGrab, winner]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " " && canGrab && mode === "friend" && !winner) {
        animateHandGrab("player2");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canGrab, mode, animateHandGrab, winner]);

  // Drawing loop (single loop, cleaned up)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const drawHand = (img, x, y, flip = false, color = "#fff") => {
      if (!img || !img.complete) return;
      ctx.save();
      ctx.translate(x + handSize / 2, y + handSize / 2);
      if (flip) ctx.scale(-1, 1);
      ctx.rotate(Math.sin(Date.now() / 200) * 0.1);
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.drawImage(img, -handSize / 2, -handSize / 2, handSize, handSize);
      ctx.restore();
      ctx.shadowBlur = 0;
    };

    const loop = () => {
      const gradBg = ctx.createLinearGradient(0, 0, canvasSize.w, canvasSize.h);
      gradBg.addColorStop(0, "#232526");
      gradBg.addColorStop(1, "#414345");
      ctx.fillStyle = gradBg;
      ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

      waves.current.forEach((wave, idx) => {
        ctx.save();
        ctx.beginPath();
        for (let x = 0; x < canvasSize.w; x += 8) {
          const y =
            canvasSize.h / 2 +
            Math.sin(wave.t + x * wave.freq + idx) * wave.amp +
            Math.cos(wave.t / 2 + x * wave.freq * 2) * (wave.amp / 2);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
        wave.t += wave.speed;
      });

      ctx.fillStyle = "#6B3E26";
      ctx.fillRect(canvasSize.w / 2 - canvasSize.w * 0.18, canvasSize.h / 2 + canvasSize.h * 0.07, canvasSize.w * 0.36, canvasSize.h * 0.05);

      const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 400);
      if (lightOn) {
        const grad = ctx.createRadialGradient(
          diamond.x + diamondSize / 2,
          diamond.y + diamondSize / 2,
          0,
          diamond.x + diamondSize / 2,
          diamond.y + diamondSize / 2,
          diamondSize * 2.5 * pulse
        );
        grad.addColorStop(0, "rgba(255,255,255,0.8)");
        grad.addColorStop(0.5, "rgba(0,255,255,0.3)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(diamond.x + diamondSize / 2, diamond.y + diamondSize / 2, diamondSize * 2.5 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      if (diamondImg.current && diamondImg.current.complete) {
        ctx.save();
        ctx.shadowColor = "#00eaff";
        ctx.shadowBlur = 30 + 10 * pulse;
        ctx.drawImage(diamondImg.current, diamond.x, diamond.y, diamondSize, diamondSize);
        ctx.restore();
      }

      drawHand(handLeft.current, players.player1.x, players.player1.y, false, "#00eaff");
      drawHand(handRight.current, players.player2.x, players.player2.y, true, "#ff3b3b");

      particles.current.forEach((p, i) => {
        ctx.save();
        ctx.globalAlpha = p.life / 40;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        if (p.life <= 0) particles.current.splice(i, 1);
      });

      sparkles.current.forEach((s, i) => {
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#fff";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
        s.x += s.dx;
        s.y += s.dy;
        s.alpha -= 0.01;
        if (s.alpha <= 0) sparkles.current.splice(i, 1);
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(loop);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("touchstart", handlePointerDown, { passive: false });
    loop();

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("touchstart", handlePointerDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [players, lightOn, canGrab, mode, handlePointerDown, diamond.x, diamond.y, canvasSize, handSize, diamondSize]);

  // Only one scorecard, mobile-friendly
  const scoreCard = (
    <div className="flex justify-center mb-4 z-30 w-full">
      <div
        className="score-badge bg-gradient-to-r from-cyan-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-lg font-bold text-lg animate-scorePulse flex gap-6 items-center"
        style={{
          width: "90vw",
          maxWidth: 400,
          justifyContent: "space-between",
          fontSize: "clamp(1rem, 2vw, 1.3rem)",
        }}
      >
        <span>Player 1: {scores?.player1 ?? 0}</span>
        <span>|</span>
        <span>Player 2: {scores?.player2 ?? 0}</span>
      </div>
    </div>
  );

  const handleRipple = (e) => {
    const button = e.currentTarget;
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${e.nativeEvent.offsetX}px`;
    ripple.style.top = `${e.nativeEvent.offsetY}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const ringCount = 3;
  const ringElements = Array.from({ length: ringCount }).map((_, i) => (
    <div
      key={i}
      className="absolute left-1/2 top-1/2 pointer-events-none"
      style={{
        transform: "translate(-50%, -50%)",
        width: `${canvasSize.w + 80 + i * 40}px`,
        height: `${canvasSize.h + 80 + i * 40}px`,
        borderRadius: "50%",
        border: `3px solid rgba(0,234,255,${0.18 - i * 0.04})`,
        boxShadow: `0 0 ${30 + i * 20}px ${10 + i * 10}px #00eaff55`,
        animation: `ringPulse 2.5s ${i * 0.7}s infinite alternate`,
        zIndex: 0,
      }}
    />
  ));

  const floatingDiamond = (
    <div
      className="absolute left-1/2 top-[8%] pointer-events-none"
      style={{
        transform: "translate(-50%, 0)",
        zIndex: 30,
        animation: "floatDiamond 2.5s infinite alternate",
      }}
    >
      <img
        src="/images/diamond.png"
        alt="Floating Diamond"
        style={{
          width: 60,
          height: 60,
          filter: "drop-shadow(0 0 30px #00eaff) drop-shadow(0 0 10px #fff)",
        }}
      />
    </div>
  );

  const neonTitle = (
    <h1
      className="text-3xl md:text-5xl font-extrabold text-center mb-6 animate-pulse-glow"
      style={{
        color: "#00eaff",
        textShadow: "0 0 20px #00eaff, 0 0 40px #fff, 0 0 60px #0ff",
        letterSpacing: "2px",
        zIndex: 40,
        fontSize: "clamp(1.5rem, 6vw, 3rem)",
      }}
    >
      Light Fingers
    </h1>
  );

  // Winner animation/modal
  const winnerModal = winner && (
    <div className="absolute inset-0 flex items-center justify-center z-50" style={{background: "rgba(0,0,0,0.85)"}}>
      <div className="flex flex-col items-center justify-center gap-4">
        <div
          className="winner-anim"
          style={{
            padding: "2rem 2.5rem",
            borderRadius: "2rem",
            background: "linear-gradient(135deg,#00eaff 0%,#ff3b3b 100%)",
            boxShadow: "0 0 60px 20px #fff8",
            border: "4px solid #fff",
            animation: "winnerPulse 1.2s infinite alternate",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: "220px",
          }}
        >
          <span style={{
            fontSize: "2.2rem",
            fontWeight: "bold",
            color: "#fff",
            textShadow: "0 0 20px #fff, 0 0 40px #00eaff",
            marginBottom: "1rem",
            letterSpacing: "2px",
            animation: "winnerTextGlow 1.5s infinite alternate"
          }}>
            🎉 Winner! 🎉
          </span>
          <span style={{
            fontSize: "1.5rem",
            color: "#fff",
            fontWeight: "bold",
            textShadow: "0 0 10px #ff3b3b, 0 0 20px #fff",
            marginBottom: "0.5rem"
          }}>
            {winner === "player1" ? "Player 1" : "Player 2"} reached {WIN_SCORE}!
          </span>
          <button
            onClick={() => {
              setWinner(null);
              setScores({ player1: 0, player2: 0 });
            }}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-pink-400 text-white rounded-lg font-semibold hover:scale-105 transition w-full"
            style={{fontSize: "1.1rem"}}
          >
            Play Again
          </button>
        </div>
      </div>
      <style>
        {`
          @keyframes winnerPulse {
            0% { box-shadow: 0 0 60px 20px #fff8; }
            100% { box-shadow: 0 0 90px 40px #00eaff88; }
          }
          @keyframes winnerTextGlow {
            0% { text-shadow: 0 0 20px #fff, 0 0 40px #00eaff; }
            100% { text-shadow: 0 0 40px #fff, 0 0 60px #ff3b3b; }
          }
        `}
      </style>
    </div>
  );

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{
        minHeight: canvasSize.h + 180,
        width: "100vw",
        background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        overflow: "hidden",
        paddingBottom: "2rem",
      }}
    >
      {neonTitle}
      {floatingDiamond}
      {ringElements}
      {scoreCard}
      <div className="relative z-10" style={{ width: "100vw", display: "flex", justifyContent: "center" }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          className="border-4 border-white rounded-xl shadow-lg glow-canvas"
          style={{
            maxWidth: "98vw",
            maxHeight: "60vh",
            width: canvasSize.w,
            height: canvasSize.h,
            background: "transparent",
            display: "block",
            margin: "0 auto",
            touchAction: "manipulation",
          }}
        />
      </div>
      <div
        className="flex flex-wrap justify-center gap-4 mt-6 w-full"
        style={{
          zIndex: 20,
        }}
      >
        <button
          onClick={(e) => { handleRipple(e); setShowHowTo(true); }}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-semibold shadow-lg hover:scale-105 transition relative overflow-hidden"
          style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)" }}
          disabled={!!winner}
        >
          How to Play
        </button>
        <button
          onClick={(e) => { handleRipple(e); animateHandGrab("player1"); }}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-400 text-white rounded-lg font-semibold shadow-lg hover:scale-105 transition relative overflow-hidden"
          style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)" }}
          disabled={!!winner}
        >
          Player 1 Grab
        </button>
        {mode === "friend" && (
          <button
            onClick={(e) => { handleRipple(e); animateHandGrab("player2"); }}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-400 text-white rounded-lg font-semibold shadow-lg hover:scale-105 transition relative overflow-hidden"
            style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)" }}
            disabled={!!winner}
          >
            Player 2 Grab
          </button>
        )}
      </div>
      {showHowTo && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md relative shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">How to Play</h2>
            <ul className="mb-4 text-gray-700 text-lg list-disc pl-5">
              <li>Player 1: Tap hand or use button to grab when light is off.</li>
              <li>Player 2: Press Space or use button (Friend mode).</li>
              <li>Bot mode: Bot grabs automatically when light is off.</li>
              <li>Only one hand can grab at a time. First grab earns 10 points.</li>
              <li>First to reach 50 points wins!</li>
            </ul>
            <button
              onClick={() => setShowHowTo(false)}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-red-500 to-pink-400 text-white rounded-lg font-semibold hover:scale-105 transition w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {winnerModal}
      <style>
        {`
          @keyframes ringPulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.7; }
          }
          @keyframes floatDiamond {
            0% { transform: translate(-50%, 0) scale(1); }
            100% { transform: translate(-50%, 20px) scale(1.08); }
          }
          @keyframes scorePulse {
            0%,100% { box-shadow: 0 0 20px #00eaff, 0 0 40px #fff; }
            50% { box-shadow: 0 0 40px #ff3b3b, 0 0 60px #fff; }
          }
          .animate-scorePulse {
            animation: scorePulse 2s infinite;
          }
          .animate-pulse-glow {
            animation: pulse-glow 2s ease-in-out infinite;
          }
          @keyframes pulse-glow {
            0%,100% { text-shadow:0 0 10px #0ff,0 0 20px #f0f,0 0 30px #ff0; }
            50% { text-shadow:0 0 20px #0ff,0 0 30px #f0f,0 0 40px #ff0; }
          }
          .ripple {
            position: absolute;
            border-radius: 50%;
            width: 120px;
            height: 120px;
            left: 50%;
            top: 50%;
            pointer-events: none;
            background: radial-gradient(circle, #fff3 10%, transparent 70%);
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
            animation: rippleAnim 0.6s linear;
          }
          @keyframes rippleAnim {
            0% { opacity: 0.7; transform: translate(-50%, -50%) scale(0.8);}
            100% { opacity: 0; transform: translate(-50%, -50%) scale(2);}
          }
        `}
      </style>
    </div>
  );
}