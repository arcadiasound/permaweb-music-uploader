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
  const { walletAddress, currentProvider } = useConnect();
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

  const turboQuery = useQuery({
    queryKey: [`turboBalance`],
    refetchOnWindowFocus: false,
    enabled: !!walletAddress && currentProvider === "othent",
    queryFn: () => {
      if (!walletAddress) {
        return;
      }

      return getTurboBalance(currentProvider);
    },
    onSuccess: (data) => {
      setState({ balance: data });
    },
    onError: (error) => {
      if (userNotFound) {
        setState({ balance: { winc: "0" } });
      }
    },
  });

  const turboMutation = useMutation({
    mutationFn: getTurboBalance,
    mutationKey: ["turboBalance"],
    onSuccess: (data) => {
      setState({ balance: data });
    },
    onError: (error) => {
      console.error(error);
      if (userNotFound) {
        setState({ balance: { winc: "0" } });
      }
      // toast.error("Error getting balance");
    },
  });

  const turboBalance = balance || turboQuery.data || turboMutation.data;
  const turboBalanceLoading = turboQuery.isFetching || turboMutation.isLoading;
  const turboBalanceSuccess = turboQuery.isSuccess || turboMutation.isSuccess;
  const turboBalanceIsError = turboQuery.isError || turboMutation.isError;
  const turboBalanceError = turboQuery.error || turboMutation.error;

  const handleRetry = async () => {
    if (
      typeof turboBalanceError === "string" &&
      turboBalanceError.includes("signature")
    ) {
      await window.arweaveWallet
        .connect(["SIGNATURE"])
        .then(() => {
          turboMutation.mutate(currentProvider);
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
    turboBalanceError instanceof Error &&
    turboBalanceError.message.includes("User");

  const signatureError =
    typeof turboBalanceError === "string" &&
    turboBalanceError.includes("signature");

  useEffect(() => {
    if (turboBalance) {
      turboMutation.reset();
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
            {turboBalanceLoading && (
              <Flex align="center" gap="2">
                <LoadingSpinner />
                <Typography size="2">Fetching balance...</Typography>
              </Flex>
            )}
            {turboBalanceSuccess && (
              <>
                <Typography contrast="hi">
                  {formatCredits(turboBalance?.winc)}
                  <Box css={{ color: "$slate11" }} as="span">
                    {" "}
                    Credits
                  </Box>
                </Typography>
              </>
            )}
            {turboMutation.isIdle && currentProvider !== "othent" && (
              <Button
                size="1"
                onClick={() => turboMutation.mutate(currentProvider)}
                disabled={turboBalanceLoading}
                css={{ alignSelf: "start" }}
                variant="solid"
              >
                {turboBalanceLoading ? "Fetching balance..." : "Check Credits"}
              </Button>
            )}
            {turboBalanceIsError && (
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
                      disabled={turboBalanceLoading}
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
              {turboBalanceSuccess && (
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
                    disabled={turboBalanceLoading}
                    size="1"
                    onClick={() => turboMutation.mutate(currentProvider)}
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
                    disabled={turboBalanceLoading}
                    size="1"
                    onClick={() => turboMutation.mutate(currentProvider)}
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
          balance={turboBalance}
          noCredits={userNotFound}
        />
      </PopoverContent>
    </PopoverRoot>
  );
};
