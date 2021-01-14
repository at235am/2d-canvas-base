// styling:
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import {
  createRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import map from "./assets/map.png";

import { DIRECTIONS } from "./game-values/default-values";

import Camera from "./components/Camera";
import Character from "./components/Character";
import Map from "./components/Map";

import { useKeyMovement } from "./hooks/useKeyPress";
import useWindowSize from "./hooks/useWindowSize";
import useSound from "use-sound";

import wallHit from "./assets/sounds/wall-hit.wav";
// import { timeHours, timer } from "d3";

import { DEFAULT_MAP } from "./maps/default-map";

import { TILE_SIZE, STEP } from "./game-values/default-values";

import playerSprite from "./assets/demorpgcharacter.png";

const GameContainer = styled.div`
  position: relative;

  background-color: gray;
  height: 100%;

  display: flex;
  justify-content: center;
  align-items: center;

  canvas {
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }
`;

const App = () => {
  const [mapData, setMapData] = useState(DEFAULT_MAP);
  const { windowWidth, windowHeight } = useWindowSize();

  const canvasRef = useRef();
  const nextFrame = useRef();
  const prevFrame = useRef();
  const fps = useRef(0);

  // game state:
  const directionsHeld = useKeyMovement();
  const solidTiles = useRef();
  const playerData = useRef({
    x: 0,
    y: 0,
    width: TILE_SIZE,
    height: TILE_SIZE,
    collided: false,
    hitboxX: TILE_SIZE / 2 - 24, // player.width / 2 - c
    hitboxY: TILE_SIZE / 2 - 15,
    hitboxWidth: 48,
    hitboxHeight: 71,
  });

  // various:
  const [playWallHit] = useSound(wallHit, { volume: 0.15 });
  const playerSpriteImage = new Image();

  useEffect(() => {
    console.log("Finding collision tiles");
    const newSolidTiles = mapData
      .map((row, y) =>
        row
          .map((tile, x) =>
            tile.type === "solid"
              ? {
                  x: x * TILE_SIZE,
                  y: y * TILE_SIZE,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                }
              : null
          )
          .filter((tile) => tile !== null)
      )
      .flat();

    // setSolidTiles(newSolidTiles);
    solidTiles.current = newSolidTiles;
  }, [mapData]);

  const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
  };

  // const clamp = (value, min, max) => {
  //   if (value < min) return min;
  //   else if (value > max) return max;
  //   return value;
  // };

  /////////////////////////////////////////////////////////////////////////////
  // CAMERA CONTROLS
  /////////////////////////////////////////////////////////////////////////////
  const panCam = (ctx, canvas) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset the transform matrix as it is cumulative
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear the viewport AFTER the matrix is reset

    // Clamp the camera position to the world bounds while centering the camera around the player
    const map = {
      minX: 0,
      maxX: mapData[0].length * TILE_SIZE,
      minY: 0,
      maxY: mapData.length * TILE_SIZE,
    };

    const player = { ...playerData.current };

    const camX = clamp(
      -player.x + canvas.width / 2,
      -(map.maxX - canvas.width),
      map.minX
    );
    const camY = clamp(
      -player.y + canvas.height / 2,
      -(map.maxY - canvas.height),
      map.minY
    );

    // console.log("cam", camX, camY);
    ctx.translate(camX, camY);
  };

  const resetCam = (ctx) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset the transform matrix as it is cumulative
  };

  /////////////////////////////////////////////////////////////////////////////
  // MOVEMENT
  /////////////////////////////////////////////////////////////////////////////
  const validateStep = (prev, next) => {
    // finding the change between next and prev (should always be + or - STEP)
    const deltaX = next.x - prev.x;
    const deltaY = next.y - prev.y;
    const player = {
      ...playerData.current,
      x: playerData.current.x + deltaX,
      y: playerData.current.y + deltaY,
    };

    // checking for tiles that can't be moved throuhg:
    const tileCollision = solidTiles.current.some((tile) => {
      return (
        tile.x < player.x + player.width &&
        tile.x + tile.width > player.x &&
        tile.y < player.y + player.height &&
        tile.y + tile.height > player.y
      );
    });

    const mapWidth = mapData[0].length * TILE_SIZE;
    const mapHeight = mapData.length * TILE_SIZE;
    const boundaryCollision =
      player.x < 0 ||
      player.y < 0 ||
      player.x > mapWidth - player.width ||
      player.y > mapHeight - player.height;

    const collided = tileCollision || boundaryCollision;
    return { collided, position: collided ? prev : next };
  };

  const moveUp = (player) => ({ ...player, y: player.y - STEP });
  const moveLeft = (player) => ({ ...player, x: player.x - STEP });
  const moveDown = (player) => ({ ...player, y: player.y + STEP });
  const moveRight = (player) => ({ ...player, x: player.x + STEP });

  const move = () => {
    const createNewPlayerState = (handleMovement = () => {}) => {
      const player = playerData.current;
      const { collided, position } = validateStep(
        player,
        handleMovement(player)
      );
      return {
        ...player,
        collided,
        x: position.x,
        y: position.y,
      };
    };

    const heldDirection = directionsHeld.current[0];
    if (heldDirection === DIRECTIONS.up)
      playerData.current = createNewPlayerState(moveUp);
    else if (heldDirection === DIRECTIONS.left)
      playerData.current = createNewPlayerState(moveLeft);
    else if (heldDirection === DIRECTIONS.down)
      playerData.current = createNewPlayerState(moveDown);
    else if (heldDirection === DIRECTIONS.right)
      playerData.current = createNewPlayerState(moveRight);
  };
  /////////////////////////////////////////////////////////////////////////////
  // DRAWING:
  /////////////////////////////////////////////////////////////////////////////
  const drawMap = (ctx, canvas) => {
    mapData.forEach((row, y) => {
      row.forEach((tile, x) => {
        ctx.fillStyle = tile.color;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      });
    });
  };

  const drawFps = (ctx, canvas) => {
    ctx.font = "30px Arial";
    ctx.fillStyle = fps.current > 60 ? "green" : "red";
    ctx.fillText(fps.current, 10, 30);
  };

  const drawPlayer = (ctx, canvas) => {
    const player = playerData.current;
    ctx.imageSmoothingEnabled = false; // pixelizes images for scaling purposes:

    if (player.collided) ctx.fillStyle = "red";
    else ctx.fillStyle = "transparent";

    // console.log(
    //   player.hitboxX,
    //   player.hitboxY,
    //   player.hitboxWidth,
    //   player.hitboxHeight
    // );

    ctx.fillStyle = "red";
    ctx.fillRect(
      player.hitboxX,
      player.hitboxY,
      player.hitboxWidth,
      player.hitboxHeight
    );

    ctx.drawImage(
      playerSpriteImage,
      0,
      0,
      player.width / 4,
      player.height / 4,
      player.x,
      player.y,
      player.width,
      player.height
    );
  };

  /////////////////////////////////////////////////////////////////////////////
  // ENCAPSULATOR:
  /////////////////////////////////////////////////////////////////////////////
  const update = () => {
    move();
  };

  const advance = (time) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const timePassed = (time - prevFrame.current) / 1000;
    fps.current = Math.round(1 / timePassed); // current fps

    update();

    // drawings at depend on the camera panning go here:
    panCam(ctx, canvas);
    drawMap(ctx, canvas);
    drawPlayer(ctx, canvas);

    // absolutely positioned drawings must be called after resetCam();
    resetCam(ctx);
    drawFps(ctx, canvas);

    // update frame references:
    prevFrame.current = time;
    nextFrame.current = requestAnimationFrame(advance);
  };

  useEffect(() => {
    // const ctx = canvasRef.current.getContext("2d");
    // ctx.imageSmoothingEnabled = false;

    playerSpriteImage.src = playerSprite;

    nextFrame.current = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(nextFrame.current);
  }, []);

  return (
    <GameContainer onClick={() => {}}>
      <canvas
        ref={canvasRef}
        width={windowWidth}
        height={windowHeight}
      ></canvas>
    </GameContainer>
  );
};

export default App;
