// styling:
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";

const SIZE = 100;

const CameraViewport = styled.div`
  position: relative;

  outline: 1px solid red;
  width: ${SIZE}%;
  height: ${SIZE}%;
  min-width: ${SIZE}%;
  min-height: ${SIZE}%;
  max-width: ${SIZE}%;
  max-height: ${SIZE}%;

  overflow: hidden;

  display: flex;
  justify-content: center;
  align-items: center;
`;

const Camera = ({ children, ...props }) => {
  return <CameraViewport>{children}</CameraViewport>;
};

export default Camera;
