import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// import "./index.css";
import { ConnectProvider } from "@/hooks/useConnect";
import { darkTheme, globalCss } from "@/stitches.config";
import { ArweaveWebWallet } from "arweave-wallet-connector";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IrysProvider } from "@/hooks/useIrys";
import { TurboProvider } from "@/hooks/useTurbo";

const globalStyles = globalCss({
  "*, *::before, *::after": {
    boxSizing: "border-box",
  },
  "*": {
    "*:focus:not(.focus-visible)": {
      outline: "none",
    },
  },
  "html, body, #root, #__next": {
    minHeight: "100vh",
    fontFamily: "$body",
    margin: 0,
    backgroundColor: "$slate1",
    color: "$slate11",
  },
  "& a": {
    "&:focus-visible": {
      boxShadow: "0 0 0 2px $colors$blue8",
    },
  },
});

const queryClient = new QueryClient();

globalStyles();

const webWallet = new ArweaveWebWallet({
  name: "Radar",
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TurboProvider>
        <IrysProvider>
          <ConnectProvider webWallet={webWallet} detectWalletSwitch>
            <Toaster richColors position="bottom-right" />
            <App />
          </ConnectProvider>
        </IrysProvider>
      </TurboProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
