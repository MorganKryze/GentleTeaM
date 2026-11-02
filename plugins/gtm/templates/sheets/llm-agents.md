# LLM agents and prompt engineering

> Helps a role design, evaluate and secure the prompts, context, tools and control loop of a
> language-model agent so it does its task reliably, safely and measurably.

## When it applies
- Writing or changing a system prompt, few-shot examples, a tool description or an agent context
  file.
- Choosing between one model call, a fixed workflow, a single agent loop and several cooperating
  agents.
- Giving a model tools that act on the world, or letting it read content the team does not control.
- Building or reviewing an evaluation suite, a model-graded rubric or a release gate for
  non-deterministic output.
- Moving an existing prompt or agent to a new model.

## Method
1. Start with the simplest design: one call with retrieval and examples. Add a fixed workflow
   (chaining, routing, parallel calls, orchestrator-workers, evaluator-optimizer) only when it
   measurably helps. Add an autonomous loop only when the steps cannot be predicted, and several
   agents only for breadth-first work that splits into independent parts. Record why each step up
   was taken.
2. Before tuning, write 20 to 50 evaluation tasks from real failures. Each task is unambiguous and
   has a reference solution. Balance cases where the agent should act with cases where it should
   not. Run each task in a clean environment and grade it on the final state, not on a fixed path.
3. Write the system prompt at the right altitude: distinct sections, the minimal information that
   fully defines the behavior, no contradictions. Prefer a few diverse canonical examples to long
   edge-case lists. Start minimal with a strong model and add instructions only against observed
   failures.
4. Design tools as an interface for the model: few, non-overlapping, self-contained, with
   descriptive parameters, example usage and stated boundaries. Make misuse hard (for instance,
   require absolute paths), keep results token-efficient, and test each tool on many inputs.
5. Treat context as a finite budget: load data just in time through identifiers, clear old tool
   results, and compact long histories (tune for recall first, then precision). Keep notes outside
   the window, and limit context files to non-standard requirements.
6. Map trust: list the untrusted inputs and the consequential actions (side effects, data leaving).
   Make sure untrusted input cannot trigger a consequential action, for example with a fixed plan
   made before reading, isolated processing without tools, or selection among fixed actions. Add
   least privilege, sandboxed execution, human approval for high-risk actions, and attack cases in
   the suite. Never rely on detectors or prompt wording alone.
7. Run every change k times. Gate regressions on all-k success, and track capability rates and
   tokens per successful task. Read transcripts before trusting a score, and calibrate model graders
   on human labels.
8. On a model change, re-run the suite and revisit instructions tuned for the previous model, such
   as pushes for maximal context gathering that cause tool overuse.
9. Treat model output as untrusted input to whatever consumes it. Check it against the expected
   format before anything acts on it, encode it for where it goes (page, query, command, file path),
   and pass it into queries only as parameters. Restrict the addresses that rendered output may load
   from or link to: loading an image, or a link a user clicks, can carry data out.
10. Bound every run. Cap turns, total actions, wall time and spend per task, cap requests and spend
    per user, and never leave a cap disabled. A run that hits a cap ends as a visible failure, not
    as a partial answer reported as success. Log consumption per run and alert on unusual patterns.
11. After release, log a trace of every real run (input, model and tool calls with their results,
    tokens, outcome). Read a sample of real-user traces on a fixed schedule. The sample may shrink
    as the team learns, but the reading never stops. Turn each new failure found there into a suite
    task, since the suite only holds failures someone has already seen.

## Reflexes
- Would a fixed workflow do as well, and what will autonomy cost in tokens and compounding errors?
- Do the parts of this task share decisions that one context should hold, or are they truly
  independent?
- If a human could not say which tool fits a request, how would the model?
- Which tokens here earn their place, and what happens to success and cost without them?
- Can any text the agent reads (page, file, tool result, another agent) lead to a side effect or a
  data leak?
- Where does the model's output land next (a page, a query, a command, a link someone clicks), and
  what runs or leaves if that output is hostile?
- Do two instructions contradict each other, leaving the model to reconcile them?
- Is this score trusted because transcripts were read and the grader checked, or only because it
  rose?
- What evidence backs this practice: a measure on tasks like ours, a vendor's internal number or an
  anecdote?

