import { Box } from "@/ui/Box";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/ui/Dialog";
import { Flex } from "@/ui/Flex";
import { IconButton } from "@/ui/IconButton";
import { Typography } from "@/ui/Typography";
import {
  RxChevronDown,
  RxChevronUp,
  RxCross2,
  RxExclamationTriangle,
} from "react-icons/rx";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "Zod";
import { MutableRefObject, useEffect, useState } from "react";
import { FormHelperError, FormHelperText, FormRow } from "@/ui/Form";
import { Label } from "@/ui/Label";
import { TextField } from "@/ui/TextField";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useConnect } from "@/hooks/useConnect";
import { fundIrysNode, getIrysBalance } from "@/lib/irys";
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
import { Button } from "@/ui/Button";
import { toast } from "sonner";
import { getArBalance } from "@/lib/arweave";
import BigNumber from "bignumber.js";
import {
  Checkmark,
  CheckmarkContainer,
  Confetti,
  confettiIndices,
  StyledContainer,
} from "@/ui/animations/SuccessCheckmark";

const irysNodeOpts = ["node1", "node2"] as const;

const fundNodeSchema = z.object({
  fundAmount: z.coerce.number().nonnegative(),
  irysNode: z.enum(irysNodeOpts),
});

type FundNodeSchema = z.infer<typeof fundNodeSchema>;

interface FundNodeDialogProps {
  modal: boolean;
  open: boolean;
  onClose: () => void;
  dropdownTriggerRef: MutableRefObject<HTMLButtonElement | null>;
}

