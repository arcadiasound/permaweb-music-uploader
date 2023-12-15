import { styled } from "@/stitches.config";
import * as ProgressPrimitive from "@radix-ui/react-progress";

export const Progress = styled(ProgressPrimitive.Root, {
  position: "relative",
  overflow: "hidden",
  backgroundColor: "$slate3",
  width: "100%",
  height: "$1",

  // Fix overflow clipping in Safari
  // https://gist.github.com/domske/b66047671c780a238b51c51ffde8d3a0
  transform: "translateZ(0)",
});

export const ProgressIndicator = styled(ProgressPrimitive.Indicator, {
  width: "100%",
  height: "100%",
  transition: "transform 660ms cubic-bezier(0.65, 0, 0.35, 1)",
});
