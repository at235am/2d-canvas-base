// styling:
import { css, jsx, keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { forwardRef, memo, useEffect, useRef } from "react";
import { useRecoilState } from "recoil";
import { characterPosition } from "../recoil/Positions";
import { TILE_SIZE } from "../game-values/default-values";

import useSound from "use-sound";
import wallHitSound from "../assets/sounds/wall-hit.wav";

// import char from "../assets/char-frames.png";
// import char from "../assets/test.png";
import char from "../assets/demorpgcharacter.png";

const SIZE = TILE_SIZE;

const MOVE_PERCENTAGES = {
  up: -50,
  down: 0,
  right: -25,
  left: -75,
};

const move = ({ facing, direction }) => keyframes`
  0%  {
    transform: ${`translate3d(-25%,${MOVE_PERCENTAGES[direction]}%,0)`};
  }
  25% {
    transform: ${`translate3d(-50%,${MOVE_PERCENTAGES[direction]}%,0)`};
  }
  50% {
    transform: ${`translate3d(-75%,${MOVE_PERCENTAGES[direction]}%,0)`};
  }
  75% { transform: ${`translate3d(0%,${MOVE_PERCENTAGES[direction]}%,0)`};}
`;

const face = ({ facing }) => css`
  transform: ${`translate3d(0, ${MOVE_PERCENTAGES[facing]}%, 0)`};
`;

const startAnimation = (props) => css`
  animation: ${move(props)} 500ms steps(1) infinite;
`;

const CharacterSam = styled.div`
  position: relative;
  z-index: 100;

  width: ${SIZE}px;
  height: ${SIZE}px;
  min-width: ${SIZE}px;
  min-height: ${SIZE}px;
  max-width: ${SIZE}px;
  max-height: ${SIZE}px;

  overflow: hidden;

  background-color: ${({ collided }) => (collided ? "red" : "transparent")};

  transform: ${({ mapPosition }) =>
    `translate3d(${mapPosition.x}px, ${mapPosition.y}px, ${0})`};

  img {
    image-rendering: pixelated;
    width: ${SIZE * 4}px;
    height: ${SIZE * 4}px;
    ${face}
    ${({ moving }) => (moving ? startAnimation : "")}
  }
`;

const Character = memo(
  forwardRef(
    (
      {
        data = {
          mapPosition: { x: 0, y: 0 },
          collided: false,
          facing: "down",
          direction: "down",
          moving: false,
        },
        ...props
      },
      ref
    ) => {
      const [playWallHit] = useSound(wallHitSound, { volume: 0.15 });

      useEffect(() => {
        if (data.collided) playWallHit();
      }, [data.collided]);

      return (
        <CharacterSam
          onClick={() => {
            console.log("CHAR moving", data.moving);
            console.log("CHAR collided", data.collided);
            console.log("CHAR facing", data.facing);
            console.log("CHAR direction", data.direction);
          }}
          ref={ref}
          facing={data.facing}
          moving={data.moving}
          direction={data.direction}
          collided={data.collided}
          mapPosition={data.mapPosition}
        >
          <img src={char} />
        </CharacterSam>
      );
    }
  ),

  // callback function for memo() to compare props passed to Character component:
  ({ data: prevData }, { data: nextData }) => {
    return (
      prevData.facing === nextData.facing &&
      prevData.moving === nextData.moving &&
      prevData.collided === nextData.collided &&
      prevData.direction === nextData.direction &&
      prevData.mapPosition.x === nextData.mapPosition.x &&
      prevData.mapPosition.y === nextData.mapPosition.y
    );
  }
);

export default Character;
