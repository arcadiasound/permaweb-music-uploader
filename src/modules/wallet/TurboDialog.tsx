import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/ui/Dialog";
import { Flex } from "@/ui/Flex";
import { IconButton } from "@/ui/IconButton";
import { Typography } from "@/ui/Typography";
import { Box } from "@/ui/Box";
import { getArBalance } from "@/lib/arweave";
import { useEffect } from "react";
import { RxCheck, RxChevronDown, RxCross2 } from "react-icons/rx";
import { useConnect } from "@/hooks/useConnect";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCheckoutSession,
  getSupportedCurrencies,
  getTurboBalance,
} from "@/lib/turbo";
import { BigNumber } from "bignumber.js";
import { FormHelperError, FormRow } from "@/ui/Form";
import { Label } from "@/ui/Label";
import { RadioGroup, RadioItem } from "@/ui/RadioGroup";
import { styled } from "@/stitches.config";
import { TextField } from "@/ui/TextField";
import { Button } from "@/ui/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "Zod";
import { Controller, useForm } from "react-hook-form";
import { BsBasket, BsCart2 } from "react-icons/bs";
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectPortal,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from "@/ui/Select";

const StyledRadioItem = styled(RadioItem, {
  variants: {
    size: {
      box: {
        br: "$1",
        display: "grid",
        placeItems: "center",
        fontSize: "$2",
        lineHeight: "$sizes$9",
        px: "$7",
        gap: "$2",

        '&[aria-checked="true"]': {
          backgroundColor: "$slate12",
          color: "$slate1",
          boxShadow: "none",
        },
      },
    },
  },
});

interface TurboDialogProps {
  balance:
    | {
        winc: string;
      }
    | undefined;
  noCredits: boolean;
  open: boolean;
  onClose: () => void;
}

