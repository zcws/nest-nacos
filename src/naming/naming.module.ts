import { Module } from "@nestjs/common";
import { NacosNamingService } from "./naming.service";
import { ConfigService } from "@nestjs/config";
import { NACOS_NAMING } from "../constant";

export interface IConfig {
  port: number;
  enable?: boolean;
  namespace: string;
  serverList: string;
}

const provider = {
  inject: [ConfigService],
  provide: NacosNamingService,
  useFactory(cs: ConfigService) {
    const conf = cs.get<IConfig>(NACOS_NAMING);
    if (conf) {
      return new NacosNamingService(conf);
    }

    throw new Error("参数错误");
  }
};

@Module({
  providers: [provider],
  exports: [provider]
})
export class NamingModule {
}
