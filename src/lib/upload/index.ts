import { Track, UploadSchema } from "@/modules/upload/schema";
import { getIrys, uploadData, uploadFile } from "../irys";
import { IrysOpts, TransactionTags, UploadProvider } from "@/types";
import { appConfig } from "@/appConfig";
import { warp } from "../arweave";
import fileReaderStream from "filereader-stream";
import { UseFormReturn } from "react-hook-form";
import { uploadFileTurbo } from "../turbo";
import { DataItem } from "arbundles";
import { isDev } from "@/utils";

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

    // if (data.uploadStatus === 'cancelled') {

    // }

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
      collectionTx = await uploadCollection(data, trackTxs, address);

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

const uploadTracks = async (
  data: UploadSchema,
  address: string,
  artworkId: string,
  form: UseFormReturn<UploadSchema>,
  irysOpts: IrysOpts,
  uploadProvider: UploadProvider,
  collectionCode?: string
): Promise<string[]> => {
  // empty array to fill with successfully uploaded tracks
  let uploadedTracks: string[] = [];

  // loop through tracks
  for (let i = 0; i < data.tracklist.length; i++) {
    try {
      const track = data.tracklist[i];

      // start to show feedback to indicate upload is in progress
      form.setValue(`tracklist.${i}.upload.status`, "in-progress");
      form.setValue(`tracklist.${i}.upload.progress`, 10);

      let trackArtworkId: string = "";

      // check if track should use release artwork
      const useArtworkTx =
        data.releaseArtwork.file === track.metadata.artwork.file;

      let tags: TransactionTags = [];

      if (useArtworkTx) {
        trackArtworkId = artworkId;
      } else {
        const imageTags: TransactionTags = [];
        if (uploadProvider === "irys") {
          trackArtworkId = (
            await uploadFile(track.metadata.artwork.file, imageTags)
          ).id;
          form.setValue(`tracklist.${i}.upload.progress`, 20);
        } else {
          const dataToUpload = await convertFileToUint8Array(
            track.metadata.artwork.file
          );

          const signed = await window.arweaveWallet.signDataItem({
            data: dataToUpload,
            tags: imageTags,
          });

          // load the result into a DataItem instance
          //@ts-ignore
          const dataItem = new DataItem(signed);

          trackArtworkId = await uploadFileTurbo(dataItem.getRaw());
        }
      }

      //test tags
      // tags = tags.concat({ name: "Intent", value: "Test" });

      // additional
      if (data.releaseDate) {
        tags = tags.concat({
          name: "Release-Date",
          value: (new Date(data.releaseDate).getTime() / 1000).toFixed(0),
        });
      }

      if (collectionCode) {
        tags = tags.concat({
          name: "Collection-Code",
          value: collectionCode,
        });
      }

      //ans-110 tags
      tags = tags.concat({ name: "Content-Type", value: track.file.type });
      tags = tags.concat({ name: "Title", value: track.metadata.title });
      tags = tags.concat({ name: "Thumbnail", value: trackArtworkId });
      tags = tags.concat({ name: "Topic:genre", value: track.metadata.genre });

      if (track.metadata.description) {
        if (track.metadata.description.length <= 300) {
          tags = tags.concat({
            name: "Description",
            value: track.metadata.description,
          });
        }
      }

      if (data.topics) {
        const topics = data.topics.split(",");
        console.log({ topics });
        topics.forEach(
          (topic) =>
            (tags = tags.concat({
              name: `Topic:${topic.replace(" ", "")}`,
              value: topic.replace(" ", ""),
            }))
        );
      }

      if (!isDev()) {
        //atomic asset tags
        const initState = JSON.stringify({
          ticker: "ATOMIC-SONG",
          name: track.metadata.title,
          balances: {
            [address]: data.tokenQuantity,
          },
          claimable: [],
        });

        tags = tags.concat({
          name: "Creator",
          value: address,
        });
        tags = tags.concat({ name: "Init-State", value: initState });
        tags = tags.concat({ name: "App-Name", value: "SmartWeaveContract" });
        tags = tags.concat({ name: "App-Version", value: "0.3.0" });
        tags = tags.concat({ name: "Indexed-By", value: "ucm" });
        tags = tags.concat({
          name: "Contract-Src",
          value: "Of9pi--Gj7hCTawhgxOwbuWnFI1h24TTgO5pw8ENJNQ",
        });
        tags = tags.concat({
          name: "Contract-Manifest",
          value:
            '{"evaluationOptions":{"sourceType":"redstone-sequencer","allowBigInt":true,"internalWrites":true,"unsafeClient":"skip","useConstructor":true}}',
        });
      }

      //license tags
      const checkDerivationLicense = () => {
        if (data.license?.derivation === "with-revenue-share") {
          tags = tags.concat({
            name: "Derivation",
            value: `allowed-with-revenueShare-${data.license?.revShare}%`,
          });
        } else {
          tags = tags.concat({
            name: "Derivation",
            value: `allowed-${data.license?.derivation}`,
          });
        }
      };

      if (data.license && !isDev()) {
        tags = tags.concat({ name: "License", value: appConfig.UDL });

        if (data.license.type === "allowed") {
          if (data.license.commercial === "with-fee") {
            tags = tags.concat({ name: "Commercial", value: "allowed" });
            tags = tags.concat({
              name: "License-Fee",
              value: `${data.license.feeRecurrence}-${data.license.commercialFee}`,
            });
            tags = tags.concat({
              name: "Currency",
              value: data.license.currency,
            });
            tags = tags.concat({
              name: "Payment-Mode",
              value: data.license.paymentMode,
            });
          } else {
            tags = tags.concat({
              name: "Commercial",
              value: `allowed-${data.license.commercial}`,
            });
          }

          checkDerivationLicense();
        }

        if (data.license.type === "attribution") {
          tags = tags.concat({
            name: "Commercial",
            value: "allowed-with-credit",
          });
          tags = tags.concat({
            name: "Derivation",
            value: "allowed-with-credit",
          });
        }

        if (data.license.type === "noncommercial") {
          checkDerivationLicense();
        }
      }

      let resultId: string;

      if (uploadProvider === "irys") {
        resultId = await uploadTrackWithIrys(form, track, i, tags, irysOpts);
      } else {
        resultId = await uploadTrackWithTurbo(form, track, i, tags);
      }

      if (track.metadata.description.length > 300) {
        await uploadData(track.metadata.description, [
          {
            name: "Description-For",
            value: resultId,
          },
        ]).then(() => {
          console.log(
            "successfully uploaded description for: ",
            track.metadata.title
          );
        });
      }

      if (resultId) {
        console.log(`upload completed with ID ${resultId}`);
        form.setValue(`tracklist.${i}.upload.tx`, resultId);
        form.setValue(`tracklist.${i}.upload.status`, "success");
        uploadedTracks.push(resultId);
      }
    } catch (error) {
      form.setValue(`tracklist.${i}.upload.status`, "failed");

      throw error;
    }
  }

  return uploadedTracks;
};

