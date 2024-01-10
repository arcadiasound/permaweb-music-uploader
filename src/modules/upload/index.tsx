import { Button } from "@/ui/Button";
import { Flex } from "@/ui/Flex";
import { Typography } from "@/ui/Typography";
import { Box } from "@/ui/Box";
import { styled } from "@/stitches.config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/Tabs";
import { Label } from "@/ui/Label";
import { RxDragHandleDots2, RxPencil2, RxPlus, RxTrash } from "react-icons/rx";
import {
  BsFillExclamationCircleFill,
  BsPauseFill,
  BsPlayFill,
} from "react-icons/bs";
import { Track, UploadSchema, uploadSchema } from "./schema";
import { TextField } from "@/ui/TextField";
import { Textarea } from "@/ui/Textarea";
import { genres } from "@/data/genres";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { IconButton } from "@/ui/IconButton";
import { Container } from "@/ui/Container";
import { FormHelperError, FormHelperText, FormRow } from "@/ui/Form";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DetailsDialog } from "./DetailsDialog";
import { Image } from "@/ui/Image";
import { upload } from "@/lib/upload/";
import { toast } from "sonner";
import { ImageDropzone } from "./components/Dropzone";
import { FormSelect } from "./components/FormSelect";
import { udl } from "@/data/license";
import { ControlGroup } from "@/ui/ControlGroup";
import { formatSchemaValue, formatDuration, abbreviateAddress } from "@/utils";
import { useConnect } from "@/hooks/useConnect";
import { useQuery } from "@tanstack/react-query";
import { TrackItem } from "./components/TrackItem";
import { getTotalDuration } from "@/lib/audioDuration";
import { getAccount } from "@/lib/account/api";
import { appConfig } from "@/appConfig";
import { useIrys } from "@/hooks/useIrys";
import { UploadDialog } from "./UploadDialog";
import { AppHeader } from "../layout/AppHeader";
import { useLocation } from "react-router-dom";
import { FormHelperAccordion } from "./components/FormHelperAccordion";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const AudioDropContainer = styled("div", {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  py: "$4",
  px: "$4",
  cursor: "pointer",
  border: "2px dashed $colors$slate6",
  position: "relative",
  width: "100%",
  minHeight: 120,

  variants: {
    hovered: {
      true: {
        border: "2px dashed $colors$focus",
      },
    },
  },
});

const Fullscreen = styled("div", {
  width: "100%",
  minHeight: "100dvh",
  position: "relative",
});

const formTabs: { [key: string]: Tab } = {
  details: {
    name: "details",
    fields: ["title", "description", "releaseArtwork", "genre", "releaseDate"],
  },
  tracklist: {
    name: "tracklist",
    fields: ["tracklist"],
  },
  monetization: {
    name: "monetization",
    fields: ["tokenQuantity", "license"],
  },
};

type FieldName = keyof UploadSchema;

type Tab = {
  name: string;
  fields: FieldName[];
};

type CurrentTab = "details" | "tracklist" | "monetization" | "review";

