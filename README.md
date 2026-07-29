# OUART MODEL 独立站原型

这是从初艺 OUART 教育网站中拆分出来的独立模型分享站。当前版本为纯静态网站，不依赖构建工具，便于 GitHub Pages 与 NAS 后续自动发布。

## 本地预览

```powershell
node server.mjs
```

## 图片性能

新增或替换模型图片后，发布前运行：

```powershell
python scripts/generate-web-thumbnails.py
node --test tests/*.test.mjs
```

脚本会为模型主图、详情图库和“今日六件”拼图生成轻量 WebP。网页优先加载这些衍生图，仅在用户点开图库大图时请求原文件；如果某张衍生图尚未生成，页面会自动退回原图，不会出现破图。

浏览器打开 `http://127.0.0.1:4173/`。

## 内容入口

模型列表统一维护在 `data/models.js`。新增模型时添加一条记录，并把预览图放入 `assets/models/<slug>/`。下载链接与提取码必须分开保存和展示。

公开页面不应出现 NAS、Hermes、Telegram、自动化脚本、上传流水线或凭证相关内容。