const uploadTrackWithIrys = async (
  form: UseFormReturn<UploadSchema>,
  track: Track,
  i: number,
  tags: TransactionTags,
  irysOpts: IrysOpts
) => {
  let totalChunks = 0;

  console.log(tags);
  // set user-preferred node
  const irys = await getIrys({ init: { node: irysOpts.init?.node } });

  const uploader = irys.uploader.chunkedUploader;

  const chunkSize = 25000000;
  uploader.setChunkSize(chunkSize);

  // create data stream
  const dataStream = fileReaderStream(track.file);

  if (track.file.size < chunkSize) {
    totalChunks = 1;
  } else {
    totalChunks = Math.floor((track.file.size || 0) / chunkSize);
  }

  uploader.on("chunkUpload", (chunkInfo) => {
    const chunkNumber = chunkInfo.id + 1;
    if (form.getValues(`tracklist.${i}.upload.status`) === "idle") {
      form.setValue(`tracklist.${i}.upload.status`, "in-progress");
    }

    // update track progress based on how much has been uploaded
    if (chunkNumber >= totalChunks) {
      form.setValue(`tracklist.${i}.upload.progress`, 100);
    } else {
      form.setValue(
        `tracklist.${i}.upload.progress`,
        (chunkNumber / totalChunks) * 100
      );
    }
  });

  uploader.on("chunkError", (e) => {
    form.setValue(`tracklist.${i}.upload.status`, "failed");
    console.error(`Error uploading chunk number ${e.id} - ${e.res.statusText}`);
  });

  // uploader.on("done", (res) => {
  //   form.setValue(`tracklist.${i}.upload.progress`, 100);
  // });

  const result = await uploader.uploadData(dataStream, {
    tags,
  });

  return result.data.id;
};

