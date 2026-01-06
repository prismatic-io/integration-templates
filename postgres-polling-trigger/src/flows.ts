import { flow } from "@prismatic-io/spectral";
import { createPostgresClient } from "./postgresClient";
import { escapeIdentifier } from "pg";

interface PollingState extends Record<string, unknown> {
  lastCreatedAt?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: Date;
}

export const listenForNewPosts = flow({
  name: "New posts",
  stableKey: "new-posts",
  description: "Fetch new posts from the selected PostgreSQL table.",
  triggerType: "polling",
  schedule: { value: "* * * * *" },
  onTrigger: async (context, payload, params) => {
    const dbClient = await createPostgresClient(
      context.configVars["Postgres Connection"]
    );

    const [schema, tableName] = context.configVars["Select Table"]
      .split(".")
      .map(escapeIdentifier);

    const state = context.polling.getState() as PollingState;

    const newPosts: Post[] = [];

    try {
      await dbClient.query("BEGIN");

      if (state?.lastCreatedAt) {
        // Fetch only items updated since the last poll
        const response = await dbClient.query<Post>(
          `SELECT id, title, content, created_at FROM ${schema}.${tableName} WHERE created_at > $1 ORDER BY created_at ASC`,
          [state.lastCreatedAt]
        );
        if (response.rowCount) {
          context.logger.info(
            `Found ${response.rowCount} new posts since last poll.`
          );
          newPosts.push(...response.rows);
        } else {
          context.logger.info("No new posts found since last poll.");
        }
      } else {
        context.logger.info("Initial poll - no previous state found.");
        context.logger.info("New posts will be fetched on the next poll.");
      }
      const cursorResponse = await dbClient.query<{ cursor: string }>(
        `SELECT MAX(created_at)::TEXT as cursor FROM ${schema}.${tableName}`
      );
      const newState: PollingState = {
        lastCreatedAt: cursorResponse.rows[0]?.cursor,
      };
      context.polling.setState(newState);
    } catch (e) {
      await dbClient.query("ROLLBACK");
      throw e;
    } finally {
      await dbClient.end();
    }

    return {
      payload: { ...payload, body: { data: newPosts } },
      polledNoChanges: newPosts.length === 0,
    };
  },
  onExecution: async (context, params) => {
    const posts = (params.onTrigger.results.body.data || []) as Post[];
    for (const post of posts) {
      context.logger.info(
        `Post ID: ${post.id}, Title: ${post.title}, Created At: ${post.created_at}`
      );
    }
    return { data: null };
  },
});

export default [listenForNewPosts];
