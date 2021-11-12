import { DynamicModule, Module} from "@nestjs/common";
import { NacosService } from "./nacos.service";
import {ConfigService} from "@nestjs/config";

@Module({})
export class NacosModule {
  static forRoot(): DynamicModule {
    return {
      providers: [
        NacosService,
        {
          provide: ConfigService,
          useClass: ConfigService
        }
      ],
      exports: [NacosService],
      module: NacosModule
    };
  }
}
