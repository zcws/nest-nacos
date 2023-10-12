import { assert } from "chai";
import { env } from "process";
import { Test } from "@nestjs/testing";
import { NacosModule, NacosService, NacosOptions } from "../src";

describe("NacosModule", () => {
  let svc: NacosService;
  before(async () => {
    const options: NacosOptions = {
      server: env.NACOS_SERVER as string,
      accessKey: env.NACOS_ACCESS_KEY as string,
      secretKey: env.NACOS_SECRET_KEY as string,
      namespace: env.NACOS_NAMESPACE as string,
      config: {
        subscribe: true,
        group: env.NACOS_GROUP as string,
        dataId: env.NACOS_DATA_ID as string,
        commons: [
          {
            group: env.NACOS_SHARED_GROUP as string,
            dataId: env.NACOS_SHARED_DATA_ID as string
          }
        ]
      }
    };
    const module = await Test.createTestingModule({
      imports: [NacosModule.forRoot(options)]
    })
      .compile();
    svc = module.get<NacosService>(NacosService);
  });

  it("getConfig", async () => {
    const data = await svc.getConfig<{ key: string }>("key");
    assert.ok(data);
  });

  it("NamingService", async () => {
    const res = await svc.register("test", true);
    assert.ok(res);
  });
});
