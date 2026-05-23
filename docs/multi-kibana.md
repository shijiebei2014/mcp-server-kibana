# 1. 功能描述

本项目是kibana的mcp服务，技术栈是typescript，目前只支持单个kibana的查询功能

# 2. 需求增强

希望能支持多个kibana的查询

# 3. 实现要求

通过环境变量MULTI_KIBANA_CONFIG传入配置文件路径，服务启动时读取该文件内容，引入多个kibana的配置项。配置文件内容格式如下：
```yaml
kibana:
    - KIBANA_URL: "<kibana_url_1>",
      KIBANA_USERNAME: "<kibana_username_1>",
      KIBANA_PASSWORD: "<kibana_password_1>"
```

mcp提供的tools增加，根据用户输入的日志地址，比如: https://kibana-test-hkex.hashxdc.com/app/discover#/，按域名匹配，找到匹配的kibana，进行查询。

# 4. 配置示例

## 4.1 配置文件示例

假设配置文件路径为 `/etc/kibana/multi-kibana.yaml`：

```yaml
kibana:
  - KIBANA_URL: "https://kibana-test-hkex.hashxdc.com"
    KIBANA_USERNAME: "hk_user"
    KIBANA_PASSWORD: "hk_pass"
    KIBANA_DEFAULT_SPACE: "default"
  - KIBANA_URL: "https://kibana-global.hashxdc.com"
    KIBANA_API_KEY: "<global_api_key>"
    KIBANA_DEFAULT_SPACE: "default"
```

## 4.2 MCP 启动示例

```json
{
  "mcpServers": {
    "kibana": {
      "command": "npx",
      "args": ["@tocharianou/mcp-server-kibana"],
      "env": {
        "MULTI_KIBANA_CONFIG": "/etc/kibana/multi-kibana.yaml"
      }
    }
  }
}
```

# 5. 路由行为

- 单实例模式（仅配置一个 profile）时，`kibana_url` 参数可省略。
- 多实例模式（配置两个及以上 profile）时，调用 Kibana API 的 tools 需要传入 `kibana_url`。
- 服务会提取 `kibana_url` 的域名并与配置中的 `KIBANA_URL` 域名进行匹配。
- 若未匹配到实例，返回错误并给出可用域名列表。
