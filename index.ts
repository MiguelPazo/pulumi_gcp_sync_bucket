/**
 * Created by Miguel Pazo (https://miguelpazo.com)
 */

import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as config from "./config";
import * as fs from "fs";
import * as mime from "mime";
import * as path from "path";

const mainBucket = gcp.storage.Bucket.get(config.bucketName, config.bucketName);

const webContentPath = path.join(process.cwd(), 'data');
console.log("Syncing contents from local disk at", webContentPath);

crawlDirectory(
    webContentPath,
    (filePath: string) => {
        const relativeFilePath = filePath.replace(webContentPath + "/", "");
        console.log(relativeFilePath);
        new gcp.storage.BucketObject(
            relativeFilePath,
            {
                name: relativeFilePath,
                bucket: mainBucket.name,
                contentType: mime.getType(filePath) || undefined,
                source: new pulumi.asset.FileAsset(filePath),
            });
    }
);

function crawlDirectory(dir: string, f: (_: string) => void) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = `${dir}/${file}`;
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            crawlDirectory(filePath, f);
        }

        if (stat.isFile()) {
            f(filePath);
        }
    }
}
