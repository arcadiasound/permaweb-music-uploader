import { keyframes, styled, ComponentProps } from "@/stitches.config";
import * as Popover from "@radix-ui/react-popover";
import { forwardRef } from "react";

const slideUpAndFade = keyframes({
  "0%": { opacity: 0, transform: "translateY(2px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const slideRightAndFade = keyframes({
  "0%": { opacity: 0, transform: "translateX(-2px)" },
  "100%": { opacity: 1, transform: "translateX(0)" },
});

const slideDownAndFade = keyframes({
  "0%": { opacity: 0, transform: "translateY(-2px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const slideLeftAndFade = keyframes({
  "0%": { opacity: 0, transform: "translateX(2px)" },
  "100%": { opacity: 1, transform: "translateX(0)" },
});

export const StyledPopoverContent = styled(Popover.Content, {
  borderRadius: 4,
  padding: 20,
  width: 280,
  minWidth: 280,
  backgroundColor: "$slate2",
  boxShadow:
    "hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px",
  animationDuration: "400ms",
  animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
  willChange: "transform, opacity",
  '&[data-state="open"]': {
    '&[data-side="top"]': { animationName: slideDownAndFade },
    '&[data-side="right"]': { animationName: slideLeftAndFade },
    '&[data-side="bottom"]': { animationName: slideUpAndFade },
    '&[data-side="left"]': { animationName: slideRightAndFade },
  },
  "&:focus": {
    boxShadow: `hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px, 0 0 0 2px $colors$focus`,
  },
});

export type PopoverContentProps = ComponentProps<typeof StyledPopoverContent> &
  Popover.PortalProps;

export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ children, forceMount, container, ...props }, ref) => {
    return (
      <Popover.Portal forceMount={forceMount} container={container}>
        <StyledPopoverContent ref={ref} {...props}>
          {children}
        </StyledPopoverContent>
      </Popover.Portal>
    );
  }
);

export const PopoverArrow = styled(Popover.Arrow, {
  fill: "$slate2",
});

export const PopoverClose = styled(Popover.Close, {
  variants: {
    pos: {
      absolute: {
        position: "absolute",

        top: "$3",
        right: "$3",
      },
      relative: {
        position: "relative",

        top: 0,
        right: 0,
      },
    },
  },

  defaultVariants: {
    pos: "absolute",
  },
});

export const PopoverTrigger = Popover.PopoverTrigger;
export const PopoverRoot = Popover.Root;
