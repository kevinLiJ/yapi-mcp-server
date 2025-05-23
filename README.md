# yapi-mcp-server

## 简介

`yapi-mcp-server` 是 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) 的服务端实现。支持通过 MCP 协议获取 YApi 接口详情。

---

## 快速开始

> **_全局`node`环境需 `>=18`_**

### 配置 mcp.json

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

- `你的YApiToken` 替换为实际的 YApi Token（token 获取路径：yapi 项目->设置->token 配置->工具标识）
- `https://yapi.xxx.net` 替换为你的 YApi 服务域名

---

## MCP Server 功能

- **工具名**：`yapi_get_apis_detail`
- **功能**：批量获取 YApi 接口的详细信息。
- **参数**：
  - `apiIds`：YApi 接口 ID 组成的数组。例如，接口地址为 `/project/1/interface/api/66`，则 ID 为 `66`。支持同时传入多个 ID。
- **返回值**：对应接口的详细信息对象数组，结构与 YApi 返回一致。

---

## 实践

`mcp`配置成功之后，直接对`cursor`说：

```
生成接口代码
@api/index.ts
@https://yapi.XXX.net/project/13533/interface/api/1554281
@https://yapi.XXX.net/project/13533/interface/api/1554288
@https://yapi.XXX.net/project/13533/interface/api/1554334
```

`cursor`就会调用`yapi-mcp-server`获取接口的信息，并根据项目代码规范，生成对应的接口代码，比如:

```ts
// 删除组织：https://yapi.XXX.net/project/13533/interface/api/1554334
export function deleteOrg(data: { id: number }) {
  return axios({
    url: "/goapi/admin/org/delete",
    method: "post",
    data,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
```

**_ai 可以给 接口函数起名字，爽歪歪！_**

### 制定规范，使生成的接口代码更符合规范

在 .cursorrules 文件中，编写接口代码的规范，比如:

```js
// .cursorrules

接口代码规范：

- apiName 驼峰且动词前置,保持简洁
- 使用 axiosInstance
- 注释需包含接口名和 yapi 文档链接
- headers 有需要再加

import { axiosInstance as axios } from '@/api/axiosToken'

// {{$value.title}}：{{$value.yapiDocUrl}}
export function {{$value.apiName}}(data) {
  return axios({
    url: '{{$value.path}}',
    method: '{{$value.method}}',
    data,
    // headers: { ... } // 如有自定义 header 再补充
  })
}
```

---

## 参考链接

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction)
- [YApi 官方文档](https://hellosean1025.github.io/yapi/openapi.html)
