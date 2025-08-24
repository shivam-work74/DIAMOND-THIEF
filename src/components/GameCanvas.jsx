import React, { useEffect, useRef, useState, useCallback } from "react";

const canvasWidth = 800;
const canvasHeight = 600;
const handSize = 80;
const diamondSize = 40;
const grabPoints = 5;

export default function GameCanvas({ setScores, mode, difficulty }) {
  const canvasRef = useRef(null);
  const [players, setPlayers] = useState({
    player1: { x: 100, y: canvasHeight / 2, state: "idle" },
    player2: { x: canvasWidth - 180, y: canvasHeight / 2, state: "idle" },
  });
  const [diamond] = useState({
    x: canvasWidth / 2 - diamondSize / 2,
    y: canvasHeight / 2 - diamondSize / 2,
  });
  const [lightOn, setLightOn] = useState(true);
  const [canGrab, setCanGrab] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [grabbedBy, setGrabbedBy] = useState(null);
  const particles = useRef([]);

  const handLeft = useRef(null);
  const handRight = useRef(null);
  const diamondImg = useRef(null);

  // Difficulty speed
  const difficultySpeed = {
    easy: 0.03,
    medium: 0.05,
    hard: 0.08,
  };
  const speed = difficultySpeed[difficulty] || 0.05;

  // Load images
  useEffect(() => {
    const left = new Image();
    left.src = "/images/hand-left.png";
    left.onload = () => (handLeft.current = left);

    const right = new Image();
    right.src = "/images/hand-right.png";
    right.onload = () => (handRight.current = right);

    const diamondI = new Image();
    diamondI.src = "/images/diamond.png";
    diamondI.onload = () => (diamondImg.current = diamondI);
  }, []);

  // Toggle light
  useEffect(() => {
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
  }, []);

  const spawnParticles = (x, y, color) => {
    for (let i = 0; i < 20; i++) {
      particles.current.push({
        x,
        y,
        dx: (Math.random() - 0.5) * 6,
        dy: (Math.random() - 0.5) * 6,
        life: 20,
        color,
      });
    }
  };

  const animateHandGrab = useCallback(
    (playerKey) => {
      if (!canGrab || grabbedBy || players[playerKey].state !== "idle") return;

      setGrabbedBy(playerKey);

      const hand = players[playerKey];
      const startX = hand.x;
      const startY = hand.y;
      const endX = diamond.x;
      const endY = diamond.y;
      let progress = 0;

      const moveToDiamond = () => {
        if (progress < 1) {
          const newX = startX + (endX - startX) * progress;
          const newY = startY + (endY - startY) * progress;
          setPlayers((prev) => ({
            ...prev,
            [playerKey]: { ...prev[playerKey], x: newX, y: newY, state: "moving" },
          }));
          progress += speed;
          requestAnimationFrame(moveToDiamond);
        } else {
          // Award points
          setScores((prev) => ({ ...prev, [playerKey]: prev[playerKey] + grabPoints }));
          spawnParticles(
            diamond.x + diamondSize / 2,
            diamond.y + diamondSize / 2,
            playerKey === "player1" ? "cyan" : "red"
          );

          progress = 0;
          const returnHand = () => {
            if (progress < 1) {
              const newX = endX + (startX - endX) * progress;
              const newY = endY + (startY - endY) * progress;
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
    [canGrab, grabbedBy, players, setScores, diamond.x, diamond.y, speed]
  );

  // Click/tap
  const handlePointerDown = useCallback(
    (e) => {
      if (!canGrab || grabbedBy) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

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
    [canGrab, grabbedBy, players, animateHandGrab, mode]
  );

  // Bot logic
  useEffect(() => {
    if (mode === "bot" && canGrab && !grabbedBy) {
      const timer = setTimeout(() => animateHandGrab("player2"), Math.random() * 700 + 200);
      return () => clearTimeout(timer);
    }
  }, [canGrab, mode, grabbedBy, animateHandGrab]);

  // Keyboard grab for Player 2 (friend mode)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " " && canGrab && mode === "friend") {
        animateHandGrab("player2");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canGrab, mode, animateHandGrab]);

  // Drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const drawHand = (img, x, y, flip = false) => {
      if (!img || !img.complete) return;
      ctx.save();
      ctx.translate(x + handSize / 2, y + handSize / 2);
      if (flip) ctx.scale(-1, 1);
      ctx.rotate(Math.sin(Date.now() / 200) * 0.1);
      ctx.drawImage(img, -handSize / 2, -handSize / 2, handSize, handSize);
      ctx.restore();
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Table
      ctx.fillStyle = "#6B3E26";
      ctx.fillRect(canvasWidth / 2 - 150, canvasHeight / 2 + 40, 300, 30);

      // Diamond light
      if (lightOn) {
        const grad = ctx.createRadialGradient(
          diamond.x + diamondSize / 2,
          diamond.y + diamondSize / 2,
          0,
          diamond.x + diamondSize / 2,
          diamond.y + diamondSize / 2,
          80
        );
        grad.addColorStop(0, "rgba(255,255,255,0.6)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(diamond.x + diamondSize / 2, diamond.y + diamondSize / 2, 80, 0, Math.PI * 2);
        ctx.fill();
      }

      // Diamond
      if (diamondImg.current && diamondImg.current.complete) {
        ctx.drawImage(diamondImg.current, diamond.x, diamond.y, diamondSize, diamondSize);
      }

      // Hands
      drawHand(handLeft.current, players.player1.x, players.player1.y, false);
      drawHand(handRight.current, players.player2.x, players.player2.y, true);

      // Particles
      particles.current.forEach((p, i) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 20;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        if (p.life <= 0) particles.current.splice(i, 1);
      });
      ctx.globalAlpha = 1;

      requestAnimationFrame(loop);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    loop();
    return () => canvas.removeEventListener("pointerdown", handlePointerDown);
  }, [players, lightOn, canGrab, mode, handlePointerDown, diamond.x, diamond.y]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="border-4 border-white rounded-xl shadow-lg glow-canvas"
      />
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setShowHowTo(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 shadow"
        >
          How to Play
        </button>
        <button
          onClick={() => animateHandGrab("player1")}
          className="px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-500 shadow"
        >
          Player 1 Grab
        </button>
        {mode === "friend" && (
          <button
            onClick={() => animateHandGrab("player2")}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 shadow"
          >
            Player 2 Grab
          </button>
        )}
      </div>

      {showHowTo && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96 relative">
            <h2 className="text-xl font-bold mb-4">How to Play</h2>
            <p className="mb-2">Player 1 (Click/Touch or Button): Grab the diamond when light is off.</p>
            <p className="mb-2">Player 2 (Keyboard Space / Button): Grab when light is off.</p>
            <p className="mb-2">Bot mode: Bot automatically grabs when light is off.</p>
            <p className="mb-2">Only one hand can grab at a time. First grab earns 5 points.</p>
            <button
              onClick={() => setShowHowTo(false)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
