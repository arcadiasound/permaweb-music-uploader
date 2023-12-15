import { Controller, useFormContext } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { ChangeEventHandler, FC, useCallback } from "react";
import {
  ImageDropContainer,
  ImageDropContainerVariants,
} from "./ImageDropContainer";
import { CSS } from "@/stitches.config";

interface ImageDropzoneProps extends ImageDropContainerVariants {
  name: string;
  multiple?: boolean;
  children: React.ReactNode;
  css?: CSS;
}

export const ImageDropzone = ({
  name,
  multiple = false,
  children,
  css,
  hidden,
  size,
  ...rest
}: ImageDropzoneProps) => {
  const { control } = useFormContext();

  return (
    <Controller
      render={({ field: { onChange } }) => (
        <Dropzone
          hidden={hidden}
          size={size}
          css={css}
          multiple={multiple}
          onChange={(e) =>
            onChange(multiple ? e.target.files : e.target.files?.[0] ?? null)
          }
          {...rest}
        >
          {children}
        </Dropzone>
      )}
      name={name}
      control={control}
    />
  );
};

const Dropzone: FC<{
  multiple?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  children: React.ReactNode;
  css?: CSS;
  hidden: ImageDropContainerVariants["hidden"];
  size: ImageDropContainerVariants["size"];
}> = ({ multiple, css, children, onChange, hidden, size, ...rest }) => {
  const { setValue } = useFormContext();

  const onImageDrop = useCallback((acceptedFiles: File[]) => {
    // Do something with the files
    const imageFile = acceptedFiles[0];

    console.log(imageFile);

    const reader = new FileReader();

    reader.onabort = () => console.log("file reading was aborted");
    reader.onerror = () => console.log("file reading has failed");

    reader.onload = () => {
      let blob;
      let url;
      blob = new Blob([imageFile], { type: imageFile.type });
      url = window.URL.createObjectURL(blob);

      let imageFileInfo = {
        data: imageFile,
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type,
        url,
      };

      console.log(reader.result);

      //   setReleaseArtwork(url);
      //   return imageFile;
      setValue("releaseArtwork.file", imageFile);
      setValue("releaseArtwork.url", url);
      // setValue("releaseArtwork.data", reader.result as ArrayBuffer);
    };

    reader.readAsArrayBuffer(imageFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple,
    accept: { "image/*": [".jpeg", ".png", ".webp", ".avif"] },
    maxFiles: 1,
    ...rest,
    onDrop: onImageDrop,
  });

  return (
    <ImageDropContainer
      css={css}
      hovered={isDragActive}
      hidden={hidden}
      size={size}
      {...getRootProps()}
    >
      <input {...getInputProps({ onChange })} />
      {children}
    </ImageDropContainer>
  );
};