export const TurboDialog = ({
  open,
  onClose,
  balance,
  noCredits,
}: TurboDialogProps) => {
  const { walletAddress } = useConnect();

  const currencyOpts = [
    "aud",
    "brl",
    "cad",
    "eur",
    "gbp",
    "hkd",
    "inr",
    "jpy",
    "sgd",
    "usd",
  ] as const;

  const turboSchema = z
    .object({
      currency: z.enum(currencyOpts),
      topUpAmount: z.coerce.number().optional(),
      fixedTopUpAmount: z.coerce.number().optional(),
    })
    .superRefine(({ topUpAmount, fixedTopUpAmount }, refinementContext) => {
      if (!topUpAmount && !fixedTopUpAmount) {
        return refinementContext.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select or enter a top up amount",
          path: ["topUpAmount"],
        });
      }
      if (!topUpAmount && !fixedTopUpAmount) {
        return refinementContext.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select or enter a top up amount",
          path: ["fixedTopUpAmount"],
        });
      }
      if (topUpAmount && topUpAmount < 5) {
        return refinementContext.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Top up amount must at least be 5",
          path: ["topUpAmount"],
        });
      }
    });

  type TurboSchema = z.infer<typeof turboSchema>;

  const { data: currencies, isError: currenciesError } = useQuery({
    queryKey: ["supportedCurrencies"],
    refetchOnWindowFocus: false,
    queryFn: getSupportedCurrencies,
  });

  const form = useForm<TurboSchema>({
    resolver: zodResolver(turboSchema),
    defaultValues: {
      currency: "usd",
    },
  });

  const { register, handleSubmit, watch, formState, getValues } = form;
  const { errors } = formState;

  const onSubmit = async (data: TurboSchema) => {
    try {
      const result = turboSchema.parse(getValues());
      console.log(result);
    } catch (error) {
      console.error(error);
    }

    console.log(walletAddress);
    // run mutation to get checkout url?
    checkoutMutation.mutate({
      address: walletAddress,
      amount: data.topUpAmount || data.fixedTopUpAmount,
      currency: data.currency,
    });

    // programmatically navigate to stripe checkout
    console.log(data);
  };

  const checkoutMutation = useMutation({
    mutationFn: createCheckoutSession,
    mutationKey: [`checkout-${walletAddress}`],
    onError: (error: any) => {
      console.error(error);
      toast.error(`Error occurred creating checkout session`);
    },
  });

  const formatCredits = (winc: string | undefined) => {
    if (!winc) {
      return;
    }
    const credits = new BigNumber(winc);

    const formattedCredits = credits.dividedBy(1e12).toFixed(4);

    return formattedCredits;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <Flex css={{ pb: "$5" }} justify="between" align="center">
          <DialogTitle asChild>
            <Typography contrast="hi" size="4" weight="5">
              Buy Turbo Credits
            </Typography>
          </DialogTitle>
          <DialogClose pos="relative" asChild>
            <IconButton css={{ br: "$round" }}>
              <RxCross2 />
            </IconButton>
          </DialogClose>
        </Flex>
        <Box
          css={{ height: 1, backgroundColor: "$slate5", mb: "$5", mx: "-$5" }}
        />
        <Flex
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          direction="column"
          gap="10"
        >
          <Flex justify="between">
            <Flex gap="10">
              <Flex direction="column" gap="1">
                <Typography size="1">Balance</Typography>
                <Typography size="5" contrast="hi">
                  {balance &&
                    typeof balance === "object" &&
                    formatCredits(balance.winc)}
                  {noCredits && "0"} Credits
                </Typography>
              </Flex>
              {/* <Flex direction="column" gap="1">
              <Typography size="1">Estimated storage</Typography>
              <Typography size="5" contrast="hi">
                {balance || "-"}
              </Typography>
            </Flex> */}
            </Flex>
            {currencies && (
              <FormRow css={{ mt: 0 }}>
                <Label>Currency</Label>
                <Controller
                  render={({ field: { onChange } }) => (
                    <Select
                      onValueChange={(e) => onChange(e)}
                      value={form.getValues("currency")}
                    >
                      <SelectTrigger
                        css={{ textTransform: "uppercase" }}
                        size="1"
                      >
                        <SelectValue />
                        <SelectIcon>
                          <RxChevronDown />
                        </SelectIcon>
                      </SelectTrigger>
                      <SelectPortal>
                        <SelectContent sideOffset={8}>
                          <SelectViewport>
                            {currencyOpts.map((currency) => (
                              <SelectItem
                                css={{
                                  textTransform: "uppercase",
                                }}
                                key={currency}
                                value={currency}
                              >
                                {currency}
                              </SelectItem>
                            ))}
                          </SelectViewport>
                        </SelectContent>
                      </SelectPortal>
                    </Select>
                  )}
                  name="currency"
                  control={form.control}
                />
              </FormRow>
            )}
          </Flex>

          <Flex direction="column">
            <FormRow
              css={{
                "& span:last-child": {
                  color: "$slate11",
                },
              }}
            >
              <Label>
                Choose amount to top up
                <Box as="span"> - (min $5, max $10,000)</Box>
              </Label>
              <Controller
                render={({ field: { onChange } }) => (
                  <RadioGroup
                    onValueChange={(e) => onChange(Number(e))}
                    aria-disabled={form.watch("topUpAmount") ? "true" : "false"}
                    css={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      gap: "$5",
                      width: "max-content",
                      maxWidth: "100%",

                      '&[aria-disabled="true"]': {
                        pointerEvents: "none",
                        cursor: "not-allowed",
                        opacity: "50%",
                      },
                    }}
                  >
                    <StyledRadioItem size="box" value="5">
                      5
                    </StyledRadioItem>
                    <StyledRadioItem size="box" value="10">
                      10
                    </StyledRadioItem>
                    <StyledRadioItem size="box" value="15">
                      15
                    </StyledRadioItem>
                    <StyledRadioItem size="box" value="20">
                      20
                    </StyledRadioItem>
                  </RadioGroup>
                )}
                name="fixedTopUpAmount"
                control={form.control}
              />
            </FormRow>
            <FormRow>
              <Label>Enter custom amount</Label>
              <TextField
                size="3"
                type="number"
                min={5}
                max={10000}
                {...register("topUpAmount")}
              />
              {errors.topUpAmount && (
                <FormHelperError>{errors.topUpAmount.message}</FormHelperError>
              )}
            </FormRow>
            <Flex css={{ mt: "$5" }} gap="3" justify="end">
              <DialogClose type="button" asChild pos="relative">
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              {checkoutMutation?.data?.paymentSession?.url ? (
                <Button
                  css={{
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    form.reset();
                    checkoutMutation.reset();
                    onClose();
                  }}
                  as="a"
                  href={checkoutMutation.data.paymentSession.url}
                  target="_blank"
                  rel="noreferrer"
                  variant="solid"
                >
                  <RxCheck />
                  Confirm and checkout
                  <BsCart2 />
                </Button>
              ) : (
                <Button
                  disabled={checkoutMutation.isLoading}
                  type="submit"
                  variant="solid"
                >
                  Go to checkout
                  <BsCart2 />
                </Button>
              )}
            </Flex>
          </Flex>
        </Flex>
      </DialogContent>
    </Dialog>
  );
};
