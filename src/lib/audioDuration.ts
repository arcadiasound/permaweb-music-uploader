import { Track } from "@/modules/upload/schema";

export const getDuration = async (url: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          resolve(event.target.result as ArrayBuffer);
        } else {
          reject(new Error("Error reading ArrayBuffer"));
        }
      };
      reader.readAsArrayBuffer(blob);
    });

    const audioContext = new window.AudioContext();

    const audioBuffer = await audioContext.decodeAudioData(buffer);

    const duration = audioBuffer.duration;

    return duration;
  } catch (error) {
    console.error("Error fetching or processing audio:", error);
    throw error;
  }
};

export const getTotalDuration = async (tracklist: Track[]) => {
  try {
    const durations = await Promise.all(
      tracklist.map(async (track) => await getDuration(track.url))
    );

    const totalDuration = durations.reduce(
      (acc, duration) => acc + duration,
      0
    );

    return totalDuration;
  } catch (error) {
    console.error("Error getting total duration:", error);
    throw error;
  }
};
