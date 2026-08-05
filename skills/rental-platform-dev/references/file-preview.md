# 附件在线预览与下载（KKFileView + MinIO + Spring Boot）

## 前端现状（已完成）

`src/utils/preview.ts` 已封装 KKFileView 预览：

- `kkFileViewBase()`：读取 `import.meta.env.VITE_KKFILEVIEW_URL`（未配置返回空串）
- `isHttpUrl(url)`：判断是否为 HTTP(S) 地址
- `buildKKFileViewPreviewUrl(fileUrl)`：生成 `<base>/onlinePreview?url=<encodeURIComponent(Base64(fileUrl))>`（Base64 用 UTF-8 编码，避免中文地址报错）

预览弹窗逻辑：附件为 HTTP 地址且已配置 KKFileView → iframe 内嵌预览；否则回退浏览器内置预览/下载。

环境变量：

```ini
# .env.development（已配）
VITE_KKFILEVIEW_URL=http://localhost:8012
# .env.production（按部署环境填写）
```

## 附件契约（后端接入目标）

附件记录/返回字段：`{ id, name, size, type, url }`，其中 `url` 必须是 KKFileView 服务可访问的 HTTP(S) 地址（后端下载接口或 MinIO 预签名地址）。

## 上传改造

后端接入后，前端 `el-upload` 直接 multipart POST 到后端上传接口（如 `/api/files`），成功后用返回的附件记录填充列表，替代当前的 `fileToDataUrl` 本地转码。

## MinIO 搭建（Docker 单机示例）

```bash
docker run -d --name minio \
  -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin123" \
  -v D:/minio/data:/data \
  minio/minio server /data --console-address ":9001"
```

- 9000：S3 API 端口（Java SDK 连接）；9001：管理控制台
- 首次登录后创建 Bucket（如 `rental-files`）与 Access Key / Secret Key
- Bucket 建议 Private；不要把 MinIO 9000 端口暴露到公网

## Spring Boot 集成要点

- 依赖：`io.minio:minio:8.5.12`
- 配置 `spring.servlet.multipart.max-file-size`（如 50MB）与 `minio.endpoint / access-key / secret-key / bucket`
- `MinioClient` Bean；上传接口：生成对象名（日期/业务分组 + UUID，避免重名）→ `putObject` → 保存附件表记录
- 下载接口：`getObject` 流式返回，设置正确的 Content-Type / Content-Disposition
- 可选：后端直接返回 MinIO 预签名 URL（`getPresignedObjectUrl`）作为附件 `url`

## 常见坑

- KKFileView 在容器/Docker 中运行时，`localhost` 指向容器自身：下载地址要拼成宿主机 IP（如 `http://192.168.x.x:8080/api/files/123`），或让后端返回 MinIO 预签名地址。
- 预览 URL 参数需 Base64 编码文件访问地址并 URL 转义，前端已封装，后端生成时同样注意编码。

## 完整后端接入指南

仓库 `docs/file-preview-minio-spring-kkfileview.md` 有完整版（上传/下载/预签名/鉴权/常见问题），合入 develop 后可直接参考。
