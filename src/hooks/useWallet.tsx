import { PermissionType } from "arconnect";
import { useEffect, useState } from "react";

export const useWallet = () => {
  const [walletAddress, setWalletAddress] = useState<string>();

  function checkPermissions(arr: PermissionType[], values: PermissionType[]) {
    return values.every((value) => {
      return arr.includes(value);
    });
  }

  useEffect(() => {
    window.addEventListener("arweaveWalletLoaded", handleArweaveWalletLoaded);
    window.addEventListener("walletSwitch", handleWalletSwitch);

    return () => {
      window.removeEventListener(
        "arweaveWalletLoaded",
        handleArweaveWalletLoaded
      );
      window.removeEventListener("walletSwitch", handleWalletSwitch);
    };
  }, []);

  const handleWalletSwitch = (e: CustomEvent<{ address: string }>) => {
    const address = e.detail.address;

    setWalletAddress(address);
  };

  const handleArweaveWalletLoaded = async () => {
    const permissions = await window.arweaveWallet.getPermissions();

    if (checkPermissions(permissions, ["ACCESS_ADDRESS"])) {
      const address = await window.arweaveWallet.getActiveAddress();

      setWalletAddress(address);
    }
  };

  const connect = async (permissions: PermissionType[]) => {
    await window.arweaveWallet.connect(permissions).then(async () => {
      const address = await window.arweaveWallet.getActiveAddress();

      setWalletAddress(address);
    });
  };

  return { walletAddress, connect };
};
