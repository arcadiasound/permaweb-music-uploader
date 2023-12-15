import { abbreviateAddress, userPreferredGateway } from "../../utils";
import {
  RxChevronDown,
  RxChevronLeft,
  RxDotFilled,
  RxPencil2,
} from "react-icons/rx";
import { BsCurrencyDollar, BsPlug } from "react-icons/bs";
import { useEffect, useRef, useState } from "react";
import { appConfig } from "../../appConfig";
import { ArAccount } from "arweave-account";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuSubContent,
  DropdownMenuSubRoot,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/ui/Dropdown";
import { Button } from "@/ui/Button";
import { Avatar, AvatarImage } from "@/ui/Avatar";
import { Flex } from "@/ui/Flex";
import { Link } from "react-router-dom";
import { styled } from "@/stitches.config";
import { useConnect } from "@/hooks/useConnect";
import { PermaProfile } from "@/types";
import { FundNodeDialog } from "../wallet/FundNodeDialog";
import { useQuery } from "@tanstack/react-query";
import { getAccount } from "@/lib/account/api";
import { useIrys } from "@/hooks/useIrys";

const StyledLink = styled(Link);

interface HeaderDropdownProps {
  walletAddress: string;
}

type DialogName = "fundNode" | "checkBalance";

interface DialogOpenProps {
  name?: DialogName;
  open: boolean;
}

export const HeaderDropdown = ({ walletAddress }: HeaderDropdownProps) => {
  const { setState } = useConnect();
  const { init: irysInitOpts, setState: setIrys } = useIrys();
  const [currentGateway, setCurrentGateway] = useState(
    userPreferredGateway || appConfig.defaultGateway
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState<DialogOpenProps>({
    open: false,
  });
  const dropdownTriggerRef = useRef<HTMLButtonElement | null>(null);

  const { data: profile, isError } = useQuery({
    queryKey: [`profile-${walletAddress}`],
    queryFn: () => {
      if (!walletAddress) {
        throw new Error("No profile has been found");
      }

      return getAccount(walletAddress, { gateway: appConfig.defaultGateway });
    },
  });

  const openDialog = (name: DialogName) => setDialogOpen({ name, open: true });
  const closeDialog = (name: DialogName) => {
    setDialogOpen({ name, open: false });
  };

  useEffect(() => {
    if (dialogOpen.open) {
      setDropdownOpen(false);
    }
  }, [dialogOpen.open]);

  const name =
    profile && profile.handle
      ? profile.handle
      : abbreviateAddress({ address: profile?.address || walletAddress });
  return (
    <>
      <DropdownMenuRoot
        modal={dropdownOpen}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
      >
        <DropdownMenuTrigger ref={dropdownTriggerRef} asChild>
          <Button
            css={{
              fontWeight: 400,
              "&:hover": {
                backgroundColor: "transparent",
                color: "$slate12",
              },
              "&:active": { backgroundColor: "transparent" },
            }}
            variant="ghost"
          >
            <Avatar size="1">
              <AvatarImage
                src={
                  profile && profile.avatar
                    ? profile.avatar
                    : `https://source.boringavatars.com/marble/40/${
                        profile?.address || walletAddress
                      }`
                }
              />
            </Avatar>
            {name}
            <RxChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent
            css={{
              minWidth: 200,
            }}
            sideOffset={8}
            collisionPadding={8}
          >
            <DropdownMenuItem asChild>
              <Flex align="center" gap="2">
                <RxPencil2 />
                Edit Profile
              </Flex>
            </DropdownMenuItem>
            <DropdownMenuSubRoot>
              <DropdownMenuSubTrigger>
                <Flex align="center" gap="2">
                  <RxChevronLeft />
                  Wallet
                </Flex>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent
                  css={{
                    minWidth: 200,
                  }}
                  sideOffset={8}
                >
                  <DropdownMenuItem onSelect={() => openDialog("fundNode")}>
                    Fund Irys node
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>choose Irys node</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={irysInitOpts?.node}
                    onValueChange={(v: any) =>
                      setIrys({ init: { node: v as "node1" | "node2" } })
                    }
                  >
                    <DropdownMenuRadioItem
                      css={{
                        height: 30,
                        color:
                          irysInitOpts?.node === "node1"
                            ? "$slate12"
                            : "$slate11",
                      }}
                      value="node1"
                    >
                      <DropdownMenuItemIndicator>
                        <RxDotFilled />
                      </DropdownMenuItemIndicator>
                      node1
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      css={{
                        height: 30,
                        color:
                          irysInitOpts?.node === "node2"
                            ? "$slate12"
                            : "$slate11",
                      }}
                      value="node2"
                    >
                      <DropdownMenuItemIndicator>
                        <RxDotFilled />
                      </DropdownMenuItemIndicator>
                      node2
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSubRoot>

            <DropdownMenuItem
              onSelect={() => {
                window.arweaveWallet.disconnect().then(() => {
                  setState({ walletAddress: "" });
                });
              }}
            >
              <Flex align="center" gap="2">
                <BsPlug />
                Disconnect
              </Flex>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>

      <FundNodeDialog
        modal={dialogOpen.name === "fundNode" && dialogOpen.open}
        open={dialogOpen.name === "fundNode" && dialogOpen.open}
        onClose={() => closeDialog("fundNode")}
        dropdownTriggerRef={dropdownTriggerRef}
      />
    </>
  );
};
