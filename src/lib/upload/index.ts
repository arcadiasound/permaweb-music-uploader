import { Track, UploadSchema } from "@/modules/upload/schema";
import { getIrys, uploadData, uploadFile } from "../irys";
import { IrysOpts, TransactionTags, UploadProvider } from "@/types";
import { appConfig } from "@/appConfig";
import { warp } from "../arweave";
import { UseFormReturn } from "react-hook-form";
import { uploadFileTurbo } from "../turbo";
import { DataItem } from "arbundles";
import { convertFileToUint8Array, isDev } from "@/utils";
import { uploadTracks } from "./tracks";
import { uploadCollection } from "./collection";

export const upload = async (
  data: UploadSchema,
  address: string | undefined,
  form: UseFormReturn<UploadSchema>,
  irysOpts: IrysOpts
) => {
  try {
    if (!address) {
      throw new Error("No wallet connected.");
    }

    const isCollection = data.tracklist.length > 1;

    let collectionCode = "";

    if (isCollection) {
      if (data.collectionCode) {
        collectionCode = data.collectionCode;
      } else {
        collectionCode = crypto.randomUUID();
      }
    }

    let artworkTx: string;

    /* upload release artwork */
    /* update to prefer tx once we add option in form */
    artworkTx = await uploadArtwork(data.releaseArtwork, data.uploadProvider);

    /* upload tracks individually */
    const trackTxs = await uploadTracks(
      data,
      address,
      artworkTx,
      form,
      irysOpts,
      data.uploadProvider,
      collectionCode
    );

    // const registerNode =
    //   data.uploadProvider === "turbo"
    //     ? "arweave"
    //     : irysOpts?.init?.node || "node2";

    //temp
    const registerNode = "arweave";

    if (!isDev()) {
      //register track txs
      await new Promise((r) => setTimeout(r, 1000));
      await Promise.all(
        trackTxs.map(async (id) => {
          await warp.register(id, registerNode).then((res) => {
            const index = data.tracklist.findIndex(
              (track) => track.upload.tx === res.contractTxId
            );
            console.log({ index });
            form.setValue(`tracklist.${index}.upload.registered`, true);
            console.log(`asset registered - ${res.contractTxId}`);
          });
          await new Promise((r) => setTimeout(r, 1000));
        })
      ).then(() => {
        console.log("assets successfully registered");
      });
    }

    let collectionTx: string | undefined = "";

    if (isCollection) {
      /* if more than one track, upload collection */
      collectionTx = await uploadCollection(
        data,
        trackTxs,
        address,
        collectionCode
      );

      if (!isDev()) {
        await new Promise((r) => setTimeout(r, 1000));
        await warp.register(collectionTx, registerNode).then((res) => {
          console.log(
            `collection successfully registered: ${res.contractTxId}`
          );
        });
      }
    }
  } catch (error) {
    throw error;
  }
};

const uploadArtwork = async (
  artwork: UploadSchema["releaseArtwork"],
  uploadProvider: UploadProvider
) => {
  const tags: TransactionTags = [
    {
      name: "Content-Type",
      value: artwork.file.type,
    },
  ];

  let artworkTx: string;

  if (uploadProvider === "irys") {
    const res = await uploadFile(artwork.file, tags);

    artworkTx = res.id;
  } else {
    const dataToUpload = await convertFileToUint8Array(artwork.file);

    const signed = await window.arweaveWallet.signDataItem({
      data: dataToUpload,
      tags,
    });

    // load the result into a DataItem instance
    //@ts-ignore
    const dataItem = new DataItem(signed);

    artworkTx = await uploadFileTurbo(dataItem.getRaw());
  }

  return artworkTx;
};
