# tools-for-agents

**The whole kit in one install.** Nine zero-dependency MCP tools for coding agents, and ghost, a self that persists across sessions.

```bash
npx tools-for-agents                                             # register the nine MCP servers with Claude Code
npm i -g tools-for-agents && tools-for-agents install --with-ghost --guard   # + CLIs, a self, and the .env guard
```

| | tool | the agent can… |
|---|---|---|
| 🛰️ | [agent-hq](https://github.com/tools-for-agents/agent-hq) | **coordinate** — shared memory, a kanban agents claim work from, a registry, a cost ledger |
| 🔎 | [lens](https://github.com/tools-for-agents/lens) | **read code** — ranked snippets, outlines and surgical reads instead of whole files |
| ⚒ | [anvil](https://github.com/tools-for-agents/anvil) | **run safely** — a throwaway Docker sandbox: network off, capped, timed |
| 🔐 | [keep](https://github.com/tools-for-agents/keep) | **hold secrets** — use an API key without ever seeing it; redacted from everything that comes back |
| 🧠 | [cortex](https://github.com/tools-for-agents/cortex) | **remember** — an Obsidian-compatible second brain |
| 🧭 | [scout](https://github.com/tools-for-agents/scout) | **read the web** — a URL as clean, cached, searchable markdown |
| 🔻 | [prism](https://github.com/tools-for-agents/prism) | **read data** — a JSON/CSV blob as its shape and the slice you asked for |
| ◎ | [recall](https://github.com/tools-for-agents/recall) | **recall it all** — one query across every store, including what the agent lived |
| 👁 | [iris](https://github.com/tools-for-agents/iris) | **see** — render what you built and hand the pixels back to the model |
| 👻 | [ghost](https://github.com/tools-for-agents/ghost) | **the self at the centre** — memory, a will and a sleep/dream cycle wired into Claude Code's hooks (opt-in) |

## Why one package and nine

Each tool is still its own package, because that is how MCP works: the [MCP registry](https://registry.modelcontextprotocol.io) lists servers one by one, and a client's config starts one server (`npx -y @tools-for-agents/lens mcp`). If you only want the eye, install `@tools-for-agents/iris` and nothing else.

This package is what a person types. It depends on all ten and wires them in:

- **from a stable install** (`npm i -g`), it registers each server by its absolute path and links every CLI into `~/.local/bin`;
- **from `npx`**, whose cache npm may clear at any time, it registers `npx -y @tools-for-agents/<tool>` instead. A path into the cache would work today and break the day the cache is cleaned. For the same reason `--with-ghost` and `--guard` need the stable install, since they write hooks that must point at a file that stays, and from `npx` they say so.

A name that is already registered with Claude Code is left alone. Run it again at any time.

```bash
tools-for-agents status     # versions, and what is registered
```

Zero third-party dependencies anywhere in the tree. Node 22+.

## License

MIT
