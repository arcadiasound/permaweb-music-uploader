import { Button } from "@/ui/Button";
import { Flex } from "@/ui/Flex";
import { HeaderDropdown } from "./HeaderDropdown";
import { ConnectWallet } from "../wallet/ConnectWallet";
import { useConnect } from "@/hooks/useConnect";
import { CheckBalances } from "../wallet/CheckBalances";
import { LoadingSpinner } from "@/ui/Loader";

export const AppHeader = () => {
  const { walletAddress, connecting } = useConnect();

  return (
    <Flex
      as="header"
      css={{
        width: "100%",
        display: "flex",
        py: "$3",
        px: "$10",
      }}
      justify="end"
      align="center"
    >
      <Flex align="center" justify="end" gap="2">
        {walletAddress && <CheckBalances />}
        {walletAddress ? (
          <HeaderDropdown walletAddress={walletAddress} />
        ) : (
          <ConnectWallet
            permissions={[
              "ACCESS_ADDRESS",
              "DISPATCH",
              "SIGN_TRANSACTION",
              "ACCESS_ARWEAVE_CONFIG",
              "ACCESS_PUBLIC_KEY",
              "SIGNATURE",
            ]}
            options={{
              connectButtonVariant: "ghost",
              connectButtonLabel: "connect wallet",
              connectButtonStyles: {
                "&:hover": {
                  backgroundColor: "transparent",
                  color: "$slate12",
                },
              },
            }}
            providers={{
              othent: true,
              arconnect: true,
              arweaveApp: false,
            }}
            appName="Permaweb Music Uploader"
          >
            <Button
              disabled={connecting}
              css={{
                fontWeight: 400,
                fontSize: "$3",
                gap: "$1",
              }}
              variant="transparent"
            >
              {connecting && <LoadingSpinner />}
              {connecting ? "connecting..." : "connect / sign in"}
            </Button>
          </ConnectWallet>
        )}
      </Flex>
    </Flex>
  );
};
