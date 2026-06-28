export class PermissionsUtil {
  /**
   * Flattens a permission object into an array of strings.
   *
   * Example:
   * ```ts
   * {
   *   user: ["read", "write"],
   *   admin: ["delete"]
   * }
   * ```
   * becomes:
   * ```ts
   * ["user:read", "user:write", "admin:delete"]
   * ```
   *
   * - Trims whitespace from service and action names
   * - Skips invalid/empty values
   * - Removes duplicates (via Set)
   *
   * @param input Object where keys are services and values are arrays of actions
   * @returns Flattened array of permission strings in `service:action` format
   */
  static flatten(input: Record<string, string[]>): string[] {
    if (!input) return [];

    const result = new Set<string>();

    for (const [service, actions] of Object.entries(input)) {
      const serviceTrimmed = service?.trim();
      if (!serviceTrimmed) continue;

      if (!Array.isArray(actions)) continue;

      for (const action of actions) {
        const actionTrimmed = action?.trim();
        if (!actionTrimmed) continue;

        result.add(`${serviceTrimmed}:${actionTrimmed}`);
      }
    }

    return Array.from(result);
  }

  /**
   * Converts a flattened permission array back into an object form.
   *
   * Example:
   * ```ts
   * ["user:read", "user:write", "admin:delete"]
   * ```
   * becomes:
   * ```ts
   * {
   *   user: ["read", "write"],
   *   admin: ["delete"]
   * }
   * ```
   *
   * - Splits each string by the first `:`
   * - Trims whitespace
   * - Ignores invalid entries
   * - Removes duplicates (via Set)
   *
   * @param input Array of permission strings in `service:action` format
   * @returns Object grouped by service with arrays of actions
   */
  static unflatten(input: string[]): Record<string, string[]> {
    const result: Record<string, Set<string>> = {};

    if (!Array.isArray(input)) return {};

    for (const perm of input) {
      const trimmed = perm?.trim();
      if (!trimmed) continue;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;

      const service = trimmed.slice(0, colonIndex).trim();
      const action = trimmed.slice(colonIndex + 1).trim();

      if (!service || !action) continue;

      if (!result[service]) {
        result[service] = new Set();
      }

      result[service].add(action);
    }

    const finalResult: Record<string, string[]> = {};
    for (const [service, actions] of Object.entries(result)) {
      finalResult[service] = Array.from(actions);
    }

    return finalResult;
  }
}
