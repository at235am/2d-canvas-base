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

// import { timeHours, timer } from "d3";

import { DEFAULT_MAP } from "./maps/default-map";

import { TILE_SIZE } from "./game-values/default-values";

const GameContainer = styled.div`
  position: relative;

  background-color: gray;
  height: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
`;

const FpsCounter = styled.div`
  z-index: 200;
  position: absolute;
  top: 0;
  left: 0;
  margin: 1rem;

  background-color: white;
  padding: 0.5rem 1rem;

  span {
    font-weight: bold;

    color: ${({ fps }) => (fps > 60 ? "MediumSeaGreen" : "red")};
  }
`;

const STEP = 5;

const App = () => {
  const [mapTranslation, setMapTranslation] = useState({ x: 0, y: 0 });
  const [mapData, setMapData] = useState(DEFAULT_MAP);

  const charPos = useRef();
  const mapPos = useRef();
  const solidTiles = useRef([]);

  const requestRef = useRef();
  const previousTimeRef = useRef();
  const [fps, setFps] = useState(0);

  const directionsHeld = useKeyMovement();

  const [playerData, setPlayerData] = useState({
    mapPosition: { x: 0, y: 0 },
    collided: false,
    facing: "down",
    direction: "down",
    moving: false,
  });

  useEffect(() => {
    requestRef.current = requestAnimationFrame(move);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => {
    console.log("finding collision tiles");
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

  const moveUp = (position) => ({ ...position, y: position.y - STEP });
  const moveLeft = (position) => ({ ...position, x: position.x - STEP });
  const moveDown = (position) => ({ ...position, y: position.y + STEP });
  const moveRight = (position) => ({ ...position, x: position.x + STEP });

  const validateStep = (prev, next) => {
    // console.log("---------------------------------");
    // console.log("validateStep mapPos", mapPos);
    // console.log("validateStep charPos", charPos);
    // console.log("validateStep prev", prev);
    // console.log("validateStep next", next);

    // finding the change between next and prev (should always be the STEP)
    const deltaX = next.x - prev.x;
    const deltaY = next.y - prev.y;

    // mapRectPos represents the current map position BEFORE any changes:
    const mapRectPos = mapPos.current.getBoundingClientRect();
    const charRectPos = charPos.current.getBoundingClientRect();

    const futurePlayerPos = {
      width: charRectPos.width,
      height: charRectPos.height,
      x: charRectPos.x + deltaX,
      y: charRectPos.y + deltaY,
    };
    // console.log("current char pos", charRectPos);
    // console.log("future char pso", futurePlayerPos);

    // add on the deltas to get the future map position:
    // const mapOffsetX = mapRectPos.x + deltaX;
    // const mapOffsetY = mapRectPos.y + deltaY;

    // console.log("tiles", solidTiles.current);

    // use the future offsets to get actual positions to check for collsions:

    const collided = solidTiles.current.some((tile) => {
      tile = { ...tile, x: tile.x + mapRectPos.x, y: tile.y + mapRectPos.y };
      // console.log("collide tile", tile);
      return (
        tile.x < futurePlayerPos.x + futurePlayerPos.width &&
        tile.x + tile.width > futurePlayerPos.x &&
        tile.y < futurePlayerPos.y + futurePlayerPos.height &&
        tile.y + tile.height > futurePlayerPos.y
      );
    });

    // console.log("play", playWallHit);
    // if (collided) playWallHit();

    // setCollided(collided);
    // setCharMoving(!collided);
    // console.log("collided", collided);
    // console.log("---------------------------------");

    return {
      newMapPosition: collided ? prev : next,
      collided: collided,
    };

    // if (collided) return {newprev};
    // else return {next};
  };

  const move = (time) => {
    const secondsPassed = (time - previousTimeRef.current) / 1000;
    const currentFps = Math.round(1 / secondsPassed);

    setFps(currentFps);

    const heldDirection = directionsHeld.current[0];

    const _setPlayerData = (directionFunction) => {
      setPlayerData((prev) => {
        const { newMapPosition, collided } = validateStep(
          prev.mapPosition,
          directionFunction(prev.mapPosition)
        );
        return {
          ...prev,
          direction: directionsHeld.current[0],
          moving: heldDirection ? true : false,
          mapPosition: newMapPosition,
          collided: collided,
        };
      });
    };

    if (heldDirection === DIRECTIONS.up) _setPlayerData(moveUp);
    else if (heldDirection === DIRECTIONS.left) _setPlayerData(moveLeft);
    else if (heldDirection === DIRECTIONS.down) _setPlayerData(moveDown);
    else if (heldDirection === DIRECTIONS.right) _setPlayerData(moveRight);
    else
      setPlayerData((prev) => ({
        ...prev,
        moving: false,
        facing: prev.direction,
      }));

    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(move);
  };

  return (
    <GameContainer
      onClick={() => {
        console.log("----------------------------------");
        console.log("CHAR POS", charPos.current.getBoundingClientRect());
        console.log("MAP POS", mapPos.current.getBoundingClientRect());
        console.log("MAP TRANSLATION", mapTranslation);
        console.log("APP moving", directionsHeld.length !== 0);
        // console.log("APP charMoving", charMoving);
        console.log("APP directionsHeld", directionsHeld);
        console.log("----------------------------------");
      }}
    >
      <FpsCounter fps={fps}>
        FPS: <span>{fps}</span>
      </FpsCounter>
      <Camera>
        <Map ref={mapPos} mapData={mapData} translate={mapTranslation}>
          <Character
            ref={charPos}
            data={playerData}
            // collided={collided}
            // facing={lastDirection}
            // moving={charMoving}
            // direction={directionsHeld[0]}
            // mapPosition={playerTranslation}
          />
        </Map>
      </Camera>
    </GameContainer>
  );
};

export default App;
