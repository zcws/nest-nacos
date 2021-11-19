# `nacos`

> 基于NestJs框架，用于注册Nacos服务、可注入配置

## Usage

```
import { Module, OnModuleInit } from "@nestjs/common";
import { NacosService, NacosModule } from "nest-nacos";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
   ConfigModule.forRoot({
      isGlobal: true
    }),
    // 可注入获取nacos配置的服务
    NacosModule.forRoot({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.get("NACOS");
      }
    })
    // 或者直接传入nacos的相关配置
    // NacosModule.forRoot({
    //   port: 8000,
    //   namespace: "namespace",
    //   serverList: "serverList"
    // })
  ]
})

export class AppModule implements OnModuleInit {
  constructor(private readonly nacos: NacosService) {
  }

  async onModuleInit(): Promise<void> {
    // 注册服务名
    await this.nacos.register("service-name");
    // 同时支持传入IP，端口
    // await this.nacos.register("service-name", { ip: "127.0.0.1", port: 8000 });
  }
}
```
