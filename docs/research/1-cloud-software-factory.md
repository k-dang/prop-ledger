# Zach Lloyd on X: "How to build a cloud software factory - the automatic triage skill" / X

> Source: https://x.com/zachlloydtweets/status/2070178587978665988
> Author: Zach Lloyd@zachlloydtweets
> Date: 2026-06-25T16:13:32.000Z

This post is the first in a series I’m doing on how to set up your own cloud software factory using skills and loops. It’s easier than it sounds to get something simple and effective running so you can start to automate significant parts of your team’s development flow.

By “cloud software factory” I mean a setup where agents semi-automatically do key parts of the SDLC from triaging issues to spec’ing to coding and verifying changes using cloud agents. You can see a live example of a cloud factory on Warp’s 60k star Github repo:

[build.warp.dev](http://build.warp.dev/)

.

[![Image](https://pbs.twimg.com/media/HLq_lZkXkAAgoP7?format=jpg&name=small)](https://x.com/zachlloydtweets/article/2070178587978665988/media/2070177627969654784)

The factory workflow is straightforward:

1. Triage agent runs and tries to understand and repro issue

- If it determines the task is automatable → hand it to the implementation agent
- If it needs specs because of ambiguity or scope → have the spec agent spec it
- If requirements are unclear → get human input and re-run, or just decide to park the issue for now

2. [If necessary] Spec agent runs

- Human reviews specs and then passes to implementation agent

3. Implementation agent writes code

4. Code review agent reviews code

5. Verification agent does computer-use or other verification

6. Human reviews code and verification output

- If necessary, go back to step 2, 3, 4 or 5

7. CI / CD

8. Ship it

9. Monitor agent runs and creates issues if need be completing the loop

[![Image](https://pbs.twimg.com/media/HLrAMsyXEAEPCJk?format=jpg&name=900x900)](https://x.com/zachlloydtweets/article/2070178587978665988/media/2070178303143514113)

A full factory has the whole SDLC loop implemented, but you can start with just some particular slice and add on more agentic flows as you go.

In this post, I’ll start with just Triage → Implement. This will give you the ability to hook up some task management system (e.g. Linear, Jira or Github Issues), have an agent triage issues that come in and implement fixes that the Triager thinks are simple enough to one-shot. In future posts I’ll show how to expand this flow to other parts of the SDLC, including adding agents for spec’ing and verifying, and set it up to improve automatically over time using Skill loops. For now, success is having some percentage of issues automatically implemented up to the point of code review.

My approach here is to set up the factory using an approach that isn’t tightly coupled to any one coding agent or platform and uses Skills and loops as its basis. The goal is to get folks comfortable with a factory approach from first principles (

[see my post on factory engineering here](https://www.warp.dev/blog/we-are-now-factory-engineers-not-product-engineers)

); later you can

[explore platforms](http://oz.dev/)

 that make it easier to manage and scale your factory (and I do suggest this for most teams, as

[building all of the infra to scale a factory is a lot of work](https://www.warp.dev/blog/build-vs-buy-coding-agents-at-scale)

).

Here’s what you need to get started:

1. A repo you want to perform automations on, preferably hosted on Github.
2. A Docker image with the toolchain for that repo, and a place to run it in the cloud.
3. An issue tracker that has an MCP or CLI.
4. Two base Skills:
5. [A Skill for issue triage](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.agents/skills/triage/SKILL.md)
6. [A Skill for implementation](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.agents/skills/implementation/SKILL.md)
7. A coding agent SDK (e.g. Claude Code or Codex or

[Warp](http://oz.dev/)

)

I’m going to do this walkthrough using

[Oz](http://oz.dev/)

, Warp’s cloud factory platform, but you could host it any number of places.

For this walkthrough, I’ll use a demo repo I vibe-coded that’s a simple image editor based on Nano Banana:

[https://github.com/warpdotdev-demos/nano-banana-editor](https://github.com/warpdotdev-demos/nano-banana-editor)

[![Image](https://pbs.twimg.com/media/HLq_pPVXcAAJc0d?format=jpg&name=small)](https://x.com/zachlloydtweets/article/2070178587978665988/media/2070177693941854208)

A simple image editing app

I’ve also seeded a bunch of fake issues for improving this tool in Github

[issues](https://github.com/warpdotdev-demos/nano-banana-editor/issues)

.

Let’s say that as issues come in, they get triaged into one of four possible states: ready-to-implement, ready-to-spec, needs-info, and wait-to-implement. You can come up with your own label hierarchy here or use whatever your team currently uses.

Depending on the label applied by the Triager, the issue will flow to the next agent or stay parked:

1. ready-to-implement → issue goes directly to an implementation agent
2. ready-to-spec → issue goes to a “spec’ing” agent that writes product and tech specs (will show in a later post)
3. needs-info, wait-to-implement → no action until a human reviews and sets another label

Here’s what you need to implement this:

1. A Docker image for your code. We use node:20-bookworm for the sample JavaScript project.
2. A place to run this image on a trigger with a coding agent (we will use

[Oz](http://oz.dev/)

 here, which has cloud hosting and built-in multi-agent support)
3. A Github action for invoking the triage agent when a new issue is filed.
4. A Triage skill encoding the labeling workflow above

[![Image](https://pbs.twimg.com/media/HLq_rXrWMAA8nE7?format=jpg&name=small)](https://x.com/zachlloydtweets/article/2070178587978665988/media/2070177730541268992)

[The Triage skill](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.agents/skills/triage/SKILL.md)

[![Image](https://pbs.twimg.com/media/HLq_tTRWMAAKzsz?format=jpg&name=small)](https://x.com/zachlloydtweets/article/2070178587978665988/media/2070177763718213632)

[The Github action](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.github/workflows/triage-issues.yml)

[![Image](https://pbs.twimg.com/media/HLq_vuUWoAAj3zp?format=jpg&name=small)](https://x.com/zachlloydtweets/article/2070178587978665988/media/2070177805338320896)

The result on a test issue

Once you have this in place, the next step is to automatically implement issues that the triage agent marks ready-to-implement. The implementation agent is, you guessed it, just another Skill.

[![Image](https://pbs.twimg.com/media/HLq_x3jWcAA_Kso?format=jpg&name=900x900)](https://x.com/zachlloydtweets/article/2070178587978665988/media/2070177842176880640)

[The implementation skill](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.agents/skills/implementation/SKILL.md)

As long as you have a strong coding agent available, a Skill is good enough to start. You can get fancier and build specific subagents or even a custom harness for this step (and we are bundling this into

[Oz](http://oz.dev/)

), but it’s not necessary out of the gate.

With this skill in place, just add one more Github action that fires off another cloud agent whenever the ready-to-implement label is applied:

[![Image](https://pbs.twimg.com/media/HLq_687WQAAqmJV?format=jpg&name=small)](https://x.com/zachlloydtweets/article/2070178587978665988/media/2070177998238531584)

[The second github action for implementation](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.github/workflows/implement-ready-issues.yml)

This produced a reasonable

[diff](https://github.com/warpdotdev-demos/nano-banana-editor/pull/17)

 on

[https://github.com/warpdotdev-demos/nano-banana-editor/issues/15](https://github.com/warpdotdev-demos/nano-banana-editor/issues/15)

, implementing a small feature in the app.

To recap, here’s what we’ve done so far:

1. Made two skills, one for triage, one for implementation
2. Invoked these Skills using Github actions when new issues are opened, attaching labels at the time of triage
3. Used Warp as the coding agent and Oz as the cloud agent runner to implement issues that are labeled one-shot ready.

That’s it. At this point, you have a very minimal but functional cloud software factory that triages issues and implements simple fixes and features.

If you want to try this yourself, the best approach is to follow the instructions at

[https://github.com/warpdotdev-demos/cloud-factory-demo](https://github.com/warpdotdev-demos/cloud-factory-demo)

 to install the relevant agents on your own repo.

I also made a Skill that helps set up this triager on your own repository:

bash

```
npx skills@latest add warpdotdev-demos/cloud-factory-demo --skill oz-cloud-factory-demo --agent warp --yes
```

This installs an /oz-cloud-factory-demo skill that you can invoke in any coding agent (e.g. Claude Code, Codex or Warp) which will walk you through how to run this demo locally. This uses

[Oz](http://oz.dev/)

 as the runner since it’s flexible to any model provider (

[including open-weight models](https://x.com/warpdotdev/status/2069489798939549880?s=20)

) and whatever environment configuration you need via Docker. If you prefer to use another cloud agent platform, just ask your agent how to set it up on that platform and it will guide you.

In my next post, I’ll show how to extend this system to be more sophisticated by supporting spec-driven development and richer human-in-the-loop workflows.
