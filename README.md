# `nacos`

> 基于NestJs框架，用于注册Nacos服务、可注入配置

## Usage

```
import { Module, OnModuleInit } from "@nestjs/common";
import { NamingService, NacosModule } from "nest-nacos";

@Module({
  imports: [
    // 可注入获取nacos配置的服务
    NacosModule.forRoot({
      group: process.env.group,
      dataId: process.env.dataId,
      server: process.env.server,
      accessKey: process.env.accessKey,
      secretKey: process.env.secretKey,
      namespace: process.env.namespace
    })
  ]
})

export class AppModule implements OnModuleInit {
  constructor(private readonly nacos: NacosService) {
  }

  async onModuleInit(): Promise<void> {
    // 注册服务名
    await this.nacos.register("service-name");
  }
}
```
