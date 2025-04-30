export class Util {
  static replacePlaceholdersWithEnvVars<T extends object>(obj: T):T {
    const rex = /\$\{([A-Z_]+)}/g;

    function replaceValue(value: string | object) {
      if (typeof value === "string") {
        value = value.replace(rex, (match, envVar) => {
          return process.env[envVar] ?? match;
        });
      } else if (value && typeof value === "object") {
        for (const k in value) {
          if (Object.hasOwn(value, k)) {
            value[k] = replaceValue(value[k]);
          }
        }
      }

      return value;
    }

    return replaceValue(obj) as T;
  }
}
