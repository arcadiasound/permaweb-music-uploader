import { Button } from "@/ui/Button";
import {
  PopoverClose,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
} from "@/ui/Popover";
import { RxChevronDown, RxCross2, RxReload } from "react-icons/rx";
import { ArweaveLogo } from "./components/ArweaveLogo";
import { useConnect } from "@/hooks/useConnect";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getArBalance } from "@/lib/arweave";
import { getTurboBalance } from "@/lib/turbo";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Flex } from "@/ui/Flex";
import { Typography } from "@/ui/Typography";
import { Box } from "@/ui/Box";
import { LoadingSpinner } from "@/ui/Loader";
import { IconButton } from "@/ui/IconButton";
import { TurboDialog } from "./TurboDialog";
import { useTurbo } from "@/hooks/useTurbo";
import { formatCredits } from "@/utils";

export const CheckBalances = () => {
  const { walletAddress } = useConnect();
  const [showTurboDialog, setShowTurboDialog] = useState(false);
  const { balance, setState } = useTurbo();

  const handleShowTurboDialog = () => setShowTurboDialog(true);
  const handleCancelTurboDialog = () => setShowTurboDialog(false);

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

  const turboBalance = useMutation({
    mutationFn: getTurboBalance,
    mutationKey: ["turboBalance"],
    onSuccess: (data) => {
      setState({ balance: data?.winc });
    },
    onError: (error) => {
      console.error(error);
      // toast.error("Error getting balance");
    },
  });

  const handleRetry = async () => {
    if (
      typeof turboBalance.error === "string" &&
      turboBalance.error.includes("signature")
    ) {
      await window.arweaveWallet
        .connect(["SIGNATURE"])
        .then(() => {
          turboBalance.mutate();
        })
        .catch((error) => {
          console.error(error);
          if (error.includes("User cancelled")) {
            toast.error(error);
          }
        });
    }
  };

  const userNotFound =
    turboBalance.error instanceof Error &&
    turboBalance.error.message.includes("User");

  const signatureError =
    typeof turboBalance.error === "string" &&
    turboBalance.error.includes("signature");

  useEffect(() => {
    if (turboBalance) {
      turboBalance.reset();
    }
  }, [walletAddress]);

  return (
    <PopoverRoot>
      <PopoverTrigger asChild>
        <Button
          css={{
            "& svg": { boxSize: 15 },
            "&:hover": {
              backgroundColor: "transparent",
              color: "$slate12",
            },
          }}
          variant="ghost"
        >
          {arBalance ? arBalance.toFixed(2).toString() : "-"}
          <ArweaveLogo />
          <RxChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Flex direction="column" gap="10">
          <Flex direction="column" gap="1">
            <Typography size="1">AR balance:</Typography>
            {arBalanceError ||
              (arBalanceLoading && (
                <Typography size="5" contrast="hi">
                  -
                </Typography>
              ))}
            {arBalance && (
              <Typography contrast="hi">
                {arBalance.toString()}
                <Box css={{ color: "$slate11" }} as="span">
                  {" "}
                  AR
                </Box>
              </Typography>
            )}
          </Flex>

          <Flex direction="column" gap="3">
            <Typography size="1">Turbo credits:</Typography>
            {turboBalance.isLoading && (
              <Flex align="center" gap="2">
                <LoadingSpinner />
                <Typography size="2">Fetching balance...</Typography>
              </Flex>
            )}
            {turboBalance.isSuccess && (
              <>
                <Typography contrast="hi">
                  {formatCredits(turboBalance.data?.winc)}
                  <Box css={{ color: "$slate11" }} as="span">
                    {" "}
                    Credits
                  </Box>
                </Typography>
              </>
            )}
            {turboBalance.isIdle && (
              <Button
                size="1"
                onClick={() => turboBalance.mutate()}
                disabled={turboBalance.isLoading}
                css={{ alignSelf: "start" }}
                variant="solid"
              >
                {turboBalance.isLoading
                  ? "Fetching balance..."
                  : "Check Credits"}
              </Button>
            )}
            {turboBalance.isError && (
              <>
                {userNotFound ? (
                  <Typography contrast="hi">
                    0
                    <Box css={{ color: "$slate11" }} as="span">
                      {" "}
                      Credits
                    </Box>
                  </Typography>
                ) : (
                  <Flex
                    align={signatureError ? "start" : "center"}
                    gap="2"
                    direction={signatureError ? "column" : "row"}
                  >
                    <Typography size="2" css={{ color: "$red11" }}>
                      {signatureError
                        ? "Signature permission is required."
                        : "Error occurred getting balance."}
                    </Typography>
                    <Button
                      onClick={handleRetry}
                      disabled={turboBalance.isLoading}
                      size="1"
                      variant="solid"
                    >
                      <RxReload />
                      {signatureError ? "Enable permission and retry" : "Retry"}
                    </Button>
                  </Flex>
                )}
              </>
            )}
            <>
              {turboBalance.isSuccess && (
                <Flex gap="2">
                  <Button
                    onClick={handleShowTurboDialog}
                    variant="solid"
                    css={{
                      alignSelf: "start",
                    }}
                    size="1"
                  >
                    Purchase turbo credits
                  </Button>
                  <IconButton
                    title="Refresh balance"
                    disabled={turboBalance.isLoading}
                    size="1"
                    onClick={() => turboBalance.mutate()}
                    aria-label="Refresh credits"
                  >
                    <RxReload />
                  </IconButton>
                </Flex>
              )}
              {userNotFound && (
                <Flex gap="2">
                  <Button
                    onClick={handleShowTurboDialog}
                    variant="solid"
                    css={{
                      alignSelf: "start",
                    }}
                    size="1"
                  >
                    Purchase turbo credits
                  </Button>
                  <IconButton
                    title="Refresh balance"
                    disabled={turboBalance.isLoading}
                    size="1"
                    onClick={() => turboBalance.mutate()}
                    aria-label="Refresh credits"
                  >
                    <RxReload />
                  </IconButton>
                </Flex>
              )}
            </>
          </Flex>
        </Flex>
        <PopoverClose asChild>
          <IconButton size="1" css={{ br: "$round" }}>
            <RxCross2 />
          </IconButton>
        </PopoverClose>

        <TurboDialog
          open={showTurboDialog && !!walletAddress}
          onClose={handleCancelTurboDialog}
          balance={turboBalance.data}
          noCredits={userNotFound}
        />
      </PopoverContent>
    </PopoverRoot>
  );
};
