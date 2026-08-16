import * as yup from "yup";

/**
 * The synchronous twin of validateForm.
 *
 * Submit-time forms are fine async — nothing is on screen waiting. The
 * checkout screens are not: they show a field's error as soon as it has been
 * touched, computed during render, so an async check would need a state
 * variable and an effect on every screen purely to hold the answer, and each
 * error would land a tick after the keystroke that caused it.
 *
 * Same contract as validateForm — a { field: message } map, empty when valid.
 * Sync yup cannot run async tests; none of ours are.
 */
export function validateFormSync<T extends object>(
  schema: yup.ObjectSchema<Record<string, unknown>>,
  data: T,
): Record<string, string> {
  try {
    schema.validateSync(data, { abortEarly: false });
    return {};
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      err.inner.forEach((e) => {
        if (e.path && !errors[e.path]) errors[e.path] = e.message;
      });
      return errors;
    }
    return {};
  }
}

export async function validateForm<T extends object>(
  schema: yup.ObjectSchema<Record<string, unknown>>,
  data: T
): Promise<Record<string, string>> {
  try {
    await schema.validate(data, { abortEarly: false });
    return {};
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      err.inner.forEach((e) => {
        if (e.path && !errors[e.path]) errors[e.path] = e.message;
      });
      return errors;
    }
    return {};
  }
}

export async function validateAndSetErrors<T extends object>(
  schema: yup.ObjectSchema<Record<string, unknown>>,
  data: T,
  setErrors: (errors: Record<string, string>) => void
): Promise<boolean> {
  const errors = await validateForm(schema, data);
  if (Object.keys(errors).length > 0) {
    setErrors(errors);
    return false;
  }
  return true;
}
