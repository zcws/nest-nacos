import { assert } from "chai";
import config from "./config";
import { Test } from "@nestjs/testing";
import { IConfig } from "../src/interface";
import { NacosModule, NacosService } from "../src";

describe("NacosModule", () => {
  let svc: NacosService;
  before(async () => {
    const module = await Test.createTestingModule({
      imports: [NacosModule.forRoot(config as IConfig)]
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
