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
async function getApisDesc(apiIds, conf, retry = 2) {
    if (!Array.isArray(apiIds) || apiIds.length === 0) {
        throw new Error("apiIds 不能为空数组");
    }
    // 并发获取所有 API 信息
    return Promise.all(apiIds.map((id) => getApiDesc(id, conf, retry)));
}

const conf = checkConf();
// Create an MCP server
const server = new McpServer({
    name: "YApi MCP Server",
    version: "1.0.0",
});
// 获取API接口详情
server.tool("yapi_get_apis_detail", "获取YApi接口详情，支持同时获取多个", {
    apiIds: z
        .array(z.string().or(z.number()))
        .describe("YApi接口的ID数组；如链接/project/1/interface/api/66，则ID为66"),
}, async ({ apiIds }) => {
    try {
        const apisDesc = await getApisDesc(apiIds, conf);
        // 格式化返回数据，使其更易于阅读
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(apisDesc.map((item) => ({
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
                    })), null, 2),
                },
            ],
        };
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error("获取API接口出错：", errMsg, error);
        return {
            content: [{ type: "text", text: `获取API接口出错： ${errMsg}` }],
        };
    }
});
// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map
