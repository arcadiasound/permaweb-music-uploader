export const getTurboBalance = async () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const wallet = window.arweaveWallet;
    const publicKey = await window.arweaveWallet.getActivePublicKey();
    const nonce = crypto.randomUUID();
    const signature = await signNonceAndData(nonce, wallet);

    const res = await fetch("https://payment.ardrive.io/v1/balance", {
      headers: {
        "x-signature": signature,
        "x-nonce": nonce,
        "x-public-key": publicKey,
      },
    });

    const data: { winc: string } = await res.json();
    console.log({ data });
    return data;
  } catch (error) {
    throw error;
  }
};

const signNonceAndData = async (
  nonce: string,
  wallet: typeof window.arweaveWallet
) => {
  const signature = await wallet.signature(new TextEncoder().encode(nonce), {
    name: "RSA-PSS",
    saltLength: 0,
  });

  const b64encodedSignature = await bufferToBase64(signature);

  return b64encodedSignature;
};

async function bufferToBase64(
  buffer: ArrayBuffer | Uint8Array
): Promise<string> {
  // use a FileReader to generate a base64 data URI:
  const base64url = await new Promise((r) => {
    const reader = new FileReader();
    reader.onload = () => r(reader.result);
    reader.readAsDataURL(new Blob([buffer]));
  });
  // remove the `data:...;base64,` part from the start
  //@ts-ignore
  return base64url.slice(base64url.indexOf(",") + 1);
}

// export const getTurbo = async () => {
//   const turbo = TurboFactory.unauthenticated();

//   return turbo;
// };

// export const getSupportedCurrencies = async () => {
//   const turbo = await getTurbo();
//   const currencies = await turbo.getSupportedCurrencies();
//   const fiatToAr = await turbo.getFiatToAR({ currency: "gbp" });

//   console.log({ currencies });
//   console.log({ fiatToAr });
// };

export const getSupportedCurrencies = async (): Promise<Currency> => {
  const res = await fetch("https://payment.ardrive.io/v1/currencies");

  const data = await res.json();
  return data.supportedCurrencies;
};

type Currency =
  | "aud"
  | "brl"
  | "cad"
  | "eur"
  | "gbp"
  | "hkd"
  | "inr"
  | "jpy"
  | "sgd"
  | "usd";

interface CreateCheckoutSession {
  address: string | undefined;
  currency: Currency;
  amount: number | undefined;
}

interface CheckoutResponse {
  paymentSession: {
    url: string;
  };
}

export const createCheckoutSession = async ({
  address,
  currency,
  amount,
}: CreateCheckoutSession) => {
  if (!address) {
    throw new Error("No address connected");
  }

  if (!amount) {
    throw new Error("No amount provided");
  }

  const res = await fetch(
    `https://payment.ardrive.io/v1/top-up/checkout-session/${address}/${currency}/${
      amount * 100
    }`
  );

  const data: CheckoutResponse = await res.json();
  return data;
};

interface TurboUploadResponse {
  id: string;
  owner: string;
  timestamp: number;
}

export const uploadFileTurbo = async (data: Buffer): Promise<string> => {
  const res = await fetch("https://upload.ardrive.io/v1/tx", {
    method: "POST",
    headers: {
      "content-type": "application/octet-stream",
      accept: "application/json",
    },
    body: data,
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const uploadInfo: TurboUploadResponse = await res.json();
  console.log({ uploadInfo });

  return uploadInfo.id;
};

export const getTurboUploadCost = async (byteCount: number) => {
  const res = await fetch(
    `https://payment.ardrive.io/v1/price/bytes/${byteCount}`
  );

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const cost: { winc: string } = await res.json();
  console.log({ cost });

  return cost;
};
