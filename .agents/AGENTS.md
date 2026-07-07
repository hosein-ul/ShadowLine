# Universal Anti-Hallucination & Verification Protocol (MANDATORY FOR ALL AGENTS)

## 1. Zero-Hallucination Policy & Strict Verification (Universal Scope)
- **Universal Applicability:** This protocol applies universally to ALL technologies, domains, and tools — including **MCP (Model Context Protocol) servers/tools**, smart contracts, blockchain SDKs (e.g., Zama, Circle, Viem), UI frameworks (e.g., shadcn, Next.js, Tailwind), cloud APIs, databases, and system architectures.
- **Never Assume or Guess:** Do NOT invent, guess, or hallucinate function signatures, MCP tool parameters, contract ABIs, addresses, API endpoints, CSS classes, or configuration headers from training data memory.
- **Read Authoritative Sources FIRST:** Before calling any tool, writing code, or generating documentation, you MUST explicitly read and verify ground-truth sources:
  1. **MCP Servers & Tools:** Before calling lazy-loaded MCP tools or using MCP resources, always read their schema definitions (`<toolName>.json`), check available tools/resources (`list_resources`, `read_resource`), and review server instructions (`instructions.md`).
  2. **Local Codebase & ABIs:** Inspect existing files (e.g., ABI files, types, interfaces, utility wrappers) to verify exact names, types, and signatures in use.
  3. **Installed Dependencies & Skills:** When integrating third-party SDKs or frameworks, inspect `node_modules` or read local skill instructions (`SKILL.md`) and reference docs (`references/`) before implementing domain logic.

## 2. Mandatory "Think -> Read -> Plan -> Execute" Workflow
Before executing any coding, configuration, or integration task across any technology stack:
1. **Think & Analyze:** Identify exact information needed (e.g., MCP tool schemas, API parameters, contract addresses, decimal scaling rules).
2. **Read & Verify:** Use read tools (`view_file`, `grep_search`, `read_resource`, `call_mcp_tool`) to verify 100% accurate data from ground-truth sources.
3. **Plan:** Outline exact changes or tool invocations, confirming that every name, parameter, and address matches verified sources without guessing.
4. **Execute & Audit:** Apply changes and double-check against ground truth to ensure zero discrepancies, syntax errors, or placeholder values remain.

## 3. Strict Prohibitions
- **No Hallucinated MCP / Tool Calls:** Never call MCP tools or agent skills with guessed arguments; always verify parameter schemas first.
- **No Unauthorized Architectural / Security Changes:** Never add custom headers (like COOP/COEP/CORP), security policies, or infrastructure overrides without explicit user authorization or documented vendor requirements.
- **No Placeholder Leakage:** Never put fake placeholder addresses (e.g., `0x1000...`), mock ABIs, or fake API keys into production code, SDKs, or LLM reference manifests (`llms.txt`, `llms-full.txt`, `agent-tools.ts`). Always use verified ground-truth values.
