import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import * as Nacos from "nacos";
import { getLogger } from "log4js";
import { networkInterfaces } from "os";
import { ConfigService } from "@nestjs/config";

const { NacosNamingClient } = Nacos as any;

interface Conf {
  port?: number;
  enable?: boolean;
  namespace: string;
  serverList: string;
}

@Injectable()
export class NacosService implements OnModuleInit, OnModuleDestroy {
  private client: typeof NacosNamingClient;
  private enable = true;
  private readonly logger = getLogger("Nacos");
  private config: Conf;
  constructor(private readonly configService: ConfigService) {
    this.config = configService.get("NACOS") as Conf;
    if (!this.config) {
      throw Error("NACOS config info must not be null!");
    }

    if (this.config.hasOwnProperty("enable")) {
      this.enable = this.config.enable as boolean;
    }

    if (this.enable) {
      if (!this.config.namespace) {
        throw Error("namespace must not be null!");
      }

      if (!this.config.serverList) {
        throw Error("serverList must not be null!");
      }
    }
  }

  private async getNacos(): Promise<typeof NacosNamingClient> {
    if (this.client) {
      return this.client;
    }

    this.client = new NacosNamingClient({
      logger: this.logger,
      namespace: this.config.namespace,
      serverList: this.config.serverList
    });

    await this.client;
    return this.client;
  }

  async onModuleInit(): Promise<void> {
    if (!this.enable) {
      return;
    }

    this.client = new NacosNamingClient({
      logger: this.logger,
      namespace: this.config.namespace,
      serverList: this.config.serverList
    });
    await this.client.ready();
    this.logger.info("ready");
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.enable) {
      return;
    }

    await this.client.close();
    this.logger.info("close");
  }

  async register(name: string, options: { ip?: string, port?: number } = {}) {
    if (!this.enable) {
      return;
    }

    if (!options.ip) {
      const networks = networkInterfaces();
      const address = Object.values(networks).flat().filter((x: any) => x.family === "IPv4" && !x.internal).map((x: any) => x.address);
      options.ip = address[0];
    }

    if (!options.port) {
      options.port = this.config.port;
    }

    if (!options.ip) {
      throw Error("ip must not be null!");
    }

    if (!options.port) {
      throw Error("port must not be null!");
    }

    const nacos = await this.getNacos();
    await nacos.registerInstance(name, options);
    this.logger.info("register");
  }
}
