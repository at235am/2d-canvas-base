import { atom } from "recoil";

export const characterPosition = atom({
  key: "characterPosition",
  default: { x: 0, y: 0 },
});

export const mapPosition = atom({
  key: "mapPosition",
  default: { x: 0, y: 0 },
});
