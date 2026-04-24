import { useCombobox } from "downshift";
import { useState, InputHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

type Option = {
  label: string;
  value: string | number;
};

type CustomSelectProps = {
  options?: Option[];
  error?: boolean | null | undefined;
  value: Option["value"] | null | undefined;
  onChange: (value: Option["value"] | null) => void;
  placeholder?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">; // 👈 enable props

const commonInputClass =
  "w-full p-3 outline-none text-sm placeholder:text-[#C1C7D1] bg-[#C1C7D133] border border-gray-200 rounded-3xl";

const errorClass = (error?: boolean | null | undefined) =>
  error
    ? "border-2 border-red-400"
    : "border-gray-200 focus:border-transparent focus:ring ring-[#015C95]";

export default function CustomSelect({
  options = [],
  error,
  value,
  onChange,
  placeholder = "Select...",
  ...props // 👈 collect all extra props
}: CustomSelectProps) {
  const [inputValue, setInputValue] = useState<string>("");

  const selectedItem: Option | null =
    options.find((opt) => opt.value === value) || null;

  const filteredItems: Option[] = options.filter((item) =>
    item.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
    getToggleButtonProps,
  } = useCombobox<Option>({
    items: filteredItems,
    selectedItem: null,
    inputValue,
    itemToString: () => "",

    stateReducer: (state, actionAndChanges) => {
      const { type, changes } = actionAndChanges;

      switch (type) {
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputKeyDownEnter: {
          const clicked = changes.selectedItem as Option | null;

          if (clicked) {
            onChange(value === clicked.value ? null : clicked.value);
          }

          setInputValue("");

          return {
            ...changes,
            selectedItem: null,
            inputValue: "",
            isOpen: false,
          };
        }

        case useCombobox.stateChangeTypes.InputBlur: {
          setInputValue("");
          return { ...changes, inputValue: "" };
        }

        default:
          return changes;
      }
    },

    onInputValueChange: ({ inputValue: newVal }) => {
      if (newVal === selectedItem?.label) return;
      setInputValue(newVal || "");
    },
  });

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <input
          {...getInputProps({
            ...props, // 👈 pass props here (disabled, onBlur, etc.)
            onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
              props.onKeyDown?.(e); // preserve user handler

              if (e.key === "Backspace") {
                if (!inputValue && selectedItem) {
                  setInputValue(selectedItem.label.slice(0, -1));
                  onChange(null);
                }
              }
            },
          })}
          value={selectedItem && !inputValue ? selectedItem.label : inputValue}
          placeholder={placeholder}
          className={`${commonInputClass} ${errorClass(error)} pr-10 ${
            props.className || ""
          }`}
        />

        <button
          type="button"
          {...getToggleButtonProps({
            disabled: props.disabled, // 👈 important for disabled
          })}
          className="absolute right-4"
        >
          <ChevronDown size={18} color="#717781" />
        </button>
      </div>

      <ul
        {...getMenuProps()}
        className={`absolute z-50 flex flex-col gap-1 mt-1 p-1 w-full bg-white border border-gray-500 rounded-sm shadow-md max-h-60 overflow-y-auto ${
          !isOpen ? "hidden" : ""
        }`}
      >
        {isOpen &&
          filteredItems.map((item, index) => {
            const isSelected = value === item.value;

            return (
              <li
                key={item.value}
                {...getItemProps({ item, index })}
                className={`px-3 py-2 flex items-center justify-between gap-1 w-full cursor-pointer text-sm rounded
                  ${highlightedIndex === index ? "bg-gray-200" : ""}
                  ${isSelected ? "font-medium bg-gray-200" : ""}
                `}
              >
                {item.label} {isSelected && "✔"}
              </li>
            );
          })}

        {isOpen && filteredItems.length === 0 && (
          <li className="px-3 py-2 text-sm">No results found</li>
        )}
      </ul>
    </div>
  );
}