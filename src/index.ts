#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getApisDesc, checkConf } from "./yapi.js";
import z from "zod";

const conf = checkConf();
// Create an MCP server
const server = new McpServer({
  name: "YApi MCP Server",
  version: "1.0.0",
});

// 获取API接口详情
server.tool(
  "yapi_get_apis_detail",
  "获取YApi接口详情，支持同时获取多个",
  {
    apiIds: z
      .array(z.string().or(z.number()))
      .describe(
        "YApi接口的ID数组；如链接/project/1/interface/api/66，则ID为66"
      ),
  },
  async ({ apiIds }: { apiIds: (string | number)[] }) => {
    try {
      const apisDesc = await getApisDesc(apiIds, conf);

      // 格式化返回数据，使其更易于阅读
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              apisDesc.map((item) => ({
                基本信息: {
                  接口ID: item._id,
                  接口名称: item.title,
                  接口路径: item.path,
                  请求方式: item.method,
                  接口描述: item.desc,
                },
                请求参数: {
                  URL参数: item.req_params,
                  查询参数: item.req_query,
                  请求头: item.req_headers,
                  请求体类型: item.req_body_type,
                  表单参数: item.req_body_form,
                  请求体: item.req_body_other,
                },
                响应信息: {
                  响应类型: item.res_body_type,
                  响应内容: item.res_body,
                },
                其他信息: {
                  接口文档: item.markdown,
                },
              })),
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("获取API接口出错:", errMsg, error);
      return {
        content: [{ type: "text", text: `获取API接口出错: ${errMsg}` }],
      };
    }
  }
);
// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
