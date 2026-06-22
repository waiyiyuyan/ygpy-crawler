const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");

async function crawl() {
  // 获取当前年月，自动拼接链接
  const nowDate = dayjs();
  const year = nowDate.format("YYYY");
  const month = nowDate.format("MM");
  const url = `https://ygpy.net/vpn/test/${year}/${month}.html`;
  console.log("当前抓取地址：", url);

  const { data: html } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });

  const $ = cheerio.load(html);
  const container = $("#VPContent main .vp-doc > div");
  const result = [];

  container.find("h2").each((i, el) => {
    const item = {
      title: "",
      desc: "",
      list: [],
      publishDate: "",
    };

    item.title = $(el)
      .clone()
      .children()
      .remove()
      .end()
      .text()
      .trim();

    let next = $(el).next();
    while (next.length && next[0].tagName !== "h2") {
      const tag = next[0].tagName;
      if (tag === "p") {
        const text = next.text().trim();
        if (text) item.desc += text + "\n";
      }
      if (tag === "ul") {
        next.find("li").each((_, li) => {
          item.list.push($(li).text().trim());
        });
      }
      if (tag === "blockquote") {
        item.publishDate = next.text().trim();
      }
      next = next.next();
    }
    result.push(item);
  });

  // --- 🎯【核心修改点】不再生成 HTML，直接将纯数据写入 data.json ---
  const dataPath = path.join(process.cwd(), "data.json");
  
  console.log("--------------------------------------------------");
  console.log("【调试日志】当前进程工作目录 (process.cwd()):", process.cwd());
  console.log("【调试日志】准备写入纯数据文件的绝对路径:", dataPath);
  console.log("--------------------------------------------------");

  // 写入 JSON 文件 (null, 2 表示格式化输出，方便人类阅读排查)
  fs.writeFileSync(dataPath, JSON.stringify(result, null, 2), "utf-8");

  // 验证数据文件是否真的成功落盘
  if (fs.existsSync(dataPath)) {
    console.log(`【调试日志】验证成功！最新的节点纯数据已写入：${dataPath}`);
  } else {
    console.error("【调试日志】严重错误：数据文件写入后未找到！");
  }
}

crawl().catch(err => {
  console.error("爬虫运行失败：", err);
  process.exit(1);
});
