import { Track, UploadSchema, uploadSchema } from "@/modules/upload/schema";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const useDynamicForm = () => {
  const form = useForm<UploadSchema>({
    // resolver: zodResolver(uploadSchema),
    defaultValues: {
      genre: "none",
      // test: [{ name: "Hello", value: "World" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tracklist",
  });

  // const handleAppend = (track: Track) => append(track);

  // const handleRemove = (index: number) => {
  //   remove(index);
  // };

  return { form, fields, append, remove };
};
