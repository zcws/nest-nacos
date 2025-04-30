import { assert } from "chai";
import { Util } from "../src/util";

describe("Util", () => {
  it("replacePlaceholdersWithEnvVars", async () => {
    const config = {
      host:"mysql-${ENV}.svc"
    };
    const c = Util.replacePlaceholdersWithEnvVars(config);
    assert.isString(c.host);
  });
});
