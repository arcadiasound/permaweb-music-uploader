import { IrysOpts } from "@/types";
import React, { useEffect, useState } from "react";

const IrysContext = React.createContext<IrysOpts>({
  init: {
    token: "arweave",
    node: "node2",
  },
  setState: () => {},
});

interface IrysProviderProps {
  children: React.ReactNode;
}

const IrysProvider = ({ children }: IrysProviderProps) => {
  const [state, setState] = useState<Omit<IrysOpts, "setState">>({
    init: {
      token: "arweave",
      node: "node2",
    },
  });

  return (
    <IrysContext.Provider
      value={{
        init: state.init,
        uploader: state.uploader,
        setState: setState,
      }}
    >
      {children}
    </IrysContext.Provider>
  );
};

const useIrys = () => React.useContext(IrysContext);

export { IrysProvider, useIrys };
