import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/ui/Dialog";
import { Flex } from "@/ui/Flex";
import { IconButton } from "@/ui/IconButton";
import { Typography } from "@/ui/Typography";
import { Box } from "@/ui/Box";
import { getArBalance } from "@/lib/arweave";
import { RxCross2, RxDotFilled, RxReload } from "react-icons/rx";
import { Controller, useFormContext } from "react-hook-form";
import { Image } from "@/ui/Image";
import { UploadSchema } from "./schema";
import { RadioGroup, RadioItem } from "@/ui/RadioGroup";
import { styled } from "@/stitches.config";
import { Label } from "@/ui/Label";
import { useEffect, useState } from "react";
import { UploadProvider } from "@/types";
import { useTurbo } from "@/hooks/useTurbo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getTurboBalance, getTurboUploadCost } from "@/lib/turbo";
import {
  abbreviateAddress,
  calculateTotalFileSize,
  formatCredits,
  formatFileSize,
} from "@/utils";
import { useConnect } from "@/hooks/useConnect";
import { Skeleton } from "@/ui/Skeleton";
import { Button } from "@/ui/Button";
import { FormHelperError } from "@/ui/Form";
import { toast } from "sonner";
import { getIrysUploadCost } from "@/lib/irys";
import BigNumber from "bignumber.js";

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

interface UploadDialogProps {
  data: UploadSchema;
  open: boolean;
  onClose: () => void;
}

