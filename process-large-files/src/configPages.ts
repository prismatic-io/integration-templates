import awsS3 from "@prismatic-io/components-aws-s3";
import {
  configPage,
  configVar,
  connectionConfigVar,
} from "@prismatic-io/spectral";

export const configPages = {
  Connections: configPage({
    elements: {
      // The Amazon S3 component's access key connection, from its npm package.
      // Its accessKeyId and secretAccessKey fields are what src/awsClient.ts reads.
      "S3 Connection": awsS3.connections.apiKeySecret({
        stableKey: "s3-connection",
      }),
      "PostgreSQL Connection": connectionConfigVar({
        stableKey: "postgres-connection",
        dataType: "connection",
        icons: {
          avatarPath: "postgres.png",
        },
        inputs: {
          host: {
            label: "Host",
            placeholder: "Database Host",
            type: "string",
            required: true,
            shown: true,
            comments: "The hostname or IP address of the PostgreSQL server.",
            example: "localhost",
          },
          port: {
            label: "Port",
            placeholder: "Database Port",
            type: "string",
            required: true,
            shown: true,
            comments:
              "The port number on which the PostgreSQL server is listening.",
            example: "5432",
            default: "5432",
          },
          database: {
            label: "Database Name",
            placeholder: "Database Name",
            type: "string",
            required: true,
            shown: true,
            comments: "The name of the PostgreSQL database to connect to.",
            example: "mydatabase",
          },
          user: {
            label: "Username",
            placeholder: "Database Username",
            type: "string",
            required: true,
            shown: true,
            comments:
              "The username for authenticating with the PostgreSQL database.",
            example: "dbuser",
          },
          password: {
            label: "Password",
            placeholder: "Database Password",
            type: "password",
            required: true,
            shown: true,
            comments:
              "The password for authenticating with the PostgreSQL database.",
            example: "securepassword",
          },
        },
      }),
    },
  }),
  "AWS Region": configPage({
    elements: {
      "AWS Region": awsS3.dataSources.selectRegion({
        stableKey: "aws-region",
        values: {},
      }),
    },
  }),
  "AWS S3 Bucket": configPage({
    elements: {
      "S3 Bucket Name": awsS3.dataSources.selectBucket({
        stableKey: "s3-bucket",
        values: { accessKey: { configVar: "S3 Connection" } },
      }),
    },
  }),
  Schedule: configPage({
    elements: {
      "Process Schedule": configVar({
        stableKey: "process-schedule",
        dataType: "schedule",
        description: "How often should the file processor run?",
      }),
    },
  }),
};
