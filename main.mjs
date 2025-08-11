import { Langfuse } from "langfuse"
import { CallbackHandler } from "langfuse-langchain"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { ChatOpenAI } from "@langchain/openai"
import { RunnablePassthrough } from "@langchain/core/runnables"

const langfuse = new Langfuse()

const langfuseHandler = new CallbackHandler()

let prompt
try {
  prompt = await langfuse.getPrompt("my-order-selector-prompt")
}
catch (error) {
  if (error.message.includes("Prompt not found")) {
    console.log("Prompt not found, creating a new one.")
    prompt = await langfuse.createPrompt({
      name: "my-order-selector-prompt",
      type: "chat",
      labels: ["production"],
      prompt: [
        {
          role: "system",
          content:
            "You are an assistant that decides if a message is about one of the given orders. Respond in the structured JSON format provided.",
        },
        {
          role: "user",
          content:
            "Subject: {subject}\nBody: {body}\nOrders: {orders}\nReturn the related order if found.",
        },
      ],
      config: {
        structuredOutputSchema: {
          type: "object",
          properties: {
            relatedOrder: {
              type: ["string", "null"],
              description:
                "The orderId of the order mentioned in the text, or null if none match.",
            },
          },
          required: ["relatedOrder"],
        },
      },
    })
  }
}

const langfusePromptMessages = prompt
  .getLangchainPrompt()
  .map((m) => [m.role, m.content])

const langchainChatPrompt = ChatPromptTemplate.fromMessages(
  langfusePromptMessages
).withConfig({
  metadata: { langfusePrompt: prompt },
})

const model = new ChatOpenAI({
  modelName: "qwen/qwen3-coder:free",
  temperature: 0,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
})

const chain = langchainChatPrompt
  .pipe(new RunnablePassthrough())
  .pipe(
    model.withStructuredOutput(
      prompt.config.structuredOutputSchema,
      { name: "relatedOrder" }
    )
  )

const result = await chain.invoke(
  {
    subject: "About something else",
    body: "This is not about my orders",
    orders: '[{"orderId": "12345", "amount": 100}]',
  },
  {
    callbacks: [langfuseHandler]
  }
)

await langfuseHandler.flushAsync()
await langfuseHandler.shutdownAsync()
await langfuse.flushAsync()
await langfuse.shutdownAsync()

console.log(result)