export const FundNodeDialog = ({
  modal,
  open,
  onClose,
  dropdownTriggerRef,
}: FundNodeDialogProps) => {
  const { walletAddress } = useConnect();
  const form = useForm<FundNodeSchema>({
    resolver: zodResolver(fundNodeSchema),
    defaultValues: {
      fundAmount: 0,
      irysNode: "node2",
    },
  });

  const { register, handleSubmit, watch, formState } = form;
  const { errors } = formState;

  const irysNode = watch("irysNode");

  const fundMutation = useMutation({
    mutationFn: fundIrysNode,
    mutationKey: [`fundNode-${irysNode}`],
    onSuccess: (data) => {
      toast.success(
        `Successfully funded ${data.quantity} ${data.token} to ${irysNode}`
      );
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(`Error funding ${irysNode}`);
    },
  });

  const onSubmit = async (data: FundNodeSchema) => {
    fundMutation.mutate({
      node: data.irysNode,
      amount: data.fundAmount,
    });
  };

  const {
    data: balance,
    isLoading: balanceLoading,
    isError: balanceError,
  } = useQuery({
    queryKey: [`balance-${irysNode}-${walletAddress}`],
    enabled: !!walletAddress,
    queryFn: () => getIrysBalance(irysNode),
  });

  const {
    data: arBalance,
    isLoading: arBalanceLoading,
    isError: arBalanceError,
  } = useQuery({
    queryKey: [`AR-balance-${walletAddress}`],
    enabled: !!walletAddress,
    queryFn: () => {
      if (!walletAddress) {
        return;
      }

      return getArBalance(walletAddress);
    },
  });

  return (
    <Dialog modal={modal} open={open} onOpenChange={onClose}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          // focus dropdown trigger for accessibility so user doesn't lose their place in the document
          dropdownTriggerRef.current?.focus();
          event.preventDefault();
        }}
        css={{
          minHeight: 450,
        }}
      >
        <Flex css={{ pb: "$5" }} justify="between" align="center">
          <DialogTitle asChild>
            <Typography contrast="hi" size="4" weight="5">
              Fund an Irys Node
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
        {fundMutation.isSuccess ? (
          <Flex direction="column" align="center" gap="5">
            <Typography contrast="hi" size="5">
              Successfully funded {irysNode} 🎉
            </Typography>
            <StyledContainer>
              {confettiIndices.map((index) => (
                <Confetti key={index} index={index as any} />
              ))}
              <Checkmark />
              <CheckmarkContainer />
            </StyledContainer>
            <Flex
              align="start"
              css={{
                backgroundColor: "$yellow3",
                p: "$3",
                br: "$1",
                color: "$yellow11",

                "& svg": {
                  width: "$7",
                  height: "$7",
                  mr: "-$2",
                },
              }}
            >
              <RxExclamationTriangle />
              <Typography
                css={{
                  color: "$yellow11",
                  maxWidth: "60ch",
                  textAlign: "center",
                }}
              >
                Important: Please note that it may take up to{" "}
                <strong>40 minutes</strong> or more until this payment is
                received.
              </Typography>
            </Flex>
            <DialogClose pos="relative" asChild>
              <Button
                onClick={() => {
                  form.reset();
                  fundMutation.reset();
                }}
                variant="solid"
              >
                Close
              </Button>
            </DialogClose>
          </Flex>
        ) : (
          <Box as="form" onSubmit={handleSubmit(onSubmit)}>
            <Flex direction="column" gap="10">
              <FormRow
                css={{
                  mt: 0,
                  pb: 0,
                }}
              >
                <Label htmlFor="irysNode">Switch Irys node</Label>
                <Controller
                  render={({ field: { onChange } }) => (
                    <Select
                      onValueChange={(e) => onChange(e)}
                      value={form.getValues("irysNode")}
                    >
                      <SelectTrigger size="1">
                        <SelectValue />
                        <SelectIcon>
                          <RxChevronDown />
                        </SelectIcon>
                      </SelectTrigger>
                      <SelectPortal>
                        <SelectContent sideOffset={8}>
                          <SelectViewport>
                            {irysNodeOpts.map((node) => (
                              <SelectItem key={node} value={node}>
                                {node}
                              </SelectItem>
                            ))}
                          </SelectViewport>
                        </SelectContent>
                      </SelectPortal>
                    </Select>
                  )}
                  name="irysNode"
                  control={form.control}
                />
              </FormRow>
              <Flex direction="column" gap="1">
                <Typography size="1">Irys {irysNode} balance:</Typography>
                {balanceError ||
                  (balanceLoading && (
                    <Typography size="5" contrast="hi">
                      -
                    </Typography>
                  ))}
                {balance && (
                  <Typography size="5" contrast="hi">
                    {balance.toString()}
                    <Box css={{ color: "$slate11" }} as="span">
                      {" "}
                      AR
                    </Box>
                  </Typography>
                )}
              </Flex>

              <FormRow
                css={{
                  my: 0,
                }}
              >
                <Flex justify="between" align="center">
                  <Label htmlFor="fundAmount">Amount to fund</Label>
                  {arBalance && (
                    <FormHelperText
                      contrast="hi"
                      css={{
                        position: "relative",
                      }}
                    >
                      {arBalance.minus(watch("fundAmount")).toString()}
                      <Box css={{ color: "$slate11" }} as="span">
                        {" "}
                        AR
                      </Box>
                    </FormHelperText>
                  )}
                </Flex>
                <TextField
                  type="number"
                  min={0}
                  step={0.01}
                  defaultValue={form.getValues("fundAmount")}
                  {...register("fundAmount")}
                />
                {arBalance &&
                  Number(arBalance.minus(watch("fundAmount"))) < 0 && (
                    <FormHelperError
                      css={{
                        width: "100%",
                        textAlign: "right",
                      }}
                    >
                      Insufficient funds
                    </FormHelperError>
                  )}
                {errors.fundAmount && (
                  <FormHelperError
                    css={{
                      width: "100%",
                      textAlign: "right",
                    }}
                  >
                    {errors.fundAmount.message}
                  </FormHelperError>
                )}
              </FormRow>
            </Flex>
            {fundMutation.isError && !fundMutation.isLoading && (
              <Box
                css={{
                  mb: "$5",
                  p: "$2",
                  br: "$1",
                  backgroundColor: "$red3",
                }}
              >
                <FormHelperError
                  css={{ position: "relative", textAlign: "center" }}
                >
                  Error funding {irysNode}. Please try again.
                </FormHelperError>
              </Box>
            )}
            <Button
              disabled={
                Number(arBalance?.minus(watch("fundAmount"))) < 0 ||
                watch("fundAmount") <= 0 ||
                fundMutation.isLoading
              }
              variant="solid"
            >
              {fundMutation.isLoading ? "Funding" : "Fund"}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
