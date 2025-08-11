# About

MVE to reproduce a subtle LangFuse/LangChain issue.

- Run `npm install`
- Set `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASEURL` to their necessary values
- Set `OPENAI_API_KEY` and set `baseURL` to something else other than OpenRouter's base API URL if using something else
- Change model if necessary
- Run `node main.mjs`

The script creates a prompt or fetches one if it already exists.

I had to call `flushAsync` and `shutdownAsync` on both the LangFuse and the callback handler instance for some reason 🤷