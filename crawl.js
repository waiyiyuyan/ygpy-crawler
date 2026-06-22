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

  // --- 【修改点 1】将抓取的数据转换为符合我们新布局的 HTML 卡片列表 ---
  let articleHtml = "";
  result.forEach(item => {
    articleHtml += `<div class="node-card">`;
    articleHtml += `<h2>${item.title}</h2>`;
    
    if (item.publishDate) {
      articleHtml += `<blockquote>${item.publishDate}</blockquote>`;
    }
    
    if (item.desc) {
      // 将原本数据里的 \n 换行符转换为网页识别的 <br> 标签
      const htmlDesc = item.desc.trim().replace(/\n/g, '<br>');
      articleHtml += `<p>${htmlDesc}</p>`;
    }
    
    if (item.list.length > 0) {
      articleHtml += `<ul>`;
      item.list.forEach(li => {
        articleHtml += `<li>${li}</li>`;
      });
      articleHtml += `</ul>`;
    }
    
    articleHtml += `</div>`;
  });

  if (!articleHtml) {
    articleHtml = `<h2>暂无最新资讯</h2><p>正在从服务器同步最新数据，请稍候...</p>`;
  }

  // --- 【修改点 2】把定稿的 index.html 网页结构作为模板嵌入 ---
  const finalHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <title>我爱白嫖 | 每日免费机场节点与高速VPN推荐实时更新</title>
    <meta name="description" content="我爱白嫖专注于分享全网每日最新免费机场节点、高速安全VPN评测、科学上网导航及节点订阅源，旨在为用户提供稳定、流畅的科学上网资源推荐。">
    <meta name="keywords" content="我爱白嫖,免费机场,机场节点,VPN推荐,科学上网,节点订阅,免费VPN,翻墙资源">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <meta name="google-adsense-account" content="ca-pub-5400876400049616">
    <meta name="google-site-verification" content="aH851F92gNj2VQSV3o4uDaXBVIwNG1q5aHBKeBlBceQ" />
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5400876400049616" crossorigin="anonymous"></script>
    
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            color: #333;
            background-color: #f7f9fa;
        }
        header { 
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            margin-bottom: 20px;
            text-align: center;
        }
        header h1 { margin: 0; color: #007bff; font-size: 2rem; }
        header p { margin: 5px 0 0; color: #666; font-size: 1rem; }
        .ads-container { margin: 20px 0; min-height: 100px; }
        .article-list { 
            background: #fff;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            margin-top: 20px; 
        }
        /* 机场/VPN信息卡片的排版样式 */
        .node-card {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px dashed #eee;
        }
        .node-card:last-child { border-bottom: none; }
        .node-card h2 { font-size: 1.4rem; color: #222; margin-top: 0; }
        .node-card blockquote { background: #f1f3f5; padding: 10px 15px; margin: 10px 0; border-left: 4px solid #adb5bd; color: #495057; }
        .node-card ul { padding-left: 20px; }
        .node-card li { font-family: monospace; word-break: break-all; background: #f8f9fa; margin-bottom: 5px; padding: 4px 8px; border-radius: 4px; border: 1px solid #e9ecef; }
    </style>
</head>
<body>

    <header>
        <h1>我爱白嫖</h1>
        <p>每日免费机场节点 · 高速VPN测试 · 科学上网资源导航</p>
    </header>

    <div class="ads-container">
        <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-5400876400049616" data-ad-slot="4680496511" data-ad-format="auto" data-full-width-responsive="true"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </div>

    <div id="content" class="article-list">
        ${articleHtml}
    </div>

    <div class="ads-container">
        <ins class="adsbygoogle" style="display:block" data-ad-format="autorelaxed" data-ad-client="ca-pub-5400876400049616" data-ad-slot="9222376757"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </div>

</body>
</html>`;

  // --- 【修改点 3】强行锁死在当前进程运行的根目录，文件名为 index.html ---
  const htmlPath = path.join(process.cwd(), "index.html");
  
  console.log("--------------------------------------------------");
  console.log("【调试日志】当前进程工作目录 (process.cwd()):", process.cwd());
  console.log("【调试日志】准备写入网页文件的绝对路径:", htmlPath);
  console.log("--------------------------------------------------");

  fs.writeFileSync(htmlPath, finalHtml, "utf-8");

  // 验证网页文件是否真的成功落盘
  if (fs.existsSync(htmlPath)) {
    console.log(`【调试日志】验证成功！包含 SEO 和广告位的 index.html 确实存在于：${htmlPath}`);
  } else {
    console.error("【调试日志】严重错误：网页文件写入后未找到！");
  }
}

crawl().catch(err => {
  console.error("爬虫运行失败：", err);
  process.exit(1);
});
