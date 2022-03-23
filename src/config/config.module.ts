import { DynamicModule, FactoryProvider, Module } from "@nestjs/common";
import { NacosConfigService } from "./config.service";
import { ConfigService } from "@nestjs/config";
import { NACOS_CONFIG } from "../constant";

export interface IConfig {
  port: number;
  enable?: boolean;
  namespace: string;
  serverList: string;
}

const provider = {
  inject: [ConfigService],
  provide: NacosConfigService,
  useFactory(cs: ConfigService): NacosConfigService {
    const conf = cs.get(NACOS_CONFIG);
    if (!conf) {
      throw new Error("参数错误");
    }

    return new NacosConfigService(conf);
  }
};

@Module({
  providers: [provider],
  exports: [provider]
})
export class ConfigModule {
}
