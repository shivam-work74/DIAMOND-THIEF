import React, { useState } from "react";
import Menu from "./pages/Menu";
import Game from "./pages/Game";

export default function App() {
  const [mode, setMode] = useState(null);
  const [difficulty, setDifficulty] = useState(null);

  const startGame = (selectedMode, selectedDifficulty) => {
    setMode(selectedMode);
    setDifficulty(selectedDifficulty);
  };

  return (
    <>
      {!mode && <Menu startGame={startGame} />}
      {mode && (
        <Game
          mode={mode}
          difficulty={difficulty}
          goBack={() => setMode(null)}
        />
      )}
    </>
  );
}
