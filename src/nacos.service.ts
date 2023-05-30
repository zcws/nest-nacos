import { NacosConfigClient, NacosNamingClient } from "nacos";
import { Injectable, OnModuleDestroy, Logger } from "@nestjs/common";
import { parse } from "yaml";
import { EventEmitter } from "events";
import { ClientOptions, IOptions } from "./interface";
import { networkInterfaces } from "os";
import * as assert from "assert";

@Injectable()
export class NacosService extends EventEmitter implements OnModuleDestroy {
  #config;
  #namingClient;
  #isReady = false;
  logger = new Logger("Nacos");
  #configClient: NacosConfigClient;

  constructor(private readonly opt: IOptions) {
    super();

    assert.ok(this.opt.server, "server must not be null!");
    assert.ok(this.opt.namespace, "namespace must not be null!");
    assert.ok(this.opt.accessKey, "accessKey must not be null!");
    assert.ok(this.opt.secretKey, "secretKey must not be null!");

    if (!opt.debug && this.logger.localInstance.setLogLevels) {
      this.logger.localInstance.setLogLevels(["error"]);
    }

    this.setMaxListeners(0);

    const options: ClientOptions = {
      serverAddr: this.opt.server,
      namespace: this.opt.namespace,
      accessKey: this.opt.accessKey,
      secretKey: this.opt.secretKey
    };

    if (/^http/.test(this.opt.server)) {
      // http格式转化成hostname
      const url = new URL(this.opt.server);
      options.serverAddr = url.hostname;
      if (url.port) {
        options.serverPort = Number(url.port);
      }
    }

    this.#configClient = new NacosConfigClient(options);
    if (this.opt.config) {
      // 加载配置文件
      this.loadAllConfig()
        .catch((err: Error) => this.logger.error(err.message, err.stack));
    }
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
  private async loadAllConfig() {
    if (!this.opt.config) {
      assert.ok(this.opt.config, "config must not be null!");
    }

    const { dataId, group, commons = [] } = this.opt.config;
    await this.loadConfig(dataId, group);
    for (const c of commons) {
      await this.loadConfig(c.dataId, c.group);
    }

    if (this.opt.config.subscribe) {
      this.#configClient.subscribe({ dataId, group }, content => this.setConfig(content));
    }

    this.#isReady = true;
    this.emit("ready");
  }

  private async loadConfig(dataId: string, group = "DEFAULT_GROUP"): Promise<void> {
    const content = await this.#configClient.getConfig(dataId, group);
    assert.ok(content, `config must not be null!dataId:${dataId},group:${group}`);
    this.setConfig(content);
  }

  private setConfig(content): void {
    this.#config = Object.assign(this.#config || {}, parse(content));
    this.logger.debug(`加载配置:${content}`);
  }

  private async getNamingClient(): Promise<NacosNamingClient> {
    if (this.#namingClient) {
      return this.#namingClient;
    }

    this.#namingClient = new NacosNamingClient({
      serverList: this.opt.server,
      namespace: this.opt.namespace,
      logger: this.opt.logger || console
    });

    await this.#namingClient.ready();
    this.logger.debug("ready");
    return this.#namingClient;
  }

  async onModuleDestroy(): Promise<void> {
    await this.#namingClient?.close();
    this.logger.debug("closed");
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
    this.logger.debug("register");

    return true;
  }
}
