import axios from "axios";
import { getCliParams } from "./utils";
import z from "zod";
import { retryAsync } from "./utils";

export const cliParamsSchema = z.object({
  yapiToken: z.string().min(1, { message: "yapiToken不能为空" }),
  yapiHost: z.string().min(1, { message: "yapiHost不能为空" }),
});
export type Conf = z.infer<typeof cliParamsSchema>;

export function checkConf() {
  const cliParams = getCliParams();
  const parseResult = cliParamsSchema.safeParse(cliParams);
  if (!parseResult.success) {
    throw new Error(
      "命令行参数校验失败:\n" +
        parseResult.error.errors
          .map((e) => `- ${e.path.join(".")}: ${e.message}`)
          .join("\n") +
        "\n请通过命令行传入 --yapiHost=xxx --yapiToken=xxx"
    );
  }
  return parseResult.data;
}

export async function getApiDesc(
  apiId: string | number,
  conf: Conf,
  retry = 2
) {
  if (!conf || !conf.yapiHost || !conf.yapiToken) {
    throw new Error(
      "YApi 配置缺失，请检查 yapiHost 和 yapiToken 是否正确传入。"
    );
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
