import { UploadSchema } from "@/modules/upload/schema";
import { CurrentProvider } from "@/types";
import { Tag } from "arweave-graphql";
import { BigNumber } from "bignumber.js";

export const arrayBuffersEqual = (
  buffer1: ArrayBuffer,
  buffer2: ArrayBuffer
) => {
  const view1 = new Uint8Array(buffer1);
  const view2 = new Uint8Array(buffer2);

  if (view1.length !== view2.length) {
    return false;
  }

  for (let i = 0; i < view1.length; i++) {
    if (view1[i] !== view2[i]) {
      return false;
    }
  }

  return true;
};

export const formatSchemaValue = (value: string) => {
  const values = value.split("-");
  const formattedValues = values
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1))
    .join(" ");
  return formattedValues;
};

export const userPreferredGateway = () => {
  if (typeof window !== undefined) {
    return localStorage.getItem("gateway");
  }
};

interface AbbreviateAddressOptions {
  startChars?: number;
  endChars?: number;
  noOfEllipsis?: number;
}

interface AbbreviateAddress {
  address: string | undefined;
  options?: AbbreviateAddressOptions;
}

export const abbreviateAddress = ({
  address,
  options = {},
}: AbbreviateAddress) => {
  const { startChars = 5, endChars = 4, noOfEllipsis = 2 } = options;

  const dot = ".";
  const firstFive = address?.substring(0, startChars);
  const lastFour = address?.substring(address.length - endChars);
  return `${firstFive}${dot.repeat(noOfEllipsis)}${lastFour}`;
};

interface FormatTime {
  duration: number;
  options?: {
    suffix?: boolean;
  };
}

export const formatDuration = ({
  duration,
  options = {},
}: FormatTime): string => {
  const { suffix } = options;
  const minutes: number = Math.floor(duration / 60) % 60;
  const seconds: number = Math.floor(duration % 60);
  const hours: number = Math.floor(duration / 3600);

  const hoursText = hours === 1 ? "hour" : "hours";
  const minutesText = minutes === 1 ? "min" : "mins";

  const formattedSeconds: string = suffix
    ? `${seconds} ${seconds === 1 ? "sec" : "secs"}`
    : `${seconds < 10 ? "0" : ""}${seconds}`;

  if (hours > 0) {
    if (suffix) {
      return `${hours} ${hoursText} ${minutes} ${minutesText} ${formattedSeconds}`;
    } else {
      return `${hours}:${minutes}:${formattedSeconds}`;
    }
  }

  if (suffix) {
    return `${minutes} ${minutesText} ${formattedSeconds}`;
  }

  return `${minutes}:${formattedSeconds}`;
};

export const formatFileSize = (size: number): string => {
  if (size < 1024) {
    return size + " Bytes";
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + " KB";
  } else if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + " MB";
  } else {
    return (size / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  }
};

export const calculateTotalFileSize = (uploadData: UploadSchema): number => {
  let totalSize = 0;

  // Calculate size of release artwork file, if present
  if (
    uploadData &&
    uploadData.releaseArtwork &&
    uploadData.releaseArtwork.file
  ) {
    totalSize += uploadData.releaseArtwork.file.size;
  }

  // Calculate size of each track file
  uploadData?.tracklist?.forEach((track) => {
    if (track.file) {
      totalSize += track.file.size;
    }

    // If there's artwork for each track, include its size
    if (track.metadata.artwork && track.metadata.artwork.file) {
      totalSize += track.metadata.artwork.file.size;
    }
  });

  return totalSize;
};

export const formatCredits = (
  winc: string | undefined,
  fixedAmount?: number
) => {
  if (!winc) {
    return;
  }
  const credits = new BigNumber(winc);

  const formattedCredits = credits.dividedBy(1e12).toFixed(fixedAmount || 4);

  return formattedCredits;
};

export const floorToFixed = (number: number | string, decimals: number) => {
  const factor = Math.pow(10, decimals);
  return (
    Math.floor(typeof number === "number" ? number : Number(number) * factor) /
    factor
  );
};

export const isDev = () => {
  if (typeof window === "undefined") return;

  if (window.location.hostname === "localhost") {
    return true;
  } else {
    return false;
  }
};

export function convertFileToUint8Array(file: File): Promise<Uint8Array> {
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

export const createAndSignDataItem = async (file: File, tags: Tag[]) => {
  const dataToUpload = await convertFileToUint8Array(file);

  let signed;

  signed = await window.arweaveWallet.signDataItem({
    data: dataToUpload,
    tags,
  });

  // load the result into a DataItem instance
  //@ts-ignore
  const dataItem = new DataItem(signed);

  return dataItem;
};
