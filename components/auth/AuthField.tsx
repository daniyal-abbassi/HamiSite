import { Input } from "@/components/ui/input";

type AuthFieldProps = Omit<React.ComponentProps<"input">, "placeholder"> & {
  id: string;
  label: string;
  error?: string;
};

/** The label rests inside the input and lifts on focus or once there is a value. */
export function AuthField({ id, label, required, error, ...input }: AuthFieldProps) {
  return (
    <div>
      <div className="auth-field">
        {/* A blank placeholder is what lets `:placeholder-shown` tell an empty field in CSS. */}
        <Input id={id} name={input.name ?? id} required={required} placeholder=" " aria-invalid={Boolean(error)} {...input} />
        <label htmlFor={id}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      </div>
      {error && <p className="auth-field__error">{error}</p>}
    </div>
  );
}
