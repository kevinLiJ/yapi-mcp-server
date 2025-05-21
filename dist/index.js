#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios from 'axios';
import z from 'zod';

const getCliParams = () => {
    const args = process.argv.slice(2);
    const params = {};
    args.forEach((item) => {
        if (item.startsWith("--")) {
            const [key, value] = item.slice(2).split("=");
            if (key && value !== undefined) {
                params[key] = value;
            }
            else {
                console.warn(`参数格式不正确: ${item}，应为 --key=value`);
            }
        }
    });
    return params;
};
/**
 * 通用异步重试工具
 * @param fn 需要重试的异步函数
 * @param retry 重试次数，默认2
 * @param delayMs 每次重试的延迟，默认500ms
 */
async function retryAsync(fn, retry = 2, delayMs = 500) {
    let lastErr = null;
    for (let i = 0; i <= retry; i++) {
        try {
            return await fn();
        }
        catch (err) {
            lastErr = err;
            if (i < retry) {
                await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
            }
        }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

const cliParamsSchema = z.object({
    yapiToken: z.string().min(1, { message: "yapiToken不能为空" }),
    yapiHost: z.string().min(1, { message: "yapiHost不能为空" }),
});
function checkConf() {
    const cliParams = getCliParams();
    const parseResult = cliParamsSchema.safeParse(cliParams);
    if (!parseResult.success) {
        throw new Error("命令行参数校验失败:\n" +
            parseResult.error.errors
                .map((e) => `- ${e.path.join(".")}: ${e.message}`)
                .join("\n") +
            "\n请通过命令行传入 --yapiHost=xxx --yapiToken=xxx");
    }
    return parseResult.data;
}
async function getApiDesc(apiId, conf, retry = 2) {
    if (!conf || !conf.yapiHost || !conf.yapiToken) {
        throw new Error("YApi 配置缺失，请检查 yapiHost 和 yapiToken 是否正确传入。");
    }
    return retryAsync(async () => {
        const url = new URL("/api/interface/get", conf.yapiHost);
        url.searchParams.append("token", conf.yapiToken);
        url.searchParams.append("id", String(apiId));
        const response = await axios.get(url.toString(), { timeout: 8000 });
        if (!response.data || typeof response.data !== "object") {
            throw new Error("YApi 返回数据异常: " + JSON.stringify(response.data));
        }
        if (!response.data.data) {
            throw new Error("YApi 返回数据缺失: " + JSON.stringify(response.data));
        }
        // 结构校验
        const d = response.data.data;
        if (!d._id || !d.title || !d.path) {
            throw new Error("YApi 返回的接口详情字段不完整: " + JSON.stringify(d));
        }
        return d;
    }, retry);
}

const conf = checkConf();
// Create an MCP server
const server = new McpServer({
    name: "YApi MCP Server",
    version: "1.0.0",
});
// 获取API接口详情
server.tool("yapi_get_api_desc", "获取YApi接口详情", {
    apiId: z
        .string()
        .describe("YApi接口的ID；如连接/project/1/interface/api/66，则ID为66"),
}, async ({ apiId }) => {
    try {
        const apiDesc = await getApiDesc(apiId, conf);
        // 日志增强
        console.info("获取到的API详情:", JSON.stringify(apiDesc, null, 2));
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
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error("获取API接口出错:", errMsg, error);
        return {
            content: [{ type: "text", text: `获取API接口出错: ${errMsg}` }],
        };
    }
});
// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map