export const Upload = () => {
  const [showDetailsDialog, setShowDetailsDialog] = useState({
    open: false,
    index: 0,
  });
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState<CurrentTab>("details");
  const [currentlyPlayingIndex, setCurrentlyPlayingIndex] = useState<
    null | number
  >(null);
  const { walletAddress, connect, connecting } = useConnect();
  const irysOpts = useIrys();
  const audioRef = useRef<(HTMLAudioElement | null)[]>([]);
  const location = useLocation();

  // useEffect(() => {
  //   if (location.pathname === "upload") {
  //     alertUser();
  //   }
  // }, [location]);

  const form = useForm<UploadSchema>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      genre: "none",
      tokenQuantity: 100,
      license: {
        type: "public-use",
        derivation: "with-credit",
        revShare: 1,
        commercial: "with-credit",
        currency: "U",
        commercialFee: 1,
        feeRecurrence: "one-time",
        paymentMode: "global",
      },
      releaseArtwork: {
        file: undefined,
        url: undefined,
      },
      uploadProvider: "irys",
      uploadStatus: "idle",
    },
  });

  const {
    getValues,
    trigger,
    control,
    resetField,
    register,
    handleSubmit,
    watch,
    formState,
  } = form;
  const { errors } = formState;

  const { fields, append, move, remove } = useFieldArray({
    control: form.control,
    name: "tracklist",
  });

  const handleDrag = ({ source, destination }) => {
    console.log("yello");
    if (destination) {
      move(source.index, destination.index);
    }
  };

  const handlePrevious = () => {
    if (currentTab === "tracklist") {
      setCurrentTab("details");
    }
    if (currentTab === "monetization") {
      setCurrentTab("tracklist");
    }
    if (currentTab === "review") {
      setCurrentTab("monetization");
    }
  };

  const reactiveTitle = watch("title");
  const reactiveDescription = watch("description");
  const reactiveArtwork = watch("releaseArtwork");
  const reactiveTracklist = watch("tracklist");

  const detailsValid = () => {
    const artworkValid = Object.values(reactiveArtwork).every((item) => item);

    if (!!reactiveTitle && artworkValid) {
      return true;
    } else {
      return false;
    }
  };

  const tracklistValid = () => {
    const isValid =
      reactiveTracklist.length > 0
        ? reactiveTracklist.every((track, index) => {
            const isTrackValid = trackValid(index);

            return isTrackValid;
          })
        : false;

    return isValid;
  };

  // validate track by required props - should automate as list grows
  const trackValid = (index: number) => {
    const title = watch("tracklist")[index].metadata.title;
    const description = watch("tracklist")[index].metadata.description;
    const artwork = watch("tracklist")[index].metadata.artwork;

    const artworkValid = artwork
      ? Object.values(artwork).every((item) => item)
      : false;

    if (!!title && artworkValid) {
      return true;
    } else {
      return false;
    }
  };

  const handleNext = async () => {
    const fields = formTabs[currentTab as keyof typeof formTabs].fields;
    const output = await trigger(fields as FieldName[], { shouldFocus: true });

    console.log(form.getValues());

    try {
      const result = uploadSchema.parse(getValues());
      console.log(result);
    } catch (error) {
      console.error(error);
    }

    console.log(errors);

    // if (!result.success) {
    //   console.log(result.error);
    // }

    if (!output) {
      return;
    }

    if (currentTab === "details") {
      setCurrentTab("tracklist");
    }
    if (currentTab === "tracklist") {
      setCurrentTab("monetization");
    }
    if (currentTab === "monetization") {
      setCurrentTab("review");
    }
  };

  const onAudioDrop = useCallback(async (acceptedFiles: File[]) => {
    const tracks: Track[] = [];

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];

      const reader = new FileReader();

      reader.onabort = () => console.log("file reading was aborted");

      try {
        const track = await new Promise<Track>((resolve, reject) => {
          // create a new FileReader
          // read the file as an ArrayBuffer
          reader.readAsArrayBuffer(file);

          reader.onload = () => {
            let blob;
            let url;
            blob = new Blob([file], { type: file.type });
            url = window.URL.createObjectURL(blob);

            const track: Track = {
              file,
              url,
              // data: reader.result as ArrayBuffer,
              metadata: {
                title: file.name,
                description: "",
                genre: form.getValues("genre"),
                artwork: {
                  // data: form.getValues("releaseArtwork.data"),
                  file: form.getValues("releaseArtwork.file"),
                  url: form.getValues("releaseArtwork.url"),
                },
              },
              upload: {
                progress: 0,
                status: "idle",
                registered: false,
              },
            };
            resolve(track);
          };

          reader.onerror = () => {
            reject(new Error("Error reading your file"));
          };
        });

        tracks.push(track);
      } catch (error) {
        console.error("Unsupported file type.");
      }
    }

    /* 
    - we could re-implement tracks array but map
    through and append
    - advantage here is that we can detect a single track and instead of using the file name, use the release title for track title
    */
    const tracklistLength = watch("tracklist").length;
    const totalTrackLength = tracks.length + tracklistLength;

    tracks.forEach((track) => {
      if (totalTrackLength <= 1) {
        append({
          file: track.file,
          url: track.url,
          metadata: {
            title: form.getValues("title"),
            description: form.getValues("description"),
            artwork: form.getValues("releaseArtwork"),
            genre: form.getValues("genre"),
            topics: form.getValues("topics"),
          },
          upload: {
            progress: 0,
            status: "idle",
            registered: false,
          },
        });
      } else {
        append(track);
      }
    });
  }, []);

  const audio = useDropzone({
    accept: { "audio/*": [".wav", ".flac", ".mp3", ".aac"] },
    onDrop: onAudioDrop,
  });

  const handleRemoveCoverArt = (e: any) => {
    e.stopPropagation();

    resetField("releaseArtwork");
  };

  const handleShowDetailsDialog = (index: number) =>
    setShowDetailsDialog({ open: true, index });
  const handleCancelDetailsDialog = (index: number) =>
    setShowDetailsDialog({ open: false, index });

  const handleShowUploadDialog = () => setShowUploadDialog(true);
  const handleCancelUploadDialog = () => setShowUploadDialog(false);

  const isAlbum =
    !!form.getValues("tracklist") && form.getValues("tracklist").length > 1;

  const tracks =
    form.getValues("tracklist") && form.getValues("tracklist").length;

  const onSubmit = async (data: UploadSchema) => {
    console.log(data);
    form.setValue(`uploadStatus`, "uploading");
    try {
      await upload(data, walletAddress, form, irysOpts);
      form.setValue(`uploadStatus`, "success");
      toast.success("Tracks successfully uploaded!");
    } catch (error) {
      console.error(error);
      form.setValue(`uploadStatus`, "failed");
      toast.error("Upload error. Please try again.");
    }
  };

  const handlePlayPause = (trackIndex: number) => {
    if (
      currentlyPlayingIndex !== null &&
      audioRef.current[currentlyPlayingIndex]
    ) {
      // Pause currently playing track
      audioRef.current[currentlyPlayingIndex]?.pause();
    }

    if (currentlyPlayingIndex === trackIndex) {
      // If the clicked track is the currently playing track, just toggle its play state
      setCurrentlyPlayingIndex(null);
    } else {
      // Else, play the new track
      if (audioRef.current[trackIndex]) {
        audioRef.current[trackIndex]?.play();
        setCurrentlyPlayingIndex(trackIndex);
      }
    }
  };

  const { data: totalDuration } = useQuery({
    queryKey: ["totalDuration"],
    enabled: !!getValues("tracklist") && currentTab === "review",
    queryFn: () => getTotalDuration(getValues("tracklist")),
  });

  const { data: profile, isError } = useQuery({
    queryKey: [`profile-${walletAddress}`],
    enabled: !!walletAddress,
    refetchOnWindowFocus: false,
    queryFn: () => {
      if (!walletAddress) {
        return;
      }

      return getAccount(walletAddress, { gateway: appConfig.defaultGateway });
    },
  });

  useEffect(() => {
    window.addEventListener("beforeunload", alertUser);
    return () => {
      window.removeEventListener("beforeunload", alertUser);
    };
  }, []);

  const alertUser = (e: BeforeUnloadEvent) => {
    if (Object.keys(form.formState.touchedFields).length > 0) {
      e.preventDefault();
      e.returnValue = "";
    }
  };

  return (
    <Fullscreen>
      <AppHeader />
      <FormProvider {...form}>
        <Box as="form" onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column">
            <Container
              css={{
                pb: 120,
              }}
            >
              <Tabs
                onValueChange={(e) => {
                  setCurrentTab(e as CurrentTab);
                }}
                css={{ width: "100%" }}
                defaultValue={currentTab}
                value={currentTab}
              >
                <TabsList>
                  <TabsTrigger value="details">Release details</TabsTrigger>
                  <TabsTrigger disabled={!detailsValid()} value="tracklist">
                    Tracklist
                  </TabsTrigger>
                  <TabsTrigger
                    disabled={!detailsValid() || !tracklistValid()}
                    value="monetization"
                  >
                    Monetization
                  </TabsTrigger>
                  <TabsTrigger
                    disabled={!detailsValid() || !tracklistValid()}
                    value="review"
                  >
                    Review
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <Flex css={{ mt: "$5" }} gap="20">
                    <Flex css={{ flex: 1 }} direction="column">
                      <FormRow>
                        <Label htmlFor="title">Title</Label>
                        <TextField
                          id="title"
                          type="text"
                          placeholder="Release Title"
                          {...register("title")}
                          size="3"
                        />
                        {errors.title && reactiveTitle.length < 1 && (
                          <FormHelperError>
                            {errors.title.message}
                          </FormHelperError>
                        )}
                      </FormRow>
                      <FormRow
                        css={{
                          mb: "$5",
                        }}
                      >
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          size="3"
                          id="description"
                          placeholder="Release Description"
                          {...register("description")}
                        />
                        {errors.description &&
                        reactiveDescription.length > 300 ? (
                          <FormHelperError>
                            {errors.description.message}
                          </FormHelperError>
                        ) : (
                          <FormHelperText>Max. 300 characters</FormHelperText>
                        )}
                      </FormRow>
                      <FormRow>
                        <Label htmlFor="genre">Genre</Label>
                        <FormSelect name="genre" values={genres} />
                      </FormRow>
                      <FormRow>
                        <Label htmlFor="topics">Additional Tags</Label>
                        <TextField
                          id="topics"
                          type="text"
                          placeholder="Comma-seperated list of tags describing the mood of your track"
                          {...register("topics")}
                          size="3"
                        />
                        <FormHelperAccordion
                          value="why-tags"
                          triggerLabel="Why add additional tags?"
                        >
                          Adding additional tags that describe the mood of your
                          track can help to boost your discovery across
                          platforms.
                        </FormHelperAccordion>
                      </FormRow>
                      <FormRow>
                        <Label htmlFor="releaseDate">
                          Release Date (optional)
                        </Label>
                        <TextField
                          id="releaseDate"
                          type="date"
                          placeholder="Release Date"
                          {...register("releaseDate")}
                        />
                        {errors.releaseDate ? (
                          <FormHelperError>
                            {errors.releaseDate.message}
                          </FormHelperError>
                        ) : (
                          <FormHelperText
                            css={{
                              position: "relative",
                            }}
                          >
                            Refers to date of initial release and will not
                            effect your track/album showing up as a new release
                          </FormHelperText>
                        )}
                      </FormRow>
                      <FormRow>
                        <Label htmlFor="collectionCode">Album Code</Label>
                        <TextField
                          id="collectionCode"
                          type="text"
                          placeholder="A unique identifier for your album"
                          {...register("collectionCode")}
                          size="3"
                        />
                        <FormHelperText>
                          If left blank, we'll generate one for you
                        </FormHelperText>
                      </FormRow>
                    </Flex>
                    <FormRow
                      css={{
                        height: "max-content",
                      }}
                    >
                      <Label htmlFor="releaseArtwork">Cover Art</Label>
                      <ImageDropzone
                        name="releaseArtwork.file"
                        hidden={!!reactiveArtwork?.url}
                        size="3"
                      >
                        <RxPlus />
                        <Typography
                          size="1"
                          css={{
                            position: "absolute",
                            bottom: "$5",
                            textAlign: "center",
                          }}
                        >
                          Drag and drop your cover art <br /> or click to browse
                        </Typography>

                        {reactiveArtwork.url && (
                          <>
                            <Image
                              css={{
                                width: "100%",
                                height: "100%",
                                position: "absolute",
                                inset: 0,
                              }}
                              src={reactiveArtwork.url}
                            />
                            <IconButton
                              onClick={handleRemoveCoverArt}
                              size="1"
                              css={{
                                br: "$round",
                                backgroundColor: "$whiteA12",
                                boxShadow:
                                  "0 0 0 1px $colors$neutralInvertedA6",
                                backdropFilter: "blur(4px)",
                                color: "$blackA12",
                                position: "absolute",
                                top: "-$2",
                                right: "-$2",

                                "&:hover": {
                                  backgroundColor: "$whiteA11",
                                },

                                "& svg": {
                                  display: "block",
                                  width: "$5",
                                  height: "$5",
                                },
                              }}
                            >
                              <RxTrash />
                            </IconButton>
                          </>
                        )}
                      </ImageDropzone>
                      <Flex direction="column" gap="3">
                        <FormHelperText
                          css={{ position: "relative", lineHeight: "$3" }}
                        >
                          Cover art must be .jpg, .png, .webp or .avif <br />
                          - Recommended size 2000x2000 <br />- Ensure you have
                          rights to the image you choose
                        </FormHelperText>
                        {errors.releaseArtwork && !reactiveArtwork.file && (
                          <FormHelperError
                            css={{
                              position: "relative",
                            }}
                          >
                            {errors.releaseArtwork.file?.message}
                          </FormHelperError>
                        )}
                      </Flex>
                    </FormRow>
                  </Flex>
                </TabsContent>
                <TabsContent value="tracklist">
                  <Container
                    css={
                      {
                        // maxWidth: 700,
                      }
                    }
                  >
                    <Flex
                      css={{ mx: "auto", mt: "$5", width: "100%" }}
                      direction="column"
                      align="center"
                      gap="10"
                    >
                      <DragDropContext onDragEnd={handleDrag}>
                        <Flex
                          as="ul"
                          css={{ width: "100%", listStyleType: "none" }}
                          direction="column"
                        >
                          <Droppable droppableId="items">
                            {(provided, snapshot) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                              >
                                {fields.map((track, index) => {
                                  return (
                                    <Draggable
                                      key={`item[${index}]`}
                                      draggableId={`item-${index}`}
                                      index={index}
                                    >
                                      {(provided, snapshot) => (
                                        <Flex
                                          key={track.id}
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          as="li"
                                          css={{
                                            position: "relative",
                                            width: "100%",
                                            py: "$5",
                                            pr: "$10",
                                            pl: "$10",
                                            // br: "$3",

                                            "&:hover": {
                                              backgroundColor: "$slate2",
                                            },
                                          }}
                                          justify="between"
                                          align="center"
                                        >
                                          <Box
                                            css={{
                                              p: "$2",
                                              position: "absolute",
                                              left: "$2",
                                              display: "grid",
                                              placeItems: "center",

                                              "&:hover": {
                                                color: "$slate12",
                                              },
                                            }}
                                            {...provided.dragHandleProps}
                                          >
                                            <RxDragHandleDots2 />
                                          </Box>
                                          <Flex align="center" gap="5">
                                            <IconButton
                                              type="button"
                                              aria-label="Play/pause file"
                                              variant="ghost"
                                              size="3"
                                              onClick={() =>
                                                handlePlayPause(index)
                                              }
                                            >
                                              {currentlyPlayingIndex ===
                                              index ? (
                                                <BsPauseFill />
                                              ) : (
                                                <BsPlayFill />
                                              )}
                                            </IconButton>
                                            <audio
                                              ref={(el) =>
                                                (audioRef.current[index] = el)
                                              }
                                              onEnded={() =>
                                                setCurrentlyPlayingIndex(null)
                                              }
                                              src={track.url}
                                            ></audio>
                                            <Image
                                              src={
                                                form.getValues("tracklist")[
                                                  index
                                                ].metadata.artwork?.url
                                              }
                                              css={{
                                                width: 40,
                                                height: 40,
                                              }}
                                            />
                                            <Typography>
                                              {track.metadata.title}
                                            </Typography>
                                          </Flex>
                                          <Flex align="center" gap="1">
                                            <IconButton
                                              aria-label="Edit track details"
                                              type="button"
                                              onClick={() =>
                                                handleShowDetailsDialog(index)
                                              }
                                              variant="ghost"
                                              size="2"
                                            >
                                              <RxPencil2 />
                                            </IconButton>
                                            <IconButton
                                              aria-label="Delete track from release"
                                              type="button"
                                              css={{
                                                color: "$red10",

                                                "&:hover": {
                                                  backgroundColor: "$red4",
                                                  color: "$red11",
                                                },

                                                "&:active": {
                                                  backgroundColor: "$red5",
                                                  // color: "$red11",
                                                },
                                              }}
                                              onClick={() => remove(index)}
                                              variant="ghost"
                                              size="2"
                                            >
                                              <RxTrash />
                                            </IconButton>

                                            {errors.tracklist &&
                                              errors.tracklist[index] &&
                                              !trackValid(index) && (
                                                <IconButton
                                                  variant="transparent"
                                                  as="span"
                                                  css={{
                                                    color: "$red10",
                                                    position: "absolute",
                                                    right: "$2",

                                                    "&:hover": {
                                                      color: "$red10",
                                                    },
                                                  }}
                                                >
                                                  <BsFillExclamationCircleFill aria-label="Track contains errors" />
                                                </IconButton>
                                              )}
                                          </Flex>

                                          <DetailsDialog
                                            track={track}
                                            form={form}
                                            index={index}
                                            open={
                                              showDetailsDialog.open &&
                                              index === showDetailsDialog.index
                                            }
                                            onClose={() =>
                                              handleCancelDetailsDialog(index)
                                            }
                                          />
                                        </Flex>
                                      )}
                                    </Draggable>
                                  );
                                })}

                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </Flex>
                      </DragDropContext>
                      <AudioDropContainer {...audio.getRootProps()}>
                        <input {...audio.getInputProps()} />
                        <Flex gap="5" align="center">
                          <Flex direction="column" align="center">
                            <Typography css={{ color: "$slate12" }}>
                              Drag your songs here
                            </Typography>
                            <Typography size="1">
                              .mp3, .wav, .flac, .aiff
                            </Typography>
                          </Flex>
                          <Typography>or</Typography>
                          <Typography css={{ color: "$violet11" }}>
                            Browse your computer
                          </Typography>
                        </Flex>
                      </AudioDropContainer>
                      {errors.tracklist && fields.length <= 0 && (
                        <FormHelperError
                          css={{
                            position: "relative",
                          }}
                        >
                          {errors.tracklist.message}
                        </FormHelperError>
                      )}
                    </Flex>
                  </Container>
                </TabsContent>
                <TabsContent value="monetization">
                  <Flex
                    css={{ mt: "$5", $$formGap: "80px" }}
                    direction="column"
                    gap="3"
                  >
                    <FormRow>
                      <Label htmlFor="tokenQuantity">Content tokens</Label>
                      <TextField
                        css={{ maxWidth: `calc(50% - $$formGap / 2)` }}
                        size="3"
                        type="number"
                        defaultValue={getValues("tokenQuantity")}
                        min={1}
                        max={100}
                        {...register("tokenQuantity")}
                      />
                      {errors.tokenQuantity ? (
                        <FormHelperError>
                          {errors.tokenQuantity.message}
                        </FormHelperError>
                      ) : (
                        <FormHelperAccordion
                          value="content-tokens"
                          triggerLabel="What are content tokens?"
                        >
                          Content tokens are units that represent the royalty
                          share of a song. If you are unsure, we recommend to
                          leave this at 100
                        </FormHelperAccordion>
                      )}
                    </FormRow>
                    <Typography>License information</Typography>
                    <FormRow
                      css={{
                        maxWidth: `calc(50% - $$formGap / 2)`,
                      }}
                    >
                      <Label htmlFor="license.type">UDL</Label>
                      <FormSelect name="license.type" values={udl.type} />
                      <Typography
                        css={{
                          mt: "$1",
                          textDecoration: "underline",
                          cursor: "pointer",
                          alignSelf: "start",

                          "&:hover": {
                            color: "$slate12",
                          },
                        }}
                        as="a"
                        href="https://arwiki.wiki/#/en/Universal-Data-License-How-to-use-it"
                        size="1"
                      >
                        What is UDL?
                      </Typography>
                    </FormRow>
                    {watch("license.type") !== "attribution" &&
                      watch("license.type") !== "public-use" && (
                        <Flex
                          justify="between"
                          css={{
                            gap: "$$formGap",
                          }}
                        >
                          <Flex
                            css={{
                              flex: 1,
                              maxWidth: `calc(50% - $$formGap / 2)`,
                            }}
                            direction="column"
                            gap="5"
                          >
                            <FormRow>
                              <Label htmlFor="license.derivation">
                                Derivation Options
                              </Label>
                              <FormSelect
                                name="license.derivation"
                                values={udl.derivationOpts}
                              />
                            </FormRow>
                            {watch("license.derivation") ===
                              "with-revenue-share" && (
                              <FormRow>
                                <Label htmlFor="license.revShare">
                                  Revenue Share Percentage
                                </Label>
                                <TextField
                                  size="3"
                                  type="number"
                                  defaultValue={getValues("license.revShare")}
                                  min={1}
                                  max={100}
                                  placeholder="Enter a percentage"
                                  {...register("license.revShare")}
                                />
                                {errors.license?.revShare && (
                                  <FormHelperError>
                                    {errors.license?.revShare.message}
                                  </FormHelperError>
                                )}
                              </FormRow>
                            )}
                          </Flex>
                          {watch("license.type") !== "noncommercial" && (
                            <Flex css={{ flex: 1 }} direction="column" gap="5">
                              <FormRow>
                                <Label htmlFor="license.commercial">
                                  Commercial Use
                                </Label>
                                <FormSelect
                                  name="license.commercial"
                                  values={udl.commercialOpts}
                                />
                              </FormRow>
                              {watch("license.commercial") === "with-fee" && (
                                <>
                                  <Flex gap="3">
                                    <FormRow css={{ flex: 1 }}>
                                      <Label htmlFor="license.commercialFee">
                                        Fee
                                      </Label>
                                      <ControlGroup isSelect>
                                        <TextField
                                          size="3"
                                          type="number"
                                          min={1}
                                          max={100}
                                          defaultValue={getValues(
                                            "license.commercialFee"
                                          )}
                                          {...register("license.commercialFee")}
                                        />
                                        <FormSelect
                                          name="license.currency"
                                          values={udl.currencyOpts}
                                        />
                                      </ControlGroup>
                                      {errors.license?.commercialFee && (
                                        <FormHelperError>
                                          {
                                            errors.license?.commercialFee
                                              .message
                                          }
                                        </FormHelperError>
                                      )}
                                    </FormRow>
                                    <FormRow>
                                      <Label htmlFor="license.feeRecurrence">
                                        Recurrence
                                      </Label>
                                      <FormSelect
                                        name="license.feeRecurrence"
                                        values={udl.feeRecurrenceOpts}
                                      />
                                    </FormRow>
                                  </Flex>
                                  <FormRow>
                                    <Label htmlFor="license.paymentMode">
                                      Payment Mode
                                    </Label>
                                    <FormSelect
                                      name="license.paymentMode"
                                      values={udl.paymentModeOpts}
                                    />
                                  </FormRow>
                                </>
                              )}
                            </Flex>
                          )}
                        </Flex>
                      )}
                  </Flex>
                </TabsContent>
                <TabsContent value="review">
                  <Typography
                    size="4"
                    css={{ mt: "$10" }}
                    as="h3"
                    contrast="hi"
                  >
                    Review
                  </Typography>
                  <Flex css={{ mt: "$5" }} direction="column" gap="7">
                    <Flex gap="5">
                      <Image
                        css={{
                          width: 200,
                          height: 200,
                          maxWidth: 200,
                          maxHeight: 200,
                          flex: 1,
                        }}
                        src={getValues("releaseArtwork.url")}
                      />
                      <Flex
                        css={{
                          width: "100%",
                          p: "$5",
                          flex: 1,
                        }}
                        gap="20"
                        align="center"
                        justify="between"
                      >
                        <Flex
                          css={{ height: "100%" }}
                          direction="column"
                          justify="between"
                          gap="10"
                        >
                          <Box>
                            <Typography size="1">
                              {isAlbum ? "Album" : "Single"}
                            </Typography>
                            <Typography size="6" weight="5" contrast="hi">
                              {getValues("title")}
                            </Typography>
                          </Box>
                          <Flex gap="1" align="center">
                            {walletAddress && (
                              <>
                                <Image
                                  css={{
                                    boxSize: "$5",
                                    br: "$round",
                                  }}
                                  src={
                                    profile && profile.avatar
                                      ? profile.avatar
                                      : `https://source.boringavatars.com/marble/20/${
                                          profile?.address || walletAddress
                                        }`
                                  }
                                />
                                <Typography contrast="hi" size="2" weight="5">
                                  {profile?.handle ||
                                    abbreviateAddress({
                                      address: walletAddress,
                                    })}
                                </Typography>
                                <Typography contrast="hi" size="2">
                                  •
                                </Typography>
                              </>
                            )}
                            <Typography contrast="hi" size="2">
                              {tracks} {tracks > 1 ? "tracks" : "track"}
                            </Typography>
                            <Typography contrast="hi" size="2">
                              •
                            </Typography>
                            {totalDuration && (
                              <Typography size="2">
                                {formatDuration({
                                  duration: totalDuration,
                                  options: { suffix: true },
                                })}
                              </Typography>
                            )}
                          </Flex>
                        </Flex>

                        <Flex
                          css={{ height: "100%" }}
                          direction="column"
                          justify="between"
                          align="end"
                        >
                          <Flex direction="column" gap="3" align="end">
                            <Typography size="1">
                              {getValues("genre")}
                            </Typography>
                            {getValues("topics") ? (
                              <Flex
                                css={{ maxWidth: "40ch" }}
                                wrap="wrap"
                                gap="2"
                                justify="end"
                              >
                                {getValues("topics")
                                  ?.split(",")
                                  .map((topic) => (
                                    <Typography
                                      css={{
                                        px: "$3",
                                        py: "$1",
                                        br: "$pill",
                                        backgroundColor: "$slate3",
                                      }}
                                      size="1"
                                    >
                                      {topic.replace(" ", "")}
                                    </Typography>
                                  ))}
                              </Flex>
                            ) : (
                              <Typography size="2">-</Typography>
                            )}
                          </Flex>
                          <Typography css={{ mt: "$1" }}>
                            {formatSchemaValue(getValues("license.type"))}
                          </Typography>
                        </Flex>
                      </Flex>
                    </Flex>
                    <Box css={{ height: 1, backgroundColor: "$slate5" }} />
                    {form.getValues("tracklist")?.length && (
                      <Flex direction="column">
                        {form.watch("tracklist").map((track) => (
                          <TrackItem key={track.url} track={track} />
                        ))}
                      </Flex>
                    )}
                  </Flex>
                  <UploadDialog
                    data={getValues()}
                    open={showUploadDialog}
                    onClose={handleCancelUploadDialog}
                  />
                </TabsContent>
              </Tabs>
            </Container>
          </Flex>
          <Box
            css={{
              borderTop: "$neutralInvertedA6 1px solid",
              backgroundColor: "$neutralA11",
              backdropFilter: "blur(12px)",
              position: "fixed",
              right: 0,
              left: 0,
              bottom: 0,
            }}
          >
            <Container
              css={{
                justifyContent:
                  currentTab === "details" ? "end" : "space-between",

                py: "$5",
              }}
            >
              {currentTab !== "details" && (
                <Button
                  type="button"
                  onClick={handlePrevious}
                  css={{
                    backgroundColor: "$neutralInvertedA3",
                    color: "$neutralInvertedA11",
                    boxShadow: "0 0 0 1px $colors$neutralInvertedA6",
                    backdropFilter: "blur(4px)",

                    "&:hover": {
                      backgroundColor: "$neutralInvertedA4",
                      color: "$neutralInvertedA12",
                      boxShadow: "0 0 0 1px $colors$neutralInvertedA7",
                    },
                  }}
                >
                  Back
                </Button>
              )}
              {currentTab !== "review" && (
                <Button
                  type="button"
                  onClick={handleNext}
                  variant="solid"
                  css={{ alignSelf: "end" }}
                >
                  Next
                </Button>
              )}
              {currentTab === "review" && (
                <>
                  {walletAddress ? (
                    <Flex gap="3">
                      {formState.isSubmitting &&
                        form.watch("uploadStatus") === "uploading" && (
                          <Button
                            onClick={() =>
                              form.setValue("uploadStatus", "cancelled")
                            }
                            type="button"
                            variant="transparent"
                            colorScheme="danger"
                          >
                            Cancel Upload
                          </Button>
                        )}
                      {/* <Button
                        disabled={
                          form.formState.isSubmitting
                          // || form.formState.isSubmitSuccessful
                        }
                        type="button"
                        // variant="solid"
                        onClick={handleShowUploadDialog}
                      >
                        Choose payment method
                      </Button> */}
                      <Button
                        disabled={
                          form.formState.isSubmitting &&
                          form.watch("uploadStatus") === "uploading"
                        }
                        variant="solid"
                      >
                        {form.formState.isSubmitting &&
                        form.watch("uploadStatus") === "uploading"
                          ? "Submitting..."
                          : "Submit release"}
                      </Button>
                    </Flex>
                  ) : (
                    <Button
                      disabled={connecting}
                      type="button"
                      onClick={() =>
                        connect({
                          appName: "Radar",
                          walletProvider: "arconnect",
                          permissions: [
                            "ACCESS_ADDRESS",
                            "ACCESS_PUBLIC_KEY",
                            "SIGNATURE",
                            "SIGN_TRANSACTION",
                          ],
                        })
                      }
                      variant="solid"
                    >
                      {connecting ? "Connecting..." : "Connect to submit"}
                    </Button>
                  )}
                </>
              )}
            </Container>
          </Box>
        </Box>
      </FormProvider>
    </Fullscreen>
  );
};
