import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface SearchableSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    placeholder: string;
    searchPlaceholder: string;
    icon?: React.ReactNode;
}

export const SearchableSelect = ({
    value,
    onValueChange,
    options,
    placeholder,
    searchPlaceholder,
    icon,
}: SearchableSelectProps) => {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <div className="flex items-center gap-2">
                        {icon}
                        <span className={cn(!value && "text-muted-foreground")}>
                            {value
                                ? options.find((option) => option.value === value)?.label
                                : placeholder}
                        </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandEmpty>No option found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={(currentValue:any) => {
                                    onValueChange(currentValue === value ? "" : currentValue);
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === option.value ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
