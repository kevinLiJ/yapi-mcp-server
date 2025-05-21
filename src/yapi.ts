import { Conf } from "./types/index.js";
import axios from "axios";

export async function getApiDesc(apiId: string | number, conf: Conf) {
  const url = new URL("/api/interface/get", conf.yapiHost);
  url.searchParams.append("token", conf.yapiToken);
  url.searchParams.append("id", String(apiId));

  const response = await axios.get(url.toString());
  return response.data.data;
}
