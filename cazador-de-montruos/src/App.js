import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const WIDTH = 800;
const HEIGHT = 350;
const MONSTER_SIZE = 50;
const HUMAN_SIZE = 50;
const MAX_LIVES = 3;

function App() {
  const [monsters, setMonsters] = useState([]);
  const [humans, setHumans] = useState([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [lives, setLives] = useState(MAX_LIVES); // Vidas del jugador
  const [timeLeft, setTimeLeft] = useState(30); // Tiempo para el juego
  const [highScore, setHighScore] = useState(0); // Puntaje más alto
  const [level, setLevel] = useState(1); // Nivel del juego
  const canvasRef = useRef(null);

  // Leer el puntaje más alto desde el localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('highScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Guardar el puntaje más alto en el localStorage
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('highScore', score); // Guardamos el nuevo récord
    }
  }, [score, highScore]);

  // Generar un nuevo monstruo
  const generateMonster = () => {
    const x = Math.random() * (WIDTH - MONSTER_SIZE);
    const y = Math.random() * (HEIGHT - MONSTER_SIZE);
    const speed = Math.random() * 2 + 1 + level * 0.5; // Aumentar la velocidad con el nivel
    const type = Math.random() > 0.5 ? 'fast' : 'slow'; // Tipos de monstruos
    const color = type === 'fast' ? '#FF5733' : '#28A745'; // Color según tipo

    setMonsters((prev) => [...prev, { x, y, speed, type, color }]);
  };

  // Generar un nuevo ser humano
  const generateHuman = () => {
    const x = Math.random() * (WIDTH - HUMAN_SIZE);
    const y = Math.random() * (HEIGHT - HUMAN_SIZE);
    setHumans((prev) => [...prev, { x, y, timeout: Date.now() }]); // Cada ser humano tiene un temporizador
  };

  // Manejar clic en el canvas
  const handleCanvasClick = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Comprobar si se ha hecho clic en un monstruo
    setMonsters((prev) => {
      const newMonsters = prev.filter((monster) => {
        const distance = Math.sqrt(
          (clickX - monster.x) ** 2 + (clickY - monster.y) ** 2
        );
        if (distance < MONSTER_SIZE) {
          setScore((score) => score + (monster.type === 'fast' ? 20 : 10)); // Puntuación diferente según el tipo de monstruo
          return false; // Eliminar el monstruo atrapado
        }
        return true; // Mantener los demás monstruos
      });
      return newMonsters;
    });

    // Comprobar si se ha hecho clic en un ser humano
    setHumans((prev) => {
      const newHumans = prev.filter((human) => {
        const distance = Math.sqrt(
          (clickX - human.x) ** 2 + (clickY - human.y) ** 2
        );
        if (distance < HUMAN_SIZE) {
          setLives((lives) => {
            const newLives = lives - 1;
            if (newLives <= 0) {
              setGameActive(false); // Fin del juego
            }
            return newLives;
          });
          return false; // Eliminar el ser humano atrapado
        }
        return true; // Mantener los demás seres humanos
      });
      return newHumans;
    });
  };

  // Actualizar la posición de los monstruos y humanos
  const updateEntities = () => {
    const difficultyFactor = Math.min(Math.floor(score / 100), 5); // Aumentar velocidad según la puntuación

    // Actualizar monstruos
    setMonsters((prev) =>
      prev.map((monster) => ({
        ...monster,
        x: monster.x + (Math.random() > 0.5 ? (monster.speed + difficultyFactor) : -(monster.speed + difficultyFactor)),
        y: monster.y + (Math.random() > 0.5 ? (monster.speed + difficultyFactor) : -(monster.speed + difficultyFactor)),
      }))
    );

    // Actualizar humanos, eliminarlos después de un tiempo
    setHumans((prev) =>
      prev.filter((human) => Date.now() - human.timeout < 5000) // Eliminar humanos que llevan más de 5 segundos
    );
  };

  // Iniciar el juego
  const startGame = () => {
    setScore(0);
    setMonsters([]);
    setHumans([]);
    setLives(MAX_LIVES);
    setGameActive(true);
    setTimeLeft(30); // Resetear el tiempo
    setLevel(1); // Iniciar en el primer nivel

    generateMonster(); // Generar el primer monstruo
    generateHuman(); // Generar el primer ser humano

    const intervalId = setInterval(() => {
      updateEntities();
      if (monsters.length < 10) generateMonster(); // Generar más monstruos si es necesario
      if (humans.length < 3) generateHuman(); // Generar más humanos si es necesario

      if (timeLeft <= 0 || lives <= 0) {
        setGameActive(false);
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  };

  // Temporizador para el tiempo de juego
  useEffect(() => {
    if (!gameActive) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) {
          if (lives > 1) {
            setLevel(level + 1); // Pasar al siguiente nivel
            setTimeLeft(30 - level * 3); // Reducir el tiempo con cada nivel
          } else {
            setGameActive(false); // Fin del juego si no hay vidas
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [gameActive, lives, level]);

  // Dibujar en el canvas
  useEffect(() => {
    if (!gameActive) return;

    const ctx = canvasRef.current.getContext('2d');

    const draw = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#87CEEB'; // Color de fondo (cielo)
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      monsters.forEach((monster) => {
        ctx.fillStyle = monster.color;
        ctx.fillRect(monster.x, monster.y, MONSTER_SIZE, MONSTER_SIZE);
        ctx.strokeStyle = '#C70039'; // Borde del monstruo
        ctx.strokeRect(monster.x, monster.y, MONSTER_SIZE, MONSTER_SIZE);
      });

      humans.forEach((human) => {
        ctx.fillStyle = '#FFD700'; // Color de los humanos (amarillo)
        ctx.fillRect(human.x, human.y, HUMAN_SIZE, HUMAN_SIZE);
        ctx.strokeStyle = '#FFA500'; // Borde del humano
        ctx.strokeRect(human.x, human.y, HUMAN_SIZE, HUMAN_SIZE);
      });

      requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(draw);
  }, [monsters, humans, gameActive]);

  return (
    <div className="game-container">
      <h1>Cazador de Monstruos</h1>
      <h2>Puntuación: {score}</h2>
      <h3>Vidas: {lives}</h3>
      <h3>Tiempo restante: {timeLeft}s</h3>
      <h3>Récord anterior: {highScore}</h3>
      <h3>Nivel: {level}</h3>
      {!gameActive && (
        <div className="game-over">
          <h2>¡Juego Terminado!</h2>
          <p>Puntuación final: {score}</p>
          <button onClick={startGame}>Reiniciar Juego</button>
        </div>
      )}
      {gameActive && <button className="pause-btn" onClick={() => setGameActive(false)}>Pausar</button>}
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onClick={handleCanvasClick}
      />
    </div>
  );
}

export default App;