const uploadTrackWithTurbo = async (
  form: UseFormReturn<UploadSchema>,
  track: Track,
  i: number,
  tags: TransactionTags
) => {
  // if (typeof window === "undefined") {
  //   return;
  // }

  form.setValue(`tracklist.${i}.upload.status`, "in-progress");
  form.setValue(`tracklist.${i}.upload.progress`, 50);

  const dataToUpload = await convertFileToUint8Array(track.file);

  console.log("about to sign");

  const signed = await window.arweaveWallet.signDataItem({
    data: dataToUpload,
    tags,
  });

  console.log("signed");

  // load the result into a DataItem instance
  //@ts-ignore
  const dataItem = new DataItem(signed);

  console.log("about to upload data item");

  const result = await uploadFileTurbo(dataItem.getRaw());

  form.setValue(`tracklist.${i}.upload.progress`, 100);
  return result;
};

const uploadCollection = async (
  data: UploadSchema,
  trackTxs: string[],
  address: string
): Promise<string> => {
  try {
    let collectionId: string = "";

    const tags: TransactionTags = [
      {
        name: "Data-Protocol",
        value: "Collection",
      },
      {
        name: "Collection-Type",
        value: "audio",
      },
      {
        name: "Title",
        value: data.title,
      },
      {
        name: "Creator",
        value: address,
      },
    ];

    if (data.description.length <= 300) {
      tags.push({ name: "Description", value: data.description });
    }

    const initState = JSON.stringify({
      ticker: "ATOMIC-ALBUM",
      name: data.title,
      balances: {
        [address]: data.tokenQuantity,
      },
      claimable: [],
    });

    tags.push({ name: "Init-State", value: initState });
    tags.push({ name: "App-Name", value: "SmartWeaveContract" });
    tags.push({ name: "App-Version", value: "0.3.0" });
    tags.push({ name: "Indexed-By", value: "ucm" });
    tags.push({
      name: "Contract-Src",
      value: "Of9pi--Gj7hCTawhgxOwbuWnFI1h24TTgO5pw8ENJNQ",
    });
    tags.push({
      name: "Contract-Manifest",
      value:
        '{"evaluationOptions":{"sourceType":"redstone-sequencer","allowBigInt":true,"internalWrites":true,"unsafeClient":"skip","useConstructor":true}}',
    });

    // additional
    if (data.releaseDate) {
      tags.push({
        name: "Release-Date",
        value: (new Date(data.releaseDate).getTime() / 1000).toFixed(0),
      });
    }

    const collectionData = JSON.stringify({
      type: "Collection",
      items: trackTxs,
    });

    if (data.uploadProvider === "irys") {
      const collectionTx = await uploadData(collectionData, tags);
      console.log(collectionTx);

      collectionId = collectionTx.id;
    } else {
      const signed = await window.arweaveWallet.signDataItem({
        data: collectionData,
        tags,
      });

      // load the result into a DataItem instance
      //@ts-ignore
      const dataItem = new DataItem(signed);
      collectionId = await uploadFileTurbo(dataItem.getRaw());
    }

    return collectionId;
  } catch (error) {
    throw error;
  }
};

const uploadArtwork = async (
  artwork: UploadSchema["releaseArtwork"],
  uploadProvider: UploadProvider
) => {
  const tags: TransactionTags = [];

  let artworkTx: string;

  if (uploadProvider === "irys") {
    const res = await uploadFile(artwork.file, tags);

    artworkTx = res.id;
    // try {
    //   const res = await uploadFile(artwork.file, tags);

    //   artworkTx = res.id;
    // } catch (error: any) {
    //   console.error(error);

    //   if (error.includes('User rejected')) {
    //     throw new Error('Upload cancelled.')
    //   }
    // }
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

function convertFileToUint8Array(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      // Ensure that reader.result is an ArrayBuffer
      if (reader.result instanceof ArrayBuffer) {
        const arrayBuffer = reader.result;
        const uint8Array = new Uint8Array(arrayBuffer);
        resolve(uint8Array);
      } else {
        reject(new Error("File read did not result in an ArrayBuffer"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsArrayBuffer(file);
  });
}
