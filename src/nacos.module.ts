import { DynamicModule, FactoryProvider, Module } from "@nestjs/common";
import { NacosService } from "./nacos.service";

export interface IConfig {
  port: number;
  enable?: boolean;
  namespace: string;
  serverList: string;
}

type IProvider = Omit<FactoryProvider<IConfig>, 'provide'>;

@Module({})
export class NacosModule {
  static forRoot(options: IConfig | IProvider): DynamicModule {
    let provider;
    const { port, namespace, serverList } = options as IConfig;
    if (port && namespace && serverList) {
      provider = {
        provide: "Config",
        useValue: options
      };
    } else {
      provider = {
        ...options as IProvider,
        provide: "Config",
      };
    }

    return {
      module: NacosModule,
      exports: [NacosService],
      providers: [provider, NacosService]
    };
  }
}
