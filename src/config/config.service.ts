import { Injectable } from "@nestjs/common";
import { NacosConfigClient } from "nacos";
import { getLogger } from "log4js";
import { parse } from "yaml";

type C = {
  server: string;
  accessKey: string;
  secretKey: string;
  namespace: string;
}

@Injectable()
export class NacosConfigService {
  #configs = new Map();
  #client: NacosConfigClient;
  #logger = getLogger("NacosConfig");

  constructor(c: C) {
    this.#client = new NacosConfigClient({
      accessKey: c.accessKey,
      secretKey: c.secretKey,
      serverAddr: c.server,
      namespace: c.namespace
    });
  }

  async get<T>(dataId: string, group = "DEFAULT_GROUP"): Promise<T> {
    const key = NacosConfigService.key(dataId, group);
    if (!this.#configs.has(key)) {
      await this.loadConfig(dataId, group);
    }

    return this.#configs.get(key);
  }

  private static key(dataId: string, group: string) {
    return `${dataId}#${group}`;
  }

  private async loadConfig(dataId: string, group: string) {
    const content = await this.#client.getConfig(dataId, group);
    this.setConfig(dataId, group, content);
    this.#client.subscribe({ dataId, group }, content => this.setConfig(dataId, group, content));
  }

  private setConfig(dataId: string, group: string, content: string) {
    const key = NacosConfigService.key(dataId, group);
    this.#configs.set(key, parse(content));
    this.#logger.info("加载配置", key, content);
  }
}