export const UploadDialog = ({ open, onClose, data }: UploadDialogProps) => {
  const { walletAddress, currentProvider } = useConnect();
  // const [uploadProvider, setUploadProvider] = useState<UploadProvider>("irys");
  const { balance } = useTurbo();
  const { getValues, setValue, watch, control } =
    useFormContext<UploadSchema>();

  const uploadProvider = watch("uploadProvider");

  const totalSize = formatFileSize(calculateTotalFileSize(data));

  const turboBalance = useMutation({
    mutationFn: getTurboBalance,
    mutationKey: ["turboBalance"],
    onError: (error) => {
      console.error(error);
      // toast.error("Error getting balance");
    },
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

  const {
    data: turboUploadCost,
    isLoading: turboUploadCostLoading,
    isError: turboUploadCostError,
  } = useQuery({
    queryKey: [`turbo-cost-${walletAddress}`],
    enabled: uploadProvider === "turbo",
    queryFn: () => getTurboUploadCost(calculateTotalFileSize(data)),
  });

  const {
    data: irysUploadCost,
    isLoading: irysUploadCostLoading,
    isError: irysUploadCostError,
  } = useQuery({
    queryKey: [`irys-cost-${walletAddress}`],
    enabled: uploadProvider === "irys",
    queryFn: () => getIrysUploadCost(calculateTotalFileSize(data)),
  });

  const handleRetry = async () => {
    if (
      typeof turboBalance.error === "string" &&
      turboBalance.error.includes("signature")
    ) {
      await window.arweaveWallet
        .connect(["SIGNATURE"])
        .then(() => {
          turboBalance.mutate(currentProvider);
        })
        .catch((error) => {
          console.error(error);
          if (error.includes("User cancelled")) {
            toast.error(error);
          }
        });
    } else {
      turboBalance.mutate(currentProvider);
    }
  };

  const userNotFound =
    turboBalance.error instanceof Error &&
    turboBalance.error.message.includes("User");

  const turbo = balance?.winc || turboBalance.data?.winc;

  const hasEnoughTurbo = (
    balance: string | undefined,
    cost: string | undefined
  ) => {
    if (!balance || !cost) {
      return false;
    }

    const totalBalance = new BigNumber(balance).toNumber();
    const totalCost = new BigNumber(cost).toNumber();

    return totalBalance > totalCost;
  };

  const hasEnoughAR = arBalance && irysUploadCost && arBalance > irysUploadCost;

  useEffect(() => {
    window.addEventListener("walletSwitch", (e) => handleWalletSwitch(e));
    return window.removeEventListener("walletSwitch", handleWalletSwitch);
  }, []);

  const handleWalletSwitch = (e: CustomEvent<{ address: string }>) => {
    turboBalance.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <Flex css={{ pb: "$5" }} justify="between" align="center">
          <DialogTitle asChild>
            <Typography contrast="hi" size="4" weight="5">
              Confirm & Upload
            </Typography>
          </DialogTitle>
          <DialogClose pos="relative" asChild>
            <IconButton css={{ br: "$round" }}>
              <RxCross2 />
            </IconButton>
          </DialogClose>
        </Flex>
        <Box css={{ height: 1, backgroundColor: "$slate5", mx: "-$5" }} />
        <Flex
          css={{
            py: "$5",
          }}
          gap="5"
        >
          <Image css={{ boxSize: 80 }} src={getValues("releaseArtwork.url")} />
          <Flex direction="column" justify="between">
            <Box>
              <Typography contrast="hi">{getValues("title")}</Typography>
              <Typography size="1">
                {getValues("tracklist")?.length} track(s)
              </Typography>
            </Box>
            <Typography>Upload size: {totalSize}</Typography>
          </Flex>
        </Flex>
        <Box css={{ height: 1, backgroundColor: "$slate5", mx: "-$5" }} />
        <Flex css={{ mt: "$5" }} direction="column" gap="2">
          <Typography size="1">Upload cost:</Typography>
          {uploadProvider === "turbo" ? (
            <>
              {turboUploadCostLoading && <Skeleton />}
              {turboUploadCost && (
                <Typography size="5">
                  {formatCredits(turboUploadCost.winc, 12)} Credits
                </Typography>
              )}
              {turboUploadCostError && <Typography size="5">-</Typography>}
            </>
          ) : (
            <>
              {irysUploadCostLoading && <Skeleton />}
              {irysUploadCost && (
                <Typography size="5">{irysUploadCost.toString()} AR</Typography>
              )}
              {irysUploadCostError && <Typography size="5">-</Typography>}
            </>
          )}
        </Flex>
        <Flex css={{ mt: "$5" }} direction="column" gap="2">
          <Label>Choose a payment method:</Label>
          <Controller
            render={({ field: { onChange } }) => (
              <RadioGroup
                value={watch("uploadProvider")}
                defaultValue={getValues("uploadProvider")}
                onValueChange={(e) => onChange(e)}
                css={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: "$3",
                  width: "max-content",
                  maxWidth: "100%",

                  '&[aria-disabled="true"]': {
                    pointerEvents: "none",
                    cursor: "not-allowed",
                    opacity: "50%",
                  },
                }}
              >
                <StyledRadioItem size="box" value="irys">
                  AR
                </StyledRadioItem>
                <StyledRadioItem size="box" value="turbo">
                  Turbo
                </StyledRadioItem>
              </RadioGroup>
            )}
            name="uploadProvider"
            control={control}
          />
        </Flex>
        <Box
          css={{
            position: "relative",
            pb: "$10",
          }}
        >
          <Flex
            css={{
              mt: "$5",
              p: "$3",
              br: "$2",
              backgroundColor: "$slate2",
            }}
            direction="column"
            // gap="2"
          >
            <Flex justify="between">
              <Typography size="2">
                {uploadProvider === "irys" ? "Wallet Balance" : "Turbo credits"}
              </Typography>
              <Typography
                css={{
                  display: "inline-flex",
                  gap: "$1",
                  alignItems: "center",
                  backgroundColor: "$slate3",
                  lineHeight: "$5",
                  px: "$2",
                  br: "$1",
                  "& svg": { color: "$green11", boxSize: "$5" },
                }}
                size="1"
              >
                {abbreviateAddress({
                  address: walletAddress,
                  options: { startChars: 6, endChars: 4 },
                })}
                <RxDotFilled />
              </Typography>
            </Flex>
            {uploadProvider === "irys" ? (
              <>
                {arBalanceLoading && (
                  <Skeleton css={{ height: "$lineHeights$5", width: 100 }} />
                )}
                {arBalance && (
                  <Typography size="5" contrast="hi">
                    {arBalance.toString()} AR
                  </Typography>
                )}
              </>
            ) : (
              <>
                {balance ? (
                  <Typography size="5" contrast="hi">
                    {formatCredits(balance?.winc, 12)}
                  </Typography>
                ) : (
                  <>
                    {turboBalance.isIdle && (
                      <Button
                        size="1"
                        css={{ alignSelf: "start" }}
                        onClick={() => turboBalance.mutate(currentProvider)}
                        variant="solid"
                      >
                        Check credits
                      </Button>
                    )}
                    {balance ||
                      (turboBalance.isSuccess && (
                        <Typography size="5" contrast="hi">
                          {formatCredits(turbo, 12)}
                        </Typography>
                      ))}
                    {turboBalance.isLoading && (
                      <Skeleton
                        css={{ height: "$lineHeights$5", width: 100 }}
                      />
                    )}
                    {turboBalance.isError && !userNotFound && (
                      <Flex align="center" gap="3">
                        <FormHelperError css={{ position: "relative" }}>
                          Error occured getting turbo balance
                        </FormHelperError>
                        <Button onClick={handleRetry} size="1" variant="solid">
                          Retry
                          <RxReload />
                        </Button>
                      </Flex>
                    )}
                    {userNotFound && (
                      <Typography size="5" contrast="hi">
                        0 credits
                      </Typography>
                    )}
                  </>
                )}
              </>
            )}
          </Flex>
          {uploadProvider === "irys" && !hasEnoughAR && (
            <FormHelperError>Not enough AR</FormHelperError>
          )}
          {uploadProvider === "turbo" &&
            !hasEnoughTurbo(turbo, turboUploadCost?.winc) && (
              <Flex css={{ position: "absolute", bottom: 0 }} gap="2">
                <FormHelperError css={{ position: "relative" }}>
                  Not enough Turbo
                </FormHelperError>
                <Button onClick={handleRetry} size="1" variant="solid">
                  Retry
                  <RxReload />
                </Button>
              </Flex>
            )}
        </Box>
        <Flex justify="end">
          <DialogClose asChild pos="relative">
            <Button
              disabled={
                uploadProvider === "irys"
                  ? !hasEnoughAR
                  : !hasEnoughTurbo(turbo, turboUploadCost?.winc)
              }
              variant="solid"
              type="button"
            >
              Save
            </Button>
          </DialogClose>
        </Flex>
      </DialogContent>
    </Dialog>
  );
};
