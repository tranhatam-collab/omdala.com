export function runtimeCopyMode(available, required) {
  if (!available.includes(required))
    throw new Error(
      `Node runtime architectures (${available.join(", ")}) does not contain ${required}.`,
    );
  return available.length > 1 ? "thin" : "copy";
}
