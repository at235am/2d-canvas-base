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

    /* cursor: none; */
  }
`;

const App = () => {
  const [mapData, setMapData] = useState(DEFAULT_MAP);
  const { windowWidth, windowHeight } = useWindowSize();

  const canvasRef = useRef();
  const nextFrame = useRef();
  const prevFrame = useRef();
  const fps = useRef(0);

  const fpsInterval = useRef(0);
  const startTime = useRef(0);
  const now = useRef(0);
  const then = useRef(0);
  const elapsed = useRef(0);

  // game state:
  const directionsHeld = useKeyMovement();
  const solidTiles = useRef();
  const playerData = useRef({
    spriteImg: new Image(),
    x: 0,
    y: 0,
    width: TILE_SIZE,
    height: TILE_SIZE,
    collided: false,
    moving: false,
    // hitboxX & hitboxY represent OFFSETS relative to x, y
    hitboxX: TILE_SIZE / 2 - 24,
    hitboxY: TILE_SIZE / 2 - 12,
    hitboxWidth: 48,
    hitboxHeight: 68,

    // sprite animation frame
    spriteFrameX: 0,
    spriteFrameY: 0,
    spriteAnimationStep: 100, // in ms
    spriteLastUpdateTime: 0, // in ms
  });

  const cursor = useRef({ x: 0, y: 0 });
  const camera = useRef({ x: 0, y: 0 });
  const rotation = useRef(0);

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
    camera.current = { x: camX, y: camY };
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
      x: playerData.current.x + playerData.current.hitboxX + deltaX,
      y: playerData.current.y + playerData.current.hitboxY + deltaY,
      width: playerData.current.hitboxWidth,
      height: playerData.current.hitboxHeight,
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

  const step = () => STEP * (now.current - then.current);

  const moveUp = (player) => ({
    ...player,
    y: player.y - step(),
  });
  const moveLeft = (player) => ({
    ...player,
    x: player.x - step(),
  });
  const moveDown = (player) => ({
    ...player,
    y: player.y + step(),
  });
  const moveRight = (player) => ({
    ...player,
    x: player.x + step(),
  });

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
        moving: true,
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
    else
      playerData.current = {
        ...playerData.current,
        moving: false,
        spriteFrameX: 0, // reset frame sprite back to its origin position
      };

    const timeInSeconds = now.current * 0.001;
    const elapsedTimeInSeconds = timeInSeconds - then.current * 0.001;
  };

  const advanceSpriteAnimation = () => {
    const timeSinceLastSpriteUpdate =
      now.current - playerData.current.spriteLastUpdateTime;
    if (timeSinceLastSpriteUpdate < playerData.current.spriteAnimationStep)
      return;

    const heldDirection = directionsHeld.current[0] || ""; // "" is to avoid undefined key

    const directionFrame = {
      [DIRECTIONS.down]: 0,
      [DIRECTIONS.right]: 1,
      [DIRECTIONS.up]: 2,
      [DIRECTIONS.left]: 3,
    };
    if (playerData.current.moving)
      playerData.current = {
        ...playerData.current,
        spriteFrameX: (playerData.current.spriteFrameX + 1) % 4,
        spriteFrameY: directionFrame[heldDirection],
        spriteLastUpdateTime: now.current,
      };
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

    const paintX = canvas.width - 60;

    ctx.fillText(fps.current, paintX, 30);
  };

  const drawPlayerState = (ctx, canvas) => {
    ctx.font = "12px Arial";
    ctx.fillStyle = "green";

    const player = playerData.current;
    const dataKeys = Object.keys(player);

    dataKeys.forEach((item, i) =>
      ctx.fillText(`${item}: ${player[item]}`, 10, 15 * (i + 1))
    );

    // const canvasPosition = canvas.getBoundingClientRect();

    // ctx.fillText(
    //   `(x,y): ${canvasPosition.x}, ${canvasPosition.y}`,
    //   10,
    //   canvas.height - 40
    // );
  };

  const drawPlayer = (ctx, canvas) => {
    const player = playerData.current;
    ctx.imageSmoothingEnabled = false; // pixelizes images for scaling purposes:

    if (player.collided) ctx.fillStyle = "red";
    else ctx.fillStyle = "transparent";

    // draw player position:
    // ctx.fillStyle = "pink";
    // ctx.fillRect(player.x, player.y, player.width, player.height);

    // draw player hitbox:
    // ctx.fillStyle = "red";
    // ctx.fillRect(
    //   player.x + player.hitboxX,
    //   player.y + player.hitboxY,
    //   player.hitboxWidth,
    //   player.hitboxHeight
    // );

    // draw sprite unchanged:
    // ctx.drawImage(
    //   player.spriteImg,
    //   player.x + player.width,
    //   player.y + player.height
    // );

    const destinationData = [player.x, player.y, player.width, player.height];

    const cropWidth = player.width / 4;
    const cropHeight = player.height / 4;

    // draw player sprite:
    ctx.drawImage(
      player.spriteImg,
      player.spriteFrameX * cropWidth,
      player.spriteFrameY * cropHeight,
      cropWidth,
      cropHeight,
      ...destinationData
    );
  };

  const drawCharacterAim = (ctx, canvas) => {
    const player = playerData.current;

    ctx.fillStyle = "green";

    // ctx.fillRect(player.x, player.y, 50, 50);

    // console.log(cursor, cursor);
    // console.log("cursor inside", cursor.current.x, cursor.current.y);

    // ctx.lineTo(player.x + 30, player.y + 30);
    const c = 1000;

    // ctx.beginPath();
    // ctx.moveTo(player.x + player.width / 2, player.y + player.height / 2);
    // ctx.lineTo(cursor.current.x, cursor.current.y);
    // ctx.lineWidth = 15;
    // ctx.stroke();

    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2 + 20;

    // ctx.save();
    // ctx.translate(cx, cy);
    // ctx.rotate(rotation.current + Math.PI);
    // ctx.fillRect(0, 80, 20, 20);
    // ctx.restore();

    // ctx.save();
    // ctx.translate(cx, cy);
    // ctx.rotate(rotation.current);
    // ctx.fillRect(0, 80, 20, 20);
    // ctx.restore();

    const X = cursor.current.x - cx - camera.current.x;
    const Y = cursor.current.y - cy - camera.current.y;

    let angle = Math.atan(Y / X);
    if (X < 0) angle += Math.PI;

    ctx.save();
    ctx.translate(cx, cy);
    // ctx.fillRect(0, 0, 20, 20);

    // ctx.rotate(rotation.current);
    ctx.rotate(angle);
    // ctx.rotate(Math.PI / 3);
    // ctx.rotate(0);
    ctx.fillStyle = "#008af9";

    ctx.fillRect(50, 0, 1500, 2);
    ctx.restore();

    ctx.font = "12px Arial";

    ctx.fillText(
      `(cx,cy): ${cursor.current.x}, ${cursor.current.y}`,
      10,
      canvas.height - 60
    );

    ctx.fillText(
      `angle: ${angle} ${(angle * 180) / Math.PI}`,
      10,
      canvas.height - 30
    );

    ctx.fillText(`(CX, CY): ${X} ${Y}`, 10, canvas.height - 0);
    // rotation.current += Math.PI / 180;
  };

  /////////////////////////////////////////////////////////////////////////////
  // ENCAPSULATOR:
  /////////////////////////////////////////////////////////////////////////////

  const update = () => {
    move();
    advanceSpriteAnimation();
  };

  const advance = (time) => {
    now.current = time;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const timePassed = (now.current - then.current) / 1000;
    fps.current = Math.round(1 / timePassed); // current fps

    update();

    // drawings at depend on the camera panning go here:
    panCam(ctx, canvas);
    drawMap(ctx, canvas);
    drawCharacterAim(ctx, canvas);
    drawPlayer(ctx, canvas);

    // absolutely positioned drawings must be called after resetCam();
    resetCam(ctx);
    drawFps(ctx, canvas);
    drawPlayerState(ctx, canvas);

    // update time:
    then.current = now.current;

    // update frame references:
    prevFrame.current = nextFrame.current;
    nextFrame.current = requestAnimationFrame(advance);
  };

  useEffect(() => {
    // load imgs here:
    playerData.current.spriteImg.src = playerSprite;

    nextFrame.current = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(nextFrame.current);
  }, []);

  return (
    <GameContainer onClick={() => {}}>
      <canvas
        ref={canvasRef}
        width={windowWidth}
        height={windowHeight}
        onClick={(e) => {
          console.log("canvas", e.offsetX);
        }}
        onMouseMove={(e) => {
          // canvasRef.current.getBoundingClientRect();
          cursor.current = { ...cursor.current, x: e.clientX, y: e.clientY };
          // console.log("canvas move", cursor.current);
        }}
      ></canvas>
    </GameContainer>
  );
};

export default App;
