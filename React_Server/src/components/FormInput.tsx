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
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const FormInput = ({
  label,
  type = "text",
  placeholder,
  multiline,
  required,
  value,
  name,
  onChange,
}: FormInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={name || label} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {multiline ? (
        <Textarea
          id={name || label}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="min-h-[100px]"
        />
      ) : (
        <Input
          id={name || label}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
        />
      )}
    </div>
  );
};

export default FormInput;
