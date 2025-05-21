#!/usr/bin/env node
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getApiDesc } from "./yapi.js";
import { getCliParams } from "./utils.js";
import { Conf } from "./types/index.js";
// Create an MCP server
const server = new McpServer({
  name: "YApi MCP Server",
  version: "1.0.0",
});

const conf = getCliParams() as unknown as Conf;
// 获取API接口详情
server.tool(
  "yapi_get_api_desc",
  "获取YApi接口详情",
  {
    apiId: z
      .string()
      .describe("YApi接口的ID；如连接/project/1/interface/api/66，则ID为66"),
  },
  async ({ apiId }) => {
    try {
      const apiDesc = await getApiDesc(apiId, conf);

      // 格式化返回数据，使其更易于阅读
      const formattedResponse = {
        基本信息: {
          接口ID: apiDesc._id,
          接口名称: apiDesc.title,
          接口路径: apiDesc.path,
          请求方式: apiDesc.method,
          接口描述: apiDesc.desc,
        },
        请求参数: {
          URL参数: apiDesc.req_params,
          查询参数: apiDesc.req_query,
          请求头: apiDesc.req_headers,
          请求体类型: apiDesc.req_body_type,
          表单参数: apiDesc.req_body_form,
          Json参数: apiDesc.req_body_other,
        },
        响应信息: {
          响应类型: apiDesc.res_body_type,
          响应内容: apiDesc.res_body,
        },
        其他信息: {
          接口文档: apiDesc.markdown,
        },
      };

      return {
        content: [
          { type: "text", text: JSON.stringify(formattedResponse, null, 2) },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `获取API接口出错: ${error}` }],
      };
    }
  }
);
// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
