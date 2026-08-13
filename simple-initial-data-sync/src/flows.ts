import { batchFlowTrigger, flow, util } from "@prismatic-io/spectral";
import axios from "axios";
import z from "zod";

const Post = z.object({
  userId: z.number(),
  id: z.number(),
  title: z.string(),
  body: z.string(),
});
type Post = z.infer<typeof Post>;

const PostArray = z.array(Post);

type PostCursor = { startId: number };

export const importPosts = flow({
  name: "Import Posts",
  stableKey: "import-posts",
  description:
    "Do an initial data sync of posts from a paginated API in batches and then process new posts sent via webhook in real time",
  batchConfig: { batchSize: 5, concurrentBatchLimit: 3 },

  // The `Post` and `PostCursor` types are used to type the `payload` and batch cursor information
  trigger: batchFlowTrigger<Post, PostCursor>({
    // This function will run when the instance is initially deployed to a customer
    onDeploy: async (context, payload) => {
      // `payload.paginationState` contains pagination information from the last time this function ran.
      const startId = util.types.toNumber(payload.paginationState?.startId, 0);

      // Get a batch of posts starting from `startId`
      const response = await axios.get<Post[]>(
        "https://jsonplaceholder.typicode.com/posts",
        {
          params: {
            _start: startId,
            _limit: 20, // Fetch 20 posts at a time
          },
        },
      );

      return {
        items: response.data,
        paginationState:
          response.data.length > 0
            ? { startId: startId + response.data.length }
            : null,
      };
    },
    onTrigger: async (context, payload) => {
      const post = payload.body.data;
      try {
        const parsedPost = Post.parse(post);
        return {
          items: [parsedPost], // Wrap the single post in an array so it can be processed in `onExecution` like the batches of posts fetched in `onDeploy`
          response: {
            // Return a response acknowledging receipt of the post. This is optional and can be customized as needed.
            contentType: "text/plain",
            statusCode: 200,
            body: "acknowledged",
            headers: { "x-acme-ack": "ack" },
          },
          paginationState: null, // Return `null` since we don't need to update our pagination state when processing real-time posts from the webhook
        };
      } catch (error) {
        throw new Error(`Invalid post received: ${error}`);
      }
    },
  }),
  onExecution: async (context, params) => {
    const posts = PostArray.parse(params.onTrigger.results.body.data);
    for (const post of posts) {
      context.logger.info(`Processing post ${post.id}: ${post.title}`);
    }
    return { data: null };
  },
});

export default [importPosts];
