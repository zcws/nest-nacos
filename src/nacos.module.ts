import { DynamicModule, Module } from "@nestjs/common";
import { NacosService } from "./nacos.service";
import { NacosOptions } from "./interface";
import { NACOS_OPTIONS } from "./constants";

@Module({})
export class NacosModule {
  static forRoot(options: NacosOptions, global = true): DynamicModule {
    return {
      global,
      module: NacosModule,
      providers: [
        {
          provide: NACOS_OPTIONS,
          useValue: options
        },
        NacosService
      ],
      exports: [NacosService]
    };
  }
}