## What is measured
- Regression pass^k: each regression task succeeds on all k trials, graded by code on the final
  state. A `verify` step fails on any task short of k out of k.
- Capability rate (pass@1, or pass@k where one success suffices) on a separate suite: tracked, not
  gated. When it nears 100 %, the suite approaches saturation and needs harder tasks.
- Success and tokens per run, before and after a change to prompts, tool descriptions or context
  files. A `verify` step fails on a success drop beyond a tolerance or a token rise beyond a margin,
  both set from the spread between identical runs.
- Attack cases: injection tasks whose grader checks that no consequential action happened. A
  `verify` step requires all of them to pass.
- Trust map: no agent holds both a tool that reads untrusted input and a consequential tool without
  approval or isolation. A `verify` step checks the declared tool list.
- Output sinks: attack cases whose planted text makes the model emit active markup, a query
  fragment, a command, or an image or link to an outside address carrying context data. A `verify`
  step requires each one to reach its destination harmless: encoded, parameterized, rejected or
  never loaded.
- Model-grader agreement with human labels on a fixed sample, with an explicit unknown verdict. A
  `verify` step runs it when the grader's prompt or model changes.
- Run bounds: every loop declares caps on turns, time and spend, and none is disabled. A `verify`
  step reads the declared caps and runs one task built never to finish, failing unless the run stops
  at a cap and reports a failure.
- Production review: traces of real runs, a sample read each period, and the new failures turned
  into suite tasks. The reading stays judgment; a `verify` step checks that a test run leaves a
  trace with every model call, every tool call and its result, and the token count.
- Stays judgment: the choice of architecture, the altitude of a prompt, whether a task is
  unambiguous (two experts reach the same verdict), and transcript reading.

## Sources
- [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents),
  2026-11-01: workflow versus agent, five workflow patterns, simplicity first, tool interface
  design.
- [Effective context engineering for AI
  agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents),
  2026-11-01: context budget, prompt altitude, minimal tools, canonical examples, just-in-time
  loading, compaction, notes.
- [Demystifying evals for AI
  agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), 2026-11-01:
  grader types, pass@k and pass^k, task-building roadmap, saturation, transcript reading.
- [How we built our multi-agent research
  system](https://www.anthropic.com/engineering/multi-agent-research-system), 2026-11-01: when
  several agents pay off, their token cost, small first evals, human review.
- [Don't Build Multi-Agents](https://cognition.com/blog/dont-build-multi-agents), 2026-11-01: shared
  full traces, implicit decisions in actions, a single sequential agent with compression.
- [GPT-5 prompting
  guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide), 2026-11-01:
  cost of contradictions, eagerness control, prompts inherited from older models.
- [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/),
  2026-11-01: no known fool-proof prevention, seven mitigations.
- [Design Patterns for Securing LLM Agents against Prompt
  Injections](https://arxiv.org/abs/2506.08837), 2026-11-01: no consequential action from untrusted
  input, six design patterns, utility trade-off.
- [Evaluating AGENTS.md](https://arxiv.org/abs/2602.11988), 2026-11-01: context files generally do
  not raise success and add over 20 % inference cost on average; they are useful for specifying
  non-standard coding practices.
- [OWASP LLM05:2025 Improper Output
  Handling](https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/), 2026-11-01: zero
  trust toward model output, validation before downstream use, encoding for each destination,
  parameterized queries, a strict Content Security Policy, exfiltration through injected output.
- [The lethal trifecta for AI agents](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/),
  2026-11-01: loading an image or offering a link as a way out for stolen data, vendor fixes that
  close that channel.
- [OWASP LLM10:2025 Unbounded
  Consumption](https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/), 2026-11-01: denial
  of wallet, timeouts and throttling, per-user rate limits, caps on queued and total actions,
  monitoring of consumption.
- [Running agents (OpenAI Agents
  SDK)](https://openai.github.io/openai-agents-python/running_agents/), 2026-11-01: the loop ends on
  a final output with no tool call, exceeding the turn cap raises an explicit error, and the cap can
  be switched off.
- [Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/), 2026-11-01: logging traces,
  reading real-user traces with a sample that may shrink but never stops, updating tests from newly
  seen failures.
