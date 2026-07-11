# OUART MODEL 独立站原型

这是从初艺 OUART 教育网站中拆分出来的独立模型分享站。当前版本为纯静态网站，不依赖构建工具，便于 GitHub Pages 与 NAS 后续自动发布。

## 本地预览

```powershell
node server.mjs
```

浏览器打开 `http://127.0.0.1:4173/`。

## 内容入口

模型列表统一维护在 `data/models.js`。新增模型时添加一条记录，并把预览图放入 `assets/models/<slug>/`。下载链接与提取码必须分开保存和展示。

公开页面不应出现 NAS、Hermes、Telegram、自动化脚本、上传流水线或凭证相关内容。
