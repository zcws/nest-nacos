import { DynamicModule, Module} from "@nestjs/common";
import { NacosService } from "./nacos.service";

@Module({})
export class NacosModule {
  static forRoot(): DynamicModule {
    const providers = [NacosService];
    return {
      providers,
      exports: providers,
      module: NacosModule
    };
  }
}
