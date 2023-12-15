import { styled } from "@/stitches.config";

export const Container = styled("div", {
  display: "flex",
  width: "100%",
  mx: "auto",

  "@bp3": {
    px: 0,
    maxWidth: 700,
  },
  "@bp4": {
    maxWidth: 1000,
  },
  "@bp5": {
    maxWidth: 1200,
  },
});
