# `nacos`

> 基于NestJs框架，用于注册Nacos服务、可注入配置

## Usage

```
import { Module, OnModuleInit } from "@nestjs/common";
import { NacosService, NacosModule } from "@hehu/nacos";

@Module({
  imports: [
    NacosModule.forRoot()
  ]
})

export class AppModule implements OnModuleInit {
  constructor(private readonly nacos: NacosService) {
  }

  async onModuleInit(): Promise<void> {
    await this.nacos.register("service-name");
  }
}
```
