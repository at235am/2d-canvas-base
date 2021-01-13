// styling:
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";

import { motion } from "framer-motion";
import { forwardRef, useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";

import map from "../assets/map.png";
import { characterPosition, mapPosition } from "../recoil/Positions";
import { TILE_SIZE } from "../game-values/default-values";

const SIZE = TILE_SIZE;
// --------------------------------------------------------------------

const TileContainer = styled.div`
  width: ${SIZE}px;
  height: ${SIZE}px;

  /* border: 1px solid ${({ color }) => color}; */

  position: absolute;

  top: ${({ position }) => position.y}px;
  left: ${({ position }) => position.x}px;

  background-color: ${({ color }) => color};
`;

const Tile = ({ tileData, children, ...props }) => {
  const tileRef = useRef({ current: null });
  const charPos = useRecoilValue(characterPosition);
  const [collide, setCollide] = useState(false);

  useEffect(() => {
    // if (tileData.type === "solid") {
    //   const tilePos = tileRef.current.getBoundingClientRect();
    //   if (
    //     tilePos.x < charPos.x + charPos.width &&
    //     tilePos.x + tilePos.width > charPos.x &&
    //     tilePos.y < charPos.y + charPos.height &&
    //     tilePos.y + tilePos.height > charPos.y
    //   ) {
    //     // collision detected!
    //     setCollide(true);
    //   } else {
    //     setCollide(false);
    //   }
    // }
  }, [tileData.position]);

  return (
    <TileContainer
      {...props}
      collide={collide}
      position={tileData.position}
      color={tileData.color}
      ref={tileRef}
      onClick={() => {
        console.log(
          "tile",
          tileData.color,
          tileRef.current.getBoundingClientRect()
        );
      }}
    >
      {children}
    </TileContainer>
  );
};

// --------------------------------------------------------------------
const MapContainer = styled.div`
  position: absolute;
  z-index: 0;

  outline: 1px solid green;

  transform: ${({ translate }) =>
    `translate3d(${translate.x}px, ${translate.y}px, 0)`};
`;
// const MapContainer = styled(motion.div)`
//   position: absolute;
//   z-index: 0;

//   outline: 1px solid green;

// `;

const MapWrapper = styled.div`
  position: relative;
  /* border: 1px solid orange; */
  width: ${({ dimension }) => dimension.width}px;
  height: ${({ dimension }) => dimension.height}px;
`;

const TileLayer = styled.div`
  position: relative;
  z-index: 0;
`;

const PlayerLayer = styled.div``;

const Map = forwardRef(
  ({ translate = { x: 0, y: 0 }, mapData = [], children, ...props }, ref) => {
    const [mapField, setMapField] = useState(mapData);

    // const mapRef = useRef({ current: null });
    // const [map, setMap] = useRecoilState(mapPosition);

    // useEffect(() => {
    //   console.log("reseting map translate / reffd");
    //   setMap(mapRef.current.getBoundingClientRect());
    // }, [mapRef, translate]);

    // const mapRef = useRef({ current: null });
    // const [map, setMap] = useRecoilState(mapPosition);

    // useEffect(() => {
    //   console.log("reseting map translate / reffd");
    //   // setMap(mapRef.current.getBoundingClientRect());
    // }, [mapRef, translate]);

    return (
      <MapContainer ref={ref} className="map" translate={translate}>
        <MapWrapper
          dimension={{
            height: mapField.length * SIZE,
            width: mapField[0].length * SIZE,
          }}
        >
          <TileLayer>
            {mapField.map((row, i) =>
              row.map((tile, j) => (
                <Tile
                  key={`${i}-${j}`}
                  tileData={{
                    ...tile,
                    position: { x: j * SIZE, y: i * SIZE },
                  }}
                >
                  {j}-{i}
                </Tile>
              ))
            )}
          </TileLayer>

          {children}
        </MapWrapper>
      </MapContainer>
    );
  }
);
export default Map;
