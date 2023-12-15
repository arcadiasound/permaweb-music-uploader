import { styled } from "@/stitches.config";
import * as LabelPrimitive from "@radix-ui/react-label";

export const Label = styled(LabelPrimitive.Root, {
  fontSize: "$1",
  lineHeight: "$2",
  userSelect: "none",
});
