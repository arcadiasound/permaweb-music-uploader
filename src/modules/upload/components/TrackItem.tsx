import { getDuration } from "@/lib/audioDuration";
import { Box } from "@/ui/Box";
import { Button } from "@/ui/Button";
import { Flex } from "@/ui/Flex";
import { Image } from "@/ui/Image";
import { Progress, ProgressIndicator } from "@/ui/Progress";
import { Typography } from "@/ui/Typography";
import { formatDuration } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  RxCheck,
  RxCheckCircled,
  RxCrossCircled,
  RxLapTimer,
} from "react-icons/rx";
import { Track } from "../schema";

interface TrackItemProps {
  track: Track;
}

export const TrackItem = ({ track }: TrackItemProps) => {
  const { data: duration, isLoading: durationLoading } = useQuery({
    queryKey: [`track-${track.url}`],
    queryFn: () => getDuration(track.url),
  });

  let currentColor = "";
  let statusText = "";

  switch (track.upload.status) {
    case "idle":
      currentColor = "$slate10";
      statusText = "Not uploaded";
      break;
    case "in-progress":
      currentColor = "$yellow10";
      statusText = "In progress";
      break;
    case "success":
      currentColor = "$green10";
      statusText = "Uploaded";
      break;
    case "failed":
      currentColor = "$red10";
      statusText = "Failed";

      break;
    default:
      currentColor = "$slate10";
      statusText = "Not uploaded";
      break;
  }

  useEffect(() => {
    console.log(track);
  }, []);

  return (
    <Box
      css={{
        px: "$2",
        pt: "$1",
        pb: "$10",
        mb: "$7",
        position: "relative",
      }}
    >
      <Flex justify="between" align="center">
        <Flex align="center" gap="5">
          <Image
            css={{
              boxSize: "$10",
            }}
            src={track.metadata.artwork.url}
          />
          <Typography size="2" contrast="hi">
            {track.metadata.title}
          </Typography>
        </Flex>
        <Flex align="center" gap="3">
          {track.upload.status === "success" && track.upload.tx && (
            <Button
              css={{
                cursor: "pointer",
              }}
              target="_blank"
              rel="noreferrer"
              href={`https://arcadia.arweave.dev/#/track?tx=${track.upload.tx}`}
              as="a"
              variant="solid"
              size="1"
            >
              View Track
            </Button>
          )}
          {track.metadata.genre !== "none" && (
            <Typography
              size="1"
              css={{
                px: "$2",
                py: "$1",
                br: 2,
                boxShadow: "0 0 0 1px $colors$slate6",
              }}
            >
              {track.metadata.genre}
            </Typography>
          )}
          <Typography
            css={{
              maxWidth: 80,
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
            size="1"
          >
            {duration ? `${formatDuration({ duration })}` : "-"}
          </Typography>
        </Flex>
      </Flex>
      <Flex
        css={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
        }}
        direction="column"
        gap="2"
      >
        <Box css={{ position: "relative" }}>
          <Progress value={track.upload.progress}>
            <ProgressIndicator
              css={{
                transform: `translateX(-${100 - track.upload.progress}%)`,
                backgroundColor: currentColor,
              }}
            />
          </Progress>
        </Box>
        <Typography
          size="1"
          css={{
            color: currentColor,
            display: "inline-flex",
            alignItems: "center",
            gap: "$1",
          }}
        >
          {statusText}
          {track.upload.status === "failed" ||
            (track.upload.status === "idle" && <RxCrossCircled />)}
          {track.upload.status === "success" && <RxCheckCircled />}
          {track.upload.status === "in-progress" && <RxLapTimer />}
          {/* {track.upload.status === "success" &&
            !track.upload.registered &&
            " - (not registered)"} */}
        </Typography>
      </Flex>
    </Box>
  );
};
