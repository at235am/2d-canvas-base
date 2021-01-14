import { useLayoutEffect, useState } from "react";

const useWindowSize = () => {
  const [size, setSize] = useState({ windowHeight: 0, windowWidth: 0 });
  useLayoutEffect(() => {
    const updateSize = () =>
      setSize({
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      });
    window.addEventListener("resize", updateSize);

    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
};

export default useWindowSize;
