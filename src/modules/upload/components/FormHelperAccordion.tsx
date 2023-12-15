import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/ui/Accordion";

interface FormHelperAccordionProps {
  value: string;
  triggerLabel: string;
  children: React.ReactNode;
}

export const FormHelperAccordion = ({
  value,
  triggerLabel,
  children,
}: FormHelperAccordionProps) => {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={value}>
        <AccordionTrigger
          css={{
            fontSize: "$1",
            gap: "$1",

            "& svg": {
              color: "$slate11",
            },

            "[data-state=open] &": { color: "$slate11" },
          }}
        >
          {triggerLabel}
        </AccordionTrigger>
        <AccordionContent
          css={{
            fontSize: "$1",
            lineHeight: "$2",
            maxWidth: "48ch",

            "& div": {
              px: 0,
            },
          }}
        >
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
