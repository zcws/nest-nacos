export class Util{
  static  replacePlaceholdersWithEnvVars(obj: Dict): Dict {
    const rex = /\$\{([A-Z_]+)}/g;
    function replaceValue(value: unknown) {
      if (typeof value === "string") {
        value = value.replace(rex, (match, envVar) => {
          return process.env[envVar] ?? match;
        });
      }

      return value;
    }

    for (const key in obj) {
      obj[key] = replaceValue(obj[key]);
    }

    return obj;
  }
}
