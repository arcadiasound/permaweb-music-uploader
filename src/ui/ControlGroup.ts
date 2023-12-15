import { styled } from "@/stitches.config";
import { Button } from "./Button";
import { Select, SelectTrigger } from "./Select";
import { TextField } from "./TextField";

export const ControlGroup = styled("div", {
  display: "flex",

  // Make sure ControlGroup and its children don't affect normal stacking order
  position: "relative",
  zIndex: 0,

  [`& ${Button}`]: {
    borderRadius: 0,
    boxShadow:
      "inset 0 1px $colors$slate6, inset -1px 0 $colors$slate6, inset 0 -1px $colors$slate6",
    "&:hover": {
      boxShadow:
        "-1px 0 $colors$slate7, inset 0 1px $colors$slate7, inset -1px 0 $colors$slate7, inset 0 -1px $colors$slate7",
    },
    "&:focus": {
      zIndex: 1,
      boxShadow: "inset 0 0 0 1px $colors$slate7, 0 0 0 1px $colors$slate7",
    },
    "&:first-child": {
      borderTopLeftRadius: "$2",
      borderBottomLeftRadius: "$2",
      boxShadow: "inset 0 0 0 1px $colors$slate6",
      "&:hover": {
        boxShadow: "inset 0 0 0 1px $colors$slate7",
      },
      "&:focus": {
        boxShadow: "inset 0 0 0 1px $colors$slate7, 0 0 0 1px $colors$slate7",
      },
    },
    "&:last-child": {
      borderTopRightRadius: "$2",
      borderBottomRightRadius: "$2",
      boxShadow:
        "inset 0 1px $colors$slate6, inset -1px 0 $colors$slate6, inset 0 -1px $colors$slate6",
      "&:focus": {
        boxShadow: "inset 0 0 0 1px $colors$slate7, 0 0 0 1px $colors$slate7",
      },
    },
  },
  [`& ${TextField}`]: {
    borderRadius: 0,
    boxShadow:
      "inset 0 1px $colors$slate6, inset -1px 0 $colors$slate6, inset 0 -1px $colors$slate6",
    "&:focus": {
      zIndex: 1,
      boxShadow:
        "inset 0px 0px 0px 1px $colors$focus, 0px 0px 0px 1px $colors$focus",
    },
    "&:first-child": {
      borderTopLeftRadius: "$2",
      borderBottomLeftRadius: "$2",
      boxShadow: "inset 0 0 0 1px $colors$slate6",
      "&:focus": {
        boxShadow:
          "inset 0px 0px 0px 1px $colors$focus, 0px 0px 0px 1px $colors$focus",
      },
    },
    "&:last-child": {
      borderTopRightRadius: "$2",
      borderBottomRightRadius: "$2",
      boxShadow:
        "inset 0 1px $colors$slate6, inset -1px 0 $colors$slate6, inset 0 -1px $colors$slate6",
      "&:focus": {
        boxShadow:
          "inset 0px 0px 0px 1px $colors$focus, 0px 0px 0px 1px $colors$focus",
      },
    },
  },

  variants: {
    isSelect: {
      true: {
        "& button": {
          borderRadius: 0,
          borderTopRightRadius: "$2",
          borderBottomRightRadius: "$2",
          boxShadow:
            "inset 0 1px $colors$slate6, inset -1px 0 $colors$slate6, inset 0 -1px $colors$slate6",
          "&:focus-within": {
            boxShadow:
              "inset 0px 0px 0px 1px $colors$focus, 0px 0px 0px 1px $colors$focus",
          },
        },
      },
    },
  },
});
