import { IrysNode, IrysOpts, TransactionTags } from "@/types";
import { WebIrys } from "@irys/sdk";

type GetIrys = Pick<IrysOpts, "init">;

export const getIrys = async (irysOptions?: GetIrys) => {
  const irys = new WebIrys({
    token: irysOptions?.init?.token || "arweave",
    wallet: { provider: irysOptions?.init?.provider || window.arweaveWallet },
    url: `https://${irysOptions?.init?.node || "node2"}.irys.xyz`,
  });

  await irys.ready();

  return irys;
};

export const uploadData = async (data: string, tags: TransactionTags) => {
  const irys = await getIrys();

  const response = await irys.upload(data, { tags });
  return response;
};

export const uploadFile = async (data: File, tags: TransactionTags) => {
  const irys = await getIrys();

  const response = await irys.uploadFile(data, { tags });
  return response;
};

export const uploadChunks = async (
  data: ArrayBuffer,
  tags: TransactionTags
) => {
  const irys = await getIrys();

  const transaction = irys.createTransaction(Buffer.from(data), { tags });
  await transaction.sign();
  let uploader = irys.uploader.chunkedUploader;

  const upload = uploader.uploadTransaction(transaction);

  uploader.on("chunkUpload", (chunkInfo) => {
    console.log(
      `Uploaded Chunk number ${chunkInfo.id}, offset of ${chunkInfo.offset}, size ${chunkInfo.size} Bytes, with a total of ${chunkInfo.totalUploaded} bytes uploaded.`
    );
  });

  uploader.on("chunkError", (e) => {
    console.error(`Error uploading chunk number ${e.id} - ${e.res.statusText}`);
  });

  uploader.on("done", (finishRes) => {
    console.log(`Upload completed with ID ${finishRes.id}`);
  });

  const response = await upload;
  return response;
};

export const getIrysBalance = async (node: IrysNode) => {
  const irys = await getIrys({ init: { node } });

  const atomicBalance = await irys.getLoadedBalance();

  const convertedBalance = irys.utils.fromAtomic(atomicBalance);

  return convertedBalance;
};

export const fundIrysNode = async ({
  node,
  amount,
}: {
  node: IrysNode;
  amount: number;
}) => {
  const irys = await getIrys({ init: { node } });

  const fundTx = await irys.fund(irys.utils.toAtomic(amount));
  return {
    quantity: irys.utils.fromAtomic(fundTx.quantity),
    token: irys.token,
  };
};

export const getIrysUploadCost = async (byteCount: number) => {
  const irys = await getIrys();

  const priceAtomic = await irys.getPrice(byteCount);

  // Convert from atomic units to standard units
  const priceConverted = irys.utils.fromAtomic(priceAtomic);

  return priceConverted;
};
