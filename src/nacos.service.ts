import { NacosConfigClient } from "nacos";
import * as Debug from "debug";
import { parse } from "yaml";
import { EventEmitter } from "events";
import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { IConfig } from "./interface";
import * as Nacos from "nacos";
import { networkInterfaces } from "os";
import * as assert from "assert";

// eslint-disable-next-line
const { NacosNamingClient } = Nacos as any;

@Injectable()
export class NacosService extends EventEmitter implements OnModuleDestroy {
  #config;
  #isReady = false;
  debug = Debug("nacos");
  #configClient: NacosConfigClient;
  #namingClient: typeof NacosNamingClient;

  constructor(private readonly conf: IConfig) {
    super();

    assert.ok(this.conf.server, "server must not be null!");
    assert.ok(this.conf.namespace, "namespace must not be null!");
    assert.ok(this.conf.accessKey, "accessKey must not be null!");
    assert.ok(this.conf.secretKey, "secretKey must not be null!");
    assert.ok(this.conf.dataId, "dataId must not be null!");
    assert.ok(this.conf.group, "group must not be null!");

    this.#configClient = new NacosConfigClient({
      serverAddr: this.conf.server,
      namespace: this.conf.namespace,
      accessKey: this.conf.accessKey,
      secretKey: this.conf.secretKey
    });
    // 加载配置文件
    this.loadConfig().catch(err => this.debug(err));
  }

  async getConfig<T>(key?: string): Promise<T> {
    if (this.#isReady) {
      return this.getConfigData<T>(key);
    } else {
      return new Promise((resolve, reject) => {
        this.once("ready", () => {
          try {
            const conf = this.getConfigData<T>(key);
            resolve(conf);
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  }

  private getConfigData<T>(key?: string): T {
    if (key) {
      if (Object.hasOwn(this.#config, key)) {
        return this.#config[key];
      }

      throw new Error(`获取参数失败:${key}`);
    } else {
      return this.#config;
    }
  }

  /**
   * 加载配置文件
   * */
  private async loadConfig() {
    const { dataId, group = "DEFAULT_GROUP" } = this.conf;
    const content = await this.#configClient.getConfig(dataId, group);
    this.setConfig(content);
    this.#configClient.subscribe({ dataId, group }, content => this.setConfig(content));
    this.#isReady = true;
    this.emit("ready");
  }

  private setConfig(content: string) {
    this.#config = parse(content);
    this.debug("加载配置", content);
  }

  private async getNamingClient(): Promise<typeof NacosNamingClient> {
    if (this.#namingClient) {
      return this.#namingClient;
    }

    this.#namingClient = new NacosNamingClient({
      serverList: this.conf.server,
      namespace: this.conf.namespace
    });

    await this.#namingClient.ready();
    this.debug("ready");
    return this.#namingClient;
  }

  async onModuleDestroy(): Promise<void> {
    await this.#namingClient?.close();
    this.debug("closed");
  }


  /**
   * @param name 应用名称
   * @param enable 是否注册，开发环境默认不注册
   * */
  async register(name: string, enable = process.env.NODE_ENV !== "development"): Promise<boolean> {
    if (!enable) {
      return false;
    }

    const networks = networkInterfaces();
    const [ip] = Object.values(networks)
      .flat()
      .filter(x => x?.family === "IPv4" && !x.internal)
      .map(x => x?.address);

    assert.ok(ip, "ip must not be null!");

    const client = await this.getNamingClient();
    await client.registerInstance(name, {
      ip,
      port: await this.getConfig("port")
    });
    this.debug("register");

    return true;
  }
}
