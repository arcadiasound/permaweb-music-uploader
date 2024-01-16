import { PermissionType } from "arconnect";
import { AppInfo } from "arweave-wallet-connector";
import { ReactiveConnector } from "../../node_modules/.pnpm/arweave-wallet-connector@1.0.2/node_modules/arweave-wallet-connector/lib/browser/Reactive";

export type CurrentProvider =
  | "arweave.app"
  | "arconnect"
  | "othent"
  | undefined;

export type UploadProvider = "irys" | "turbo";

export type TransactionTag = {
  name: string;
  value: string;
};

export type TransactionTags = TransactionTag[];

export type IconProps = {
  width?: number | string | undefined;
  height?: number | string | undefined;
};

export interface ArweaveWalletProps extends AppInfo {
  url?: string;
}

export interface PermaProfile {
  address: string;
  handle: string | undefined;
  uniqueHandle: string | undefined;
  bio: string | undefined;
  avatar: string | undefined;
  banner: string | undefined;
  // vouched: boolean;
}

export type Env = {
  gateway?: string;
  // maybe add some cache options here
};

export interface ConnectProps {
  walletProvider: "arweave.app" | "arconnect" | "othent";
  appName: string;
  arweaveWalletProps?: ArweaveWalletProps | undefined;
  permissions?: PermissionType[];
}

export type ArweaveConfig = {
  host: string;
  port: number;
  protocol: string;
};

export type Vouched = boolean;

export type IrysOpts = {
  init?: {
    token?: string;
    provider?: object;
    node?: "node1" | "node2";
  };
  uploader?: {
    batchSize?: number;
    chunkSize?: number;
  };
  setState: React.Dispatch<
    React.SetStateAction<{
      init?: {
        token?: string;
        provider?: object;
        node?: "node1" | "node2";
      };
      uploader?: {
        batchSize?: number;
        chunkSize?: number;
      };
    }>
  >;
};

export type IrysNode = "node1" | "node2";

export declare const WebWallet: {
  namespaces: {
    arweaveWallet: {
      walletName: string;
      connect: () => any;
      disconnect: () => any;
      getActiveAddress: () => string | undefined;
      getActivePublicKey: () => Promise<string>;
      getAllAddresses: () => never;
      getWalletNames: () => never;
      signature: () => never;
      sign: (
        tx: import("arweave/web/lib/transaction.js").default,
        options?: any
      ) => Promise<import("arweave/web/lib/transaction.js").default>;
      dispatch: (
        tx: import("arweave/web/lib/transaction.js").default,
        options?: any
      ) => Promise<
        import(".pnpm/arweave-wallet-connector@1.0.2/node_modules/arweave-wallet-connector/lib/Arweave.js").DispatchResult
      >;
      encrypt: (data: Uint8Array, options: any) => Promise<Uint8Array>;
      decrypt: (data: Uint8Array, options: any) => Promise<Uint8Array>;
      getPermissions: () => string[];
      getArweaveConfig: () => Promise<
        Omit<import("arweave/web/lib/api.js").ApiConfig, "logger"> & {
          logger?: any;
        }
      >;
    };
  };
  postMessage(
    method: string,
    params?: any[] | undefined,
    options?:
      | import(".pnpm/arweave-wallet-connector@1.0.2/node_modules/arweave-wallet-connector/lib/types.js").PostMessageOptions
      | undefined
  ): any;
  getPublicKey(): Promise<string>;
  getArweaveConfig(): Promise<
    Omit<import("arweave/web/lib/api.js").ApiConfig, "logger"> & {
      logger?: any;
    }
  >;
  signTransaction(
    tx: import("arweave/web/lib/transaction.js").default,
    options?:
      | object
      | import(".pnpm/arweave-wallet-connector@1.0.2/node_modules/arweave-wallet-connector/lib/types.js").Null
  ): Promise<import("arweave/web/lib/transaction.js").default>;
  signDataItem(tx: {
    tags?:
      | {
          name: string;
          value: string;
        }[]
      | undefined;
    target?: string | undefined;
    data?: string | undefined;
    anchor?: string | undefined;
  }): Promise<ArrayBufferLike>;
  dispatch(
    tx: import("arweave/web/lib/transaction.js").default,
    options?:
      | object
      | import(".pnpm/arweave-wallet-connector@1.0.2/node_modules/arweave-wallet-connector/lib/types.js").Null
  ): Promise<
    import(".pnpm/arweave-wallet-connector@1.0.2/node_modules/arweave-wallet-connector/lib/Arweave.js").DispatchResult
  >;
  signMessage<T extends ArrayBufferView>(
    message: T,
    options: {
      hashAlgorithm?: "SHA-256" | "SHA-384" | "SHA-512" | undefined;
    }
  ): Promise<T>;
  verifyMessage(
    message: ArrayBufferView,
    signature: string | ArrayBufferView,
    publicKey: string,
    options: {
      hashAlgorithm?: "SHA-256" | "SHA-384" | "SHA-512" | undefined;
    } & {
      signAlgorithm?: "RSA" | undefined;
    }
  ): Promise<boolean>;
  encrypt<T_1 extends ArrayBufferView>(
    message: T_1,
    publicKey: string,
    options: AlgorithmIdentifier
  ): Promise<T_1>;
  decrypt<T_2 extends ArrayBufferView>(
    message: T_2,
    options: AlgorithmIdentifier
  ): Promise<T_2>;
  privateHash<T_3 extends ArrayBufferView>(
    message: T_3,
    options: {
      hashAlgorithm?: "SHA-256" | "SHA-384" | "SHA-512" | undefined;
    }
  ): Promise<T_3>;
  address?: string | undefined;
  connect(): any;
  disconnect(): any;
} & ReactiveConnector;
