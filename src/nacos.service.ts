import { NacosConfigClient, NacosNamingClient, Instance } from "nacos";
import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { parse } from "yaml";
import { EventEmitter } from "events";
import { ClientOptions, NacosOptions } from "./interface";
import { networkInterfaces } from "os";
import * as assert from "assert";
import Debug from "debug";
import { NACOS_OPTIONS } from "./constants";
import { Util } from "./util";

interface IService {
  name: string;
  instance?: Instance;
}

@Injectable()
export class NacosService extends EventEmitter implements OnModuleDestroy {
  #config = {};
  #isReady = false;
  #service: IService;
  debug = Debug("nacos");
  #configClient: NacosConfigClient;
  #namingClient: NacosNamingClient | undefined;

  constructor(@Inject(NACOS_OPTIONS) private readonly opt: NacosOptions) {
    super();

    assert.ok(this.opt.server, "server must not be null!");
    assert.ok(this.opt.namespace, "namespace must not be null!");
    assert.ok(this.opt.accessKey, "accessKey must not be null!");
    assert.ok(this.opt.secretKey, "secretKey must not be null!");

    this.setMaxListeners(0);
    this.#service = { name: "nest-service" };

    const options: ClientOptions = {
      serverAddr: this.opt.server,
      namespace: this.opt.namespace,
      accessKey: this.opt.accessKey,
      secretKey: this.opt.secretKey
    };

    if (!Object.hasOwn(this.opt, "enableEnvVars")) {
      // 默认启用环境变量填充
      this.opt.enableEnvVars = true;
    }

    if (/^http/.test(this.opt.server)) {
      // http格式转化成hostname
      const url = new URL(this.opt.server);
      options.serverAddr = url.host;
    }

    this.#configClient = new NacosConfigClient(options);
    if (this.opt.config) {
      // 加载配置文件
      this.loadAllConfig()
        .catch((err: Error) => this.debug(err.message, err.stack));
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
      return this.#config as T;
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
      this.#configClient.subscribe({ dataId, group }, (content: string) => this.setConfig(content));
    }

    this.#isReady = true;
    this.emit("ready");
  }

  private async loadConfig(dataId: string, group = "DEFAULT_GROUP"): Promise<void> {
    const content = await this.#configClient.getConfig(dataId, group);
    assert.ok(content, `config must not be null!dataId:${dataId},group:${group}`);
    this.setConfig(content);
  }

  private setConfig(content: string): void {
    let config = parse(content);
    if (this.opt.enableEnvVars) {
      // 启用环境变量填充
      config = Util.replacePlaceholdersWithEnvVars(config);
    }


    this.#config = Object.assign(this.#config || {}, config);
    this.debug(`加载配置:${content}`);
  }

  private async getNamingClient(): Promise<NacosNamingClient> {
    if (this.#namingClient) {
      return this.#namingClient;
    }

    const options = {
      serverList: this.opt.server,
      namespace: this.opt.namespace,
      logger: console
    };

    if (/^http/.test(options.serverList)) {
      // http格式转化成hostname
      const url = new URL(this.opt.server);
      options.serverList = url.host;
    }

    this.#namingClient = new NacosNamingClient(options);

    await this.#namingClient.ready();
    this.debug("ready");
    return this.#namingClient;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.#service.instance) {
      await this.#namingClient?.deregisterInstance(this.#service.name, this.#service.instance);
    }

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
    const instance: Instance = {
      ip,
      enabled: true,
      healthy: true,
      instanceId: name,
      port: await this.getConfig<number>("port")
    };
    await client.registerInstance(name, instance);

    this.#service.name = name;
    this.#service.instance = instance;

    this.debug("register");

    return true;
  }
}
