import { UploadSchema } from "@/modules/upload/schema";
import { CurrentProvider, TransactionTags } from "@/types";
import { uploadData } from "../irys";
import { uploadFileTurbo } from "../turbo";
import { isDev } from "@/utils";

export const uploadCollection = async (
  data: UploadSchema,
  trackTxs: string[],
  address: string,
  collectionCode: string,
  currentProvider: CurrentProvider
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
        name: "Type",
        value: "Document",
      },
      {
        name: "Creator",
        value: address,
      },
      {
        name: "Collection-Code",
        value: collectionCode,
      },
    ];

    if (data.description) {
      if (data.description.length <= 300) {
        tags.push({ name: "Description", value: data.description });
      }
    } else {
      tags.push({
        name: "Description",
        // update this to check for artist name first, then for creator address once we add these
        value: `${data.title} by ${address}`,
      });
    }

    const initState = JSON.stringify({
      ticker: "ATOMIC-ALBUM",
      name: data.title,
      balances: {
        [address]: data.tokenQuantity,
      },
      claimable: [],
    });

    if (!isDev()) {
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
    }

    // additional
    if (data.releaseDate) {
      tags.push({
        name: "Release-Date",
        value: (new Date(data.releaseDate).getTime() / 1000).toFixed(0),
      });
    }

    if (data.genre !== "none") {
      tags.push({
        name: "Topic:genre",
        value: data.genre,
      });
    }

    if (data.topics) {
      const topics = data.topics.split(",");
      topics.forEach((topic) =>
        tags.push({
          name: `Topic:${topic.replace(" ", "")}`,
          value: topic.replace(" ", ""),
        })
      );
    }

    const collectionData = JSON.stringify({
      type: "Collection",
      items: trackTxs,
    });

    if (data.uploadProvider === "irys") {
      const collectionTx = await uploadData(
        collectionData,
        tags,
        currentProvider
      );

      console.log(collectionTx);

      collectionId = collectionTx.id;

      if (data.description.length > 300) {
        await uploadData(
          data.description,
          [
            {
              name: "Description-For",
              value: collectionId,
            },
          ],
          currentProvider
        ).then(() => {
          console.log("successfully uploaded release description");
        });
      }
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
