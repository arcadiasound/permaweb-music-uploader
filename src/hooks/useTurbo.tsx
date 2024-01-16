import React, { useEffect, useState } from "react";

const TurboContext = React.createContext<{
  balance?: {
    winc: string;
  };
  setState: React.Dispatch<
    React.SetStateAction<{
      balance?: {
        winc: string;
      };
    }>
  >;
}>({
  setState: () => {},
});

interface TurboProviderProps {
  children: React.ReactNode;
}

const TurboProvider = ({ children }: TurboProviderProps) => {
  const [state, setState] = useState<{
    balance?: {
      winc: string;
    };
  }>({});

  useEffect(() => {
    window.addEventListener("walletSwitch", (e) => handleWalletSwitch(e));
    return window.removeEventListener("walletSwitch", handleWalletSwitch);
  }, []);

  const handleWalletSwitch = (e: CustomEvent<{ address: string }>) => {
    setState({ balance: undefined });
  };

  return (
    <TurboContext.Provider
      value={{
        balance: state.balance,
        setState: setState,
      }}
    >
      {children}
    </TurboContext.Provider>
  );
};

const useTurbo = () => React.useContext(TurboContext);

export { TurboProvider, useTurbo };
