import * as React from "react";
import { PermissionType } from "arconnect";
import { RxCross1 } from "react-icons/rx";
import { useConnect } from "../../hooks/useConnect";
import { PermaProfile } from "../../types";
import { ArweaveLogo } from "./components/ArweaveLogo";
import { ArconnectLogo } from "./components/ArconnectLogo";
import { ConnectIcon } from "./components/ConnectIcon";
import { Button } from "@/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/ui/Dialog";
import { IconButton } from "@/ui/IconButton";
import { Typography } from "@/ui/Typography";
import { Flex } from "@/ui/Flex";
import { Image } from "@/ui/Image";
import { Box } from "@/ui/Box";

interface WalletServiceProps {
  name: "Arweave.app" | "Arconnect" | "Othent";
  logo: any;
}

const walletItems: WalletServiceProps[] = [
  {
    name: "Othent",
    logo: "https://othent.io/logo.svg",
  },
  {
    name: "Arconnect",
    logo: "https://arweave.net/dKJd2vi7RXG3kxaotGDLD6VZjLn58AD4xan5L9cN9es",
  },
  {
    name: "Arweave.app",
    logo: "https://arweave.net/9ENUQI5qIZDH5C9Ot7SjgRRgKwNIMETanueDKudxIRU",
  },
];

interface WalletItemProps {
  name: string | WalletServiceProps["name"];
  logo: any;
  connect: (name: string) => void;
}

const WalletItem = React.forwardRef<HTMLButtonElement, WalletItemProps>(
  ({ name, logo, connect }, ref) => {
    let bg;

    switch (name) {
      case "Arconnect":
        bg = "$violet9";
        break;
      case "Arweave.app":
        bg = "$slate12";
        break;
      case "Othent":
        bg = "$slate12";
        break;
      default:
        bg = "$slate2";
        break;
    }

    let bgHover;

    switch (name) {
      case "Arconnect":
        bgHover = "$violet10";
        break;
      case "Arweave.app":
        bgHover = "$slateSolidHover";
        break;
      case "Othent":
        bgHover = "$slateSolidHover";
        break;
      default:
        bgHover = "$slate4";
        break;
    }

    let color;

    switch (name) {
      case "Arconnect":
        color = "#fff";
        break;
      case "Arweave.app":
        color = "$slate1";
        break;
      case "Othent":
        color = "#2375ef";
        break;
      default:
        color = "$slate11";
        break;
    }

    return (
      <Button
        onClick={() => connect(name.toLowerCase())}
        variant="ghost"
        css={{
          br: "$3",
          height: "$12",
          alignItems: "center",
          gap: "$2",
          fontWeight: "$5",
          letterSpacing: "-0.4px",
          "& svg": {
            size: "$7",
            color: name === "Arconnect" ? "#fff" : "$slate1",
          },
          color: color,
          backgroundColor: bg,

          "&:hover": {
            backgroundColor: bgHover,
          },
        }}
        size="3"
        ref={ref}
      >
        {name === "Othent" ? "Sign in" : "Connect"} with {name}
        {name === "Arweave.app" && <ArweaveLogo />}
        {name === "Arconnect" && <ArconnectLogo width={20} height={20} />}
        {name === "Othent" && (
          <Flex
            align="center"
            justify="end"
            css={{
              backgroundColor: "#2375ef",
              width: 48,
              height: 24,
              br: "$pill",
            }}
          >
            <Box
              css={{
                backgroundColor: "white",
                boxSize: 22,
                mr: 1,
                br: "$pill",
              }}
            />
          </Flex>
        )}
      </Button>
    );
  }
);

interface ConnectWalletDialogProps {
  open: boolean;
  onClose: () => void;
  permissions: PermissionType[];
  profile: PermaProfile | undefined;
  appName?: string;
  providers?: {
    othent: boolean;
    arweaveApp: boolean;
    arconnect: boolean;
  };
}

export const ConnectWalletDialog = (props: ConnectWalletDialogProps) => {
  const {
    connect,
    walletAddress,
    addresses,
    completeConnection,
    setState,
    reconnect,
  } = useConnect();
  const {
    permissions,
    profile,
    appName,
    providers = { arconnect: true, arweaveApp: true, othent: true },
  } = props;

  const handleConnect = (name: string) => {
    props.onClose();
    return connect({
      appName: appName || "this app",
      walletProvider: name as "arweave.app" | "arconnect" | "othent",
      permissions,
    });
  };

  const providerName = (name: string) => {
    if (name === "Arconnect") {
      return providers?.arconnect ? "Arconnect" : "";
    }
    if (name === "Arweave.app") {
      return providers?.arweaveApp ? "Arweave.app" : "";
    }
    if (name === "Othent") {
      return providers?.othent ? "Othent" : "";
    }
  };

  return (
    <Dialog
      open={props.open}
      onOpenChange={() => {
        setState((prevValues) => ({ ...prevValues, connecting: false }));
        props.onClose();
      }}
    >
      <DialogContent
        css={{
          maxWidth: 420,
          px: "$7",
          py: "$5",
          display: "flex",
          flexDirection: "column",
          gap: "$5",
          br: "$4",
        }}
      >
        <DialogClose asChild>
          <IconButton aria-label="Close Dialog" variant="subtle" size="1">
            <RxCross1 />
          </IconButton>
        </DialogClose>
        <DialogTitle asChild>
          <Typography size="4" weight="6" contrast="hi">
            Connect a Wallet
          </Typography>
        </DialogTitle>
        <Flex
          css={{
            width: "100%",
            color: "$slate12",
          }}
          justify="center"
        >
          <ConnectIcon width={150} height={150} />
        </Flex>
        <DialogDescription asChild>
          <Typography css={{ textAlign: "center" }}>
            Choose a method to login to <br />
            <Typography as="span" weight="6" contrast="hi">
              {appName || "this app"}
            </Typography>
            :
          </Typography>
        </DialogDescription>
        {/* <Box
            css={{
              $$minusMargin: '28px',
              width: 'calc(100% + $$minusMargin * 2)',
              height: 1,
              backgroundColor: '$slate5',
              mx: '-$$minusMargin',
              position: 'relative',
            }}
          /> */}
        <Flex css={{ br: "$4", width: "100%" }} direction="column" gap="2">
          {walletItems
            .filter(
              (walletItem) => walletItem.name === providerName(walletItem.name)
            )
            .map((wallet) => (
              <>
                <DialogClose key={wallet.name} asChild>
                  <WalletItem
                    connect={handleConnect}
                    name={wallet.name}
                    logo={wallet.logo}
                  />
                </DialogClose>
                {wallet.name === "Othent" && (
                  <Typography css={{ textAlign: "center" }}>or</Typography>
                )}
              </>
            ))}
          {/* <Checkbox
              defaultChecked={reconnect}
              onCheckedChange={(e) => {
                if (e) {
                  setState((prevValues) => ({
                    ...prevValues,
                    reconnect: true,
                  }));
                } else {
                  setState((prevValues) => ({
                    ...prevValues,
                    reconnect: false,
                  }));
                }
              }}
              size="3"
              variant="outline"
              css={{
                my: "$3",
              }}
            >
              Stay connected (Arweave.app)
            </Checkbox> */}
          <Typography
            as="a"
            css={{ color: "$slate11", textAlign: "center", my: "$5" }}
            href="https://arconnect.io/"
            //   external
          >
            I don't have a wallet
          </Typography>
        </Flex>
      </DialogContent>
    </Dialog>
  );
};
