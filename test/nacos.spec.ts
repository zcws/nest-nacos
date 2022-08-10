import { assert } from "chai";
import { env } from "process";
import { Test } from "@nestjs/testing";
import { NacosModule, NacosService, IOptions } from "../src";

describe("NacosModule", () => {
  let svc: NacosService;
  before(async () => {
    const options: IOptions = {
      server: env.server as string,
      accessKey: env.accessKey,
      secretKey: env.secretKey,
      namespace: env.namespace as string,
      config: {
        subscribe: true,
        group: env.group as string,
        dataId: env.dataId as string,
        commons: [
          {
            group: env["shared.group"] as string,
            dataId: env["shared.dataId"] as string
          }
        ]
      }
    };
    const module = await Test.createTestingModule({
      imports: [NacosModule.forRoot(options)]
    }).compile();
    svc = module.get<NacosService>(NacosService);
  });

  it("getConfig", async () => {
    const data = await svc.getConfig();
    assert.ok(data);
  });

  it("NamingService", async () => {
    const res = await svc.register("test", true);
    assert.ok(res);
  });
});
