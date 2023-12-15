import * as SelectPrimitive from "@radix-ui/react-select";
import { RxCheck } from "react-icons/rx";
import { ComponentProps, styled } from "@/stitches.config";
import { Ref, forwardRef } from "react";

export const SelectTrigger = styled(SelectPrimitive.Trigger, {
  all: "unset",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "$2",
  p: "$3",
  br: "$1",
  boxShadow: "0 0 0 1px $colors$slate6",
  fontSize: "$2",

  "&:hover": { boxShadow: "0 0 0 1px $colors$slate7" },
  "&:focus": { boxShadow: "0 0 0 2px $colors$focus" },
  "&[data-placeholder]": { color: "$slate9" },

  "&:disabled": {
    pointerEvents: "none",
    opacity: 0.5,

    // targeting the Select Value
    "& span": {
      color: "$slate9",
    },

    "& svg": {
      color: "$slate9",
    },
  },

  variants: {
    size: {
      1: {
        fontSize: "$2",
        p: "$2",
      },
      2: {
        fontSize: "$3",
        p: "$3",
      },
      3: {
        fontSize: "$3",
        p: "$5",
      },
    },
  },

  defaultVariants: {
    size: "2",
  },
});

export const SelectContent = styled(SelectPrimitive.Content, {
  overflow: "hidden",
  backgroundColor: "$slate1",
  boxShadow: "0 0 0 2px $colors$slate6",
  br: "$1",
});

export const SelectViewport = styled(SelectPrimitive.Viewport, {
  padding: 5,
});

type StyledSelectItemProps = ComponentProps<typeof StyledItem>;

const StyledItem = styled(SelectPrimitive.Item, {
  fontSize: "$sm",
  lineHeight: 1,
  color: "$slate12",
  borderRadius: "$sm",
  display: "flex",
  alignItems: "center",
  py: "$2",
  px: "$5",
  position: "relative",
  userSelect: "none",
  br: "$1",

  "&[data-disabled]": {
    opacity: 0.5,
    pointerEvents: "none",
  },

  "&[data-highlighted]": {
    outline: "none",
    backgroundColor: "$blue9",
    color: "#fff",
  },
});

export const StyledItemIndicator = styled(SelectPrimitive.ItemIndicator, {
  position: "absolute",
  left: 0,
  width: 20,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
});

type SelectItemProps = ComponentProps<typeof SelectPrimitive.Item>;

export const SelectItem = forwardRef<
  HTMLDivElement,
  SelectItemProps & StyledSelectItemProps
>(({ children, ...props }, forwardedRef) => {
  return (
    //@ts-ignore
    <StyledItem {...props} ref={forwardedRef as Ref<HTMLDivElement>}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <StyledItemIndicator>
        <RxCheck />
      </StyledItemIndicator>
    </StyledItem>
  );
});

export const Select = styled(SelectPrimitive.Root);
export const SelectPortal = SelectPrimitive.Portal;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;
export const SelectIcon = styled(SelectPrimitive.Icon, { color: "$slate11" });
