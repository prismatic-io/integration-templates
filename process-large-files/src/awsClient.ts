import { S3Client } from "@aws-sdk/client-s3";
import { Connection } from "@prismatic-io/spectral";

export const createS3Client = (connection: Connection, region: string) => {
  const { accessKeyId, secretAccessKey } = connection.fields;
  return new S3Client({
    region,
    credentials: {
      accessKeyId: `${accessKeyId}`,
      secretAccessKey: `${secretAccessKey}`,
    },
  });
};
