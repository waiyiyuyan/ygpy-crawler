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

  // 组装 Hexo markdown
  const mdTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
  let mdBody = "";

  result.forEach(item => {
    mdBody += `## ${item.title}\n`;
    if (item.publishDate) mdBody += `发布时间：${item.publishDate}\n\n`;
    if (item.desc) mdBody += `${item.desc}\n`;
    if (item.list.length > 0) {
      item.list.forEach(li => {
        mdBody += `- ${li}\n`;
      });
    }
    mdBody += "\n---\n\n";
  });

  const mdContent = `---
title: 每日机场节点与VPN测试推荐（${year}年${month}月）
date: ${mdTime}
tags: [爬虫,自动更新]
categories: vpn
---
${mdBody}
`;

  // 🛠️ 强行锁死在当前进程运行的根目录
  const mdPath = path.join(process.cwd(), "daily.md");
  
  console.log("--------------------------------------------------");
  console.log("【调试日志】当前进程工作目录 (process.cwd()):", process.cwd());
  console.log("【调试日志】准备写入文件的绝对路径:", mdPath);
  console.log("--------------------------------------------------");

  fs.writeFileSync(mdPath, mdContent, "utf-8");

  // 验证文件是否真的成功落盘
  if (fs.existsSync(mdPath)) {
    console.log(`【调试日志】验证成功！daily.md 确实存在于：${mdPath}`);
  } else {
    console.error("【调试日志】致命错误：文件写入后未找到！");
  }
}

crawl().catch(err => {
  console.error("爬虫运行失败：", err);
  process.exit(1);
});
