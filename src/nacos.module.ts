import { DynamicModule, Module } from "@nestjs/common";
import { NacosService } from "./nacos.service";
import { Type } from "@nestjs/common/interfaces/type.interface";
import { Abstract } from "@nestjs/common/interfaces/abstract.interface";

export interface IConfig {
  port: number;
  enable?: boolean;
  namespace: string;
  serverList: string;
}

interface IProvider {
  useFactory: (...args: any[]) => IConfig;
  inject: Array<Type<any> | string | symbol | Abstract<any> | Function>;
}


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
