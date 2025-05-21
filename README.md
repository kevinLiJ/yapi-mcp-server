# yapi-mcp-server

## 简介

`yapi-mcp-server` 是 [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol/mcp) 的服务端实现。支持通过 MCP 协议获取 YApi 接口详情，适用于自动化、智能体等场景。

---

## 快速开始

### 1. 配置 mcp.json

在项目根目录下新建或编辑 `mcp.json` 文件，内容如下：

```json
{
  "mcpServers": {
    "yapi-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "yapi-mcp-server",
        "--yapiToken=你的YApiToken",
        "--yapiHost=https://yapi.xxx.net"
      ]
    }
  }
}
```

> 请将 `你的YApiToken` 替换为实际的 YApi Token，`https://yapi.xxx.net` 替换为你的 YApi 服务地址。

---

## MCP Server 功能

- **工具名**：`yapi_get_api_desc`
- **功能**：获取 YApi 接口详情
- **参数说明**：
  - `apiId`：YApi 接口的 ID（如 `/project/1/interface/api/66`，则 ID 为 66）

---

## 参考链接

- [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol/mcp)
- [YApi 官方文档](https://hellosean1024.github.io/yapi/)
