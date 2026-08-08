"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const env_1 = require("../../config/env");
class StorageService {
    client;
    bucket;
    constructor() {
        this.bucket = env_1.env.MINIO_BUCKET;
        const scheme = env_1.env.MINIO_USE_SSL ? 'https' : 'http';
        this.client = new client_s3_1.S3Client({
            endpoint: `${scheme}://${env_1.env.MINIO_ENDPOINT}:${env_1.env.MINIO_PORT}`,
            forcePathStyle: true,
            region: 'us-east-1',
            credentials: {
                accessKeyId: env_1.env.MINIO_ACCESS_KEY,
                secretAccessKey: env_1.env.MINIO_SECRET_KEY,
            },
        });
    }
    async ensureBucket() {
        try {
            await this.client.send(new client_s3_1.HeadBucketCommand({ Bucket: this.bucket }));
        }
        catch {
            await this.client.send(new client_s3_1.CreateBucketCommand({ Bucket: this.bucket }));
        }
    }
    async put(key, body, contentType) {
        await this.client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        }));
    }
    async presignedUrl(key) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn: 3600 });
    }
    async delete(key) {
        await this.client.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    }
}
exports.StorageService = StorageService;
//# sourceMappingURL=storage-service.js.map