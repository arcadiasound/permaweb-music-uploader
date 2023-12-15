import { VariantProps, styled } from "@/stitches.config";

export type ImageDropContainerVariants = VariantProps<
  typeof ImageDropContainer
>;

export const ImageDropContainer = styled("div", {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  py: "$4",
  px: "$4",
  cursor: "pointer",
  border: "2px dashed $colors$slate6",
  position: "relative",
  backgroundSize: "contain",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center center",

  "&:hover": {
    border: "2px dashed $colors$slate7",
  },

  variants: {
    size: {
      1: {
        width: 200,
        height: 200,
        // fontSize: "$1",
        "& svg": {
          width: 40,
          height: 40,
        },
      },
      2: {
        width: 300,
        height: 300,
        // fontSize: "$2",
        "& svg": {
          width: 80,
          height: 80,
        },
      },
      3: {
        width: 400,
        height: 400,
        // fontSize: "$2",
        "& svg": {
          width: 140,
          height: 140,
        },
      },
    },
    hovered: {
      true: {
        border: "2px dashed $colors$focus",
      },
    },
    hidden: {
      true: {
        border: "none",

        "&:hover": {
          border: "none",

          "& img": {
            opacity: 0.7,
          },
        },
        "& svg": {
          display: "none",
        },
        "& p": {
          display: "none",
        },
      },
    },
  },
  compoundVariants: [
    {
      hovered: true,
      hidden: true,
      css: {
        border: "none",
        opacity: 0.7,
      },
    },
  ],

  defaultVariants: {
    size: "2",
  },
});
