import { Controller, useFormContext } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectPortal,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from "@/ui/Select";
import { RxChevronDown } from "react-icons/rx";
import { genres } from "@/data/genres";
import { UDLValues, udl } from "@/data/license";
import { formatSchemaValue } from "@/utils";

interface FormSelectProps {
  name: string;
  values: typeof genres | UDLValues[keyof UDLValues] | any[];
  disabled?: boolean;
  capitalizeItems?: boolean;
}

export const FormSelect = ({
  values,
  name,
  disabled,
  capitalizeItems,
}: FormSelectProps) => {
  const { control, getValues } = useFormContext();

  return (
    <Controller
      render={({ field: { onChange } }) => (
        <Select
          defaultValue={getValues(name)}
          onValueChange={(e) => onChange(e)}
          value={getValues(name)}
        >
          <SelectTrigger disabled={disabled}>
            <SelectValue />
            <SelectIcon>
              <RxChevronDown />
            </SelectIcon>
          </SelectTrigger>
          <SelectPortal>
            <SelectContent sideOffset={8}>
              <SelectViewport>
                {values.map((value) => (
                  <SelectItem key={value} value={value}>
                    {values === genres ? value : formatSchemaValue(value)}
                  </SelectItem>
                ))}
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </Select>
      )}
      name={name}
      control={control}
    />
  );
};
