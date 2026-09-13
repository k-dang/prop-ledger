# (1) Zach Lloyd on X: "How to build a cloud software factory - spec-driven development skills" / X

> Source: https://x.com/zachlloydtweets/status/2071670840660533393
> Author: Zach Lloyd@zachlloydtweets
> Date: 2026-06-25T16:13:32.000Z

This is my second post in a series on how to build out a fully automated cloud software factory. In this post, I’ll show how you can add spec-driven development for issues that are too complex or ambiguous to one-shot. The goal of these posts is to build a fully working factory that addresses the whole SDLC.

[In my prior post](https://x.com/zachlloydtweets/status/2070178587978665988)

, we started with a simple flow of Triage → Implementation, where an agent reviews the quality of an issue, asks clarifying questions, and implements as draft PR if the issue is scoped well enough to one-shot.. This works well for straightforward bugs and small features, but doesn’t work for issues that have more ambiguity or technical complexity.

In order to have factory agents work with those kinds of issues, we will add a new agent: the

[Spec agent](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.agents/skills/spec/SKILL.md)

:

1. If the issue is simple, apply “ready-to-implement” label →

[Implementation Agent](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.agents/skills/implementation/SKILL.md)

 runs
2. If the issue is complex but fits the roadmap, apply “ready-to-spec” label →

[Spec Agent](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.agents/skills/spec/SKILL.md)

 runs
3. If the issue has ambiguity, apply “needs-info”
4. Otherwise, apply “wait-to-implement”

We implemented the basics of this earlier, but now we will refine the “ready-to-spec” step.

The first change to get this to work is to update the

[Triage skill](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.agents/skills/triage/SKILL.md)

 to have a better logic for when to create specs. We should apply “ready-to-spec” when an issue:

1. Matches our roadmap and vision
2. I added “

[roadmap.md](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/roadmap.md)

” and “

[vision.md](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/vision.md)

” to our sample image editor project describing what we want it to turn into and what we are planning on building towards to help the agent here
3. Has enough complexity or ambiguity that it would benefit from a spec. To keep it simple:
4. “Ambiguity” means there are many potential product or technical implementations that have significant differences, and a human should weigh in on which is best
5. “Complexity” means that the implementation would be more than a few hundred lines of code.

[![Image](https://pbs.twimg.com/media/HMAJzBqaUAAq6_9?format=jpg&name=small)](https://x.com/zachlloydtweets/article/2071670840660533393/media/2071666600814727168)

[The roadmap for our example app](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/roadmap.md)

Here’s the update to our triage skill to handle spec’ing:

[![Image](https://pbs.twimg.com/media/HMAJ8T0aUAEnb-0?format=jpg&name=small)](https://x.com/zachlloydtweets/article/2071670840660533393/media/2071666760307331073)

[The updated triage skill](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.agents/skills/triage/SKILL.md)

If the issue is either ambiguous or complex but matches the roadmap and vision, the Triager applies the “ready-to-spec” label, which triggers a new

[Github action](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.github/workflows/spec-ready-issues.yml)

 that invokes a new

[Spec agent](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.agents/skills/spec/SKILL.md)

.

[![Image](https://pbs.twimg.com/media/HMAJ_wva4AEUaPC?format=jpg&name=small)](https://x.com/zachlloydtweets/article/2071670840660533393/media/2071666819610632193)

[The spec action](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.github/workflows/spec-ready-issues.yml)

I’m re-using all the infrastructure I set up in the first post, which means you’ll need a Docker image with your code and toolchain, a place to run it (our example uses

[Oz](http://oz.dev/)

, Warp’s cloud automation platform), and the ability to set up Github actions.

The spec action produces two specs:

1. A

[PRODUCT.md](https://github.com/warpdotdev/common-skills/blob/main/.agents/skills/write-product-spec/SKILL.md)

: this is responsible for defining the product behavior for the agent to implement
2. A

[TECH.md](https://github.com/warpdotdev/common-skills/blob/main/.agents/skills/write-tech-spec/SKILL.md)

: this is responsible for defining the tech architecture and code shape.

These both live under a “specs” directory that is tied to the issue number being fixed.

[![Image](https://pbs.twimg.com/media/HMAKB-3boAAD1Zl?format=jpg&name=small)](https://x.com/zachlloydtweets/article/2071670840660533393/media/2071666857762070528)

A sample PRODUCT.md for a feature in our example image editing app

[![Image](https://pbs.twimg.com/media/HMAKIfRbsAAe9Tu?format=jpg&name=small)](https://x.com/zachlloydtweets/article/2071670840660533393/media/2071666969540276224)

A sample TECH.md

I would recommend checking in these specs as part of your implementation PR, although you can also check them in separately first, and do the implementation only after they are merged. Checking them in gives you a record of the “what” and the “how” that the agent was aiming for that you can later verify against. I’ll show you how to do this when we add a Verification agent using

[/validate-changes-match-specs](https://github.com/warpdotdev/common-skills/blob/main/.agents/skills/validate-changes-match-specs/SKILL.md)

 in a later post.

The agent will produce an initial version of the specs, but it’s often a good idea to pull them into your local workspace and go through an interactive refinement process to align your expectations with the agent. I recommend something like

[Matt Pocock’s /grill-me Skill](https://github.com/mattpocock/agents/blob/main/skills/grill-me/SKILL.md)

 for this.

Once the specs look good, ask your agent to mark the underlying issue as ready-to-implement (or just mark it as such directly in Github). This kicks off our implementation agent on building the spec’d version. To make this work, I updated our

[implementation skill](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.agents/skills/implementation/SKILL.md)

 to look for specs and follow them while implementing.

[![Image](https://pbs.twimg.com/media/HMAKRKpagAAobLL?format=jpg&name=small)](https://x.com/zachlloydtweets/article/2071670840660533393/media/2071667118622539776)

[Instructing the implementation agent to follow the specs](https://github.com/warpdotdev-demos/cloud-factory-demo/blob/main/.agents/skills/implementation/SKILL.md)

Once you have this all in place, you now have a flow that can accept issues, implement the simple ones, spec the harder ones, and loop you in when necessary to review and iterate.

The next step after this is to start making sure the implementation is high quality by adding review and verification agents – this will be the subject of my next post.

If you want to try it yourself, follow the instructions here:

[https://github.com/warpdotdev-demos/cloud-factory-demo/](https://github.com/warpdotdev-demos/cloud-factory-demo/)

 and run the /oz-cloud-factory-demo skill using

[Warp’s cloud platform](http://oz.dev/)

 or a coding agent of your choice.

Try it out and let me know how it goes. Also read this post on creating the triage agent if you missed it:

Zach Lloyd

![](https://pbs.twimg.com/profile_images/2089744783694606336/p0K5KSLo_bigger.jpg)

@zachlloydtweets

·

[Jun 25](https://x.com/zachlloydtweets/status/2070178587978665988)

![Article cover image](https://pbs.twimg.com/media/HLrAVymXoAAX3cG?format=jpg&name=small)

Article

How to build a cloud software factory - the automatic triage skill

This post is the first in a series I’m doing on how to set up your own cloud software factory using skills and loops. It’s easier than it sounds to get something simple and effective running so you...

[14K](https://x.com/zachlloydtweets/status/2070178587978665988/analytics)
