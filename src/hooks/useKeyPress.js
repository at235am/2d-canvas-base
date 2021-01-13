import { useEffect, useRef, useState } from "react";

import { KEYS } from "../game-values/default-values";

const useKeyPress = (keydown, keyup) => {
  useEffect(() => {
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);

    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
    };
  }, [keydown, keyup]);
};

const useKeyMovement = () => {
  const directionsHeld = useRef([]);

  const keydown = (e) => {
    const dir = KEYS[e.key];
    // console.log("keydown", dir);

    if (dir && directionsHeld.current.indexOf(dir) === -1)
      directionsHeld.current = [dir, ...directionsHeld.current];
  };

  const keyup = (e) => {
    const dir = KEYS[e.key];
    // console.log("keyup", dir);

    const index = directionsHeld.current.indexOf(dir);
    if (index > -1)
      directionsHeld.current = [
        ...directionsHeld.current.slice(0, index),
        ...directionsHeld.current.slice(
          index + 1,
          directionsHeld.current.length
        ),
      ];
  };

  useKeyPress(keydown, keyup);

  return directionsHeld;
};
// const useKeyMovement = () => {
//   const [directionsHeld, setDirectionsHeld] = useState([]);

//   const keydown = (e) => {
//     const dir = KEYS[e.key];
//     if (dir && directionsHeld.indexOf(dir) === -1)
//       setDirectionsHeld([dir, ...directionsHeld]);
//   };

//   const keyup = (e) => {
//     const dir = KEYS[e.key];

//     const index = directionsHeld.indexOf(dir);
//     if (index > -1)
//       setDirectionsHeld([
//         ...directionsHeld.slice(0, index),
//         ...directionsHeld.slice(index + 1, directionsHeld.length),
//       ]);
//   };

//   useKeyPress(keydown, keyup);

//   return directionsHeld;
// };

export { useKeyPress, useKeyMovement };
