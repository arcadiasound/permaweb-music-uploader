import {
  connect,
  disconnect,
  signature,
  getActivePublicKey,
  ConnectReturnType,
  sign,
} from "@othent/kms";

type UserDetails = ConnectReturnType & {
  walletAddress: string;
};

export const othentConnect = connect as () => Promise<UserDetails>;

export const othentDisconnect = async () => {
  const res = await disconnect();
  console.log("Disconnect,\n", res);
};

export const getOthentAddress = (result: UserDetails) => {
  const address = result.walletAddress;

  return address;
};

export const othentSignature = signature;

export const getOthentActivePublicKey = getActivePublicKey;

export const othentSignIrysTx = async (transaction: any) => {
  try {
    const signedTx = await sign(transaction);

    console.log("signed tx: ", signedTx);
  } catch (error: any) {
    console.error(error);
    throw new Error("Error occurred signing tx");
  }
};
