import { DynamicModule, Module } from "@nestjs/common";
import { NacosService } from "./nacos.service";
import { IOptions } from "./interface";

@Module({})
export class NacosModule {
  static forRoot(config: IOptions, global = true): DynamicModule {
    return {
      global,
      module: NacosModule,
      providers: [
        {
          provide: NacosService,
          useFactory() {
            return new NacosService(config);
          }
        }
      ],
      exports: [NacosService]
    };
  }
}
