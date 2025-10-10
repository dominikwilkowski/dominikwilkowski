---
title: Technical debt, moving by standing still
date: '2024-10-01T06:15:40+10:00'
draft: false
visibility: true
summary: |
  Sometimes progress looks like standing still.
  In software, that pause, the decision to improve what already exists rather than chase what’s next, is often the difference between systems that endure and those that collapse under their own weight.<br>
  This post explores why slowing down to strengthen the foundation is one of the most powerful moves a technology company can make.
description: A reflection on why addressing technical debt matters more than flashy features, and how steady, boring progress builds resilient software.
tags: ["Management", "Technical Debt"]
toc: true
autonumber: false
readTime: true
math: false
showTags: true
hideBackToTop: false
header: assets/header.jpg
---

> _This post was originally published on
> [The Working Party Blog](https://theworkingparty.com.au/journal/shopify-winter-editions-25/)_.

<br>
In 2009, Apple took an unorthodox approach with its Mac operating system.
Instead of dazzling customers with flashy new features, it decided to focus on
something less glamorous but arguably more important: the foundation.
The release was called Snow Leopard, and its primary goal was to streamline
performance, improve stability, and shore up the platform's underpinnings rather
than chase the next attention-grabbing headline.
It was a deliberate pause, an invitation to fine-tune what already existed and
bolster long-term health over short-term excitement.

This is the direction Shopify has taken within
[its Winter Edition 25](https://www.shopify.com/editions/winter2025).
Dubbed "The Boring Edition", the suite of enhancements are focused on
strengthening the platform's core and providing more flexible tools for
merchants.
As described by the platform:

> 150+ updates. Nothing new, everything improved.
{cite="https://www.shopify.com/editions/winter2025" caption="Shopify"}

While I will touch on the key announcements and what they mean for retailers,
I have a strong suspicion that there has been a lot of work beyond the vail of
marketing.
Work of the unsung heroes of software development that demonstrate meaningful
progress often lies in the work we don't immediately see.
It's a lesson worth revisiting: by embracing internal improvements and
systematically addressing technical debt, companies can strengthen their
foundations, ensuring that every new innovation rests on something stable and
sustainable.

## First, what are the Editions Winter ‘25 optimizations and improvements?

Some of the key optimizations focus on the ability to handle vaulted credit
cards and deposits within draft orders, expanding the customization and
consistency of checkout experiences via Shopify Functions and Checkout Blocks,
and adding chat capabilities to checkouts.
Retailers can now leverage Shop Pay Installments for their Shop Pay Component,
optimize fulfillment using location metafields, and enrich customer accounts
with extensions and apps, particularly beneficial for B2B buyers.

Additionally, they've introduced segmentation for Google Ads audiences,
integrated session recordings and heat-maps into Pixels, offered new analytics
and discount extension capabilities, and broadened Shop Campaigns beyond Plus
merchants.
On the developer side, Shopify is elevating GraphQL as the primary admin API,
introducing more flexible theme blocks, and rolling out Sidekick, an AI
assistant, to more brands.
But, as mentioned, I believe this is only scratching the surface of the true
improvements.

As an engineer, I've observed that technical debt is one of the least
appreciated aspects of software development.
It's invisible on the surface but looms large in the future of any
software-driven company.
To many, it feels like an abstract concept, a nuisance that can be ignored in
the pursuit of growth.
To others it's something staunchly avoided in an effort to reach perfection.
But in reality, technical debt is like financial debt: a strategic tool when
managed wisely and a crippling liability when left unchecked.

## Now, what is technical debt?

Think of technical debt as borrowing from a bank.
Sometimes, you take a loan because you need quick cash to seize an opportunity.
Similarly, you might take shortcuts in your codebase, choosing a quick but
imperfect solution to meet a deadline or market demand.
This is not inherently bad.
Debt, when incurred intentionally, can accelerate innovation and give your
company a competitive edge.
However, just like with financial debt, there's a catch: you have to pay it
back.

## The cost of neglecting technical debt

When you neglect technical debt, it compounds.
The interest takes the form of slower development cycles, fragile systems, and
increasing costs of adding new features.
Here's an example: imagine you build an e-commerce platform and skip writing
automated tests to hit an aggressive launch date.
At first, things seem fine, but as the platform grows, the lack of tests makes
every code change more risky.
Eventually, even minor updates require hours, the frequency of breaking things
as you merge new features increases and everyone is getting frustrated at the
lack of progress.
The shortcut that saved you time upfront now costs you exponentially more.

Worse still, unchecked debt can snowball to the point of no return.
Entire systems can become so brittle and outdated that your team hesitates to
touch them.
I've seen companies where adding a single feature required weeks of work, not
because the feature was complex, but because the codebase had become a tangled
mess.
This stagnation leads to missed opportunities and, ultimately, obsolescence.
Software dies when left untended.

In addition to the above costs, an often overlooked side effect of technical
debt is the emotional and cultural impact.
Persistent technical debt can demoralize teams.
If engineers are constantly working around bad code, they may feel frustrated,
undervalued, or disengaged.
Over time, this can lead to burnout or attrition or simply to the worst outcome:
engineers not caring anymore.
A company culture that ignores technical debt leads to a mindset of "just ship
it" without regard for long-term consequences.
Conversely, a culture that prioritizes quality can foster pride in craftsmanship
and attract top talent.

## Why timing matters

Managing technical debt is about timing.
Not every piece of debt needs to be paid off immediately, but every debt needs
to be tracked and planned for.
When your team makes a trade-off, document it.
Define the circumstances under which you'll revisit and address it.
For example:

- A quick hack to fix a bug in production might be fine for a week but should be
followed but a clean up task already planned in at the time of its inception.

- Adopting a suboptimal database schema to meet a product launch date is
reasonable, but you should plan a refactor once the feature stabilizes and have
assessed its scope and size before opting into it.

- Relying on an outdated library might work today, but eventually, it will need
to be replaced before it becomes a blocker.
You may not care about its current features but you may about its next and to
get those you have to go through the cascade of missed versions you skipped
before.

The key is to stay proactive and opt into the debt with open eyes.
If you wait until technical debt becomes critical or you find yourself
surprised at its cost, you'll pay a much higher price.

## Technical debt in strategic decision-making

As an engineer and especially one in tech leadership, managing technical debt is
part of keeping the long-term vision alive.
Developing software isn't just about delivering features, it's about building
systems that remain adaptable and efficient over time.
Neglecting the health of your codebase for short-term gains is deceptively cheap
with a steep risk curve.

This is especially true as your software scales.
A scrappy startup can survive with a little chaos in its codebase, but as you
grow, that chaos becomes a bottleneck.
To grow effectively, you need to advocate for both immediate results and
sustainable practices.
This means communicating the places where there is technical debt hidden in your
codebase as well as the value of investing to pay it off to stakeholders who may
not understand why time spent refactoring or improving test coverage matters.

## The role of leadership

Ultimately, managing technical debt is about discipline and vision.
It's easy to chase short-term wins, but great leaders also focus on the long
game.

> Give me six hours to chop down a tree and I will spend the first four
sharpening the axe.
{caption="Abraham Lincoln (did not say this, contrary to popular belief)"}

If you want your software to thrive, you need to balance the urgency of today
with the needs of tomorrow.
By keeping your codebase healthy and your technical debt under control.
Not debt free, that's another extreme.
Keeping it under control, deliberate and nuanced, much like budgeting a loan in
keeping with the analogy.
That's how you ensure that your systems remain a foundation for growth, not a
barrier to it.

In the end, software is a living, breathing entity.
It needs constant care, attention, and iteration to stay relevant.
Keeping an eye on technical debt is one of the most effective ways to keep your
software, and your company, alive and healthy.
As a CTO, this is 90% of my job: making decisions today that ensure you'll still
be thriving years from now.

Technical debt isn't a monster to fear, but a tool to wield carefully.<br>
Manage it with intent, and it will serve you well.<br>
Ignore it, and it will consume you.<br>
Don't fear the snow leopard.<br>
Make it your friend.
