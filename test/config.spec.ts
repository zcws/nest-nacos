import { NacosConfigService } from "../src/config/config.service";
import { assert } from "chai";

describe("ConfigService", () => {
  it("Get", async () => {
    const c = new NacosConfigService({
      server: "",
      accessKey: "",
      secretKey: "",
      namespace: ""
    });
    const data = await c.get("x", "xx");
    assert.ok(data);
  });
});
