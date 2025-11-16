import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FormInputProps {
  label: string;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const FormInput = ({
  label,
  type = "text",
  placeholder,
  multiline,
  required,
  value,
  onChange,
}: FormInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={label} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {multiline ? (
        <Textarea
          id={label}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="min-h-[100px]"
        />
      ) : (
        <Input
          id={label}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
};

export default FormInput;
