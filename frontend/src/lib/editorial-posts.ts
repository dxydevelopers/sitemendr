export interface EditorialPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: {
    name: string;
    email: string;
  };
  category: string;
  tags: string[];
  publishedAt: string;
  readingTime: number;
  views: number;
  likes: number;
}

export const editorialImages = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1500&q=85',
  'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1500&q=85',
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1500&q=85',
  'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=1500&q=85',
  'https://images.unsplash.com/photo-1560264280-88b68371db39?auto=format&fit=crop&w=1500&q=85',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1500&q=85',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1500&q=85',
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1500&q=85',
];

export const editorialPosts: EditorialPost[] = [
  {
    id: 'sitemendr-editorial-workspace-record',
    title: 'Why a serious project needs a private workspace record',
    slug: 'private-workspace-record',
    excerpt: 'A workspace is not only a login screen. It is where scope, approvals, payment context, messages, files, and handoff stop drifting away from the work.',
    content: `A serious digital project needs memory. Not memory in the abstract sense, but a practical record of what was requested, approved, changed, paid for, delivered, and handed over.

## The problem with scattered work

Many projects do not fail because people lack effort. They fail because the work lives in too many places: one conversation in WhatsApp, a file in email, a price in an old message, a design note in a meeting, and a support request that nobody can connect to the original decision.

When that happens, the business loses context. The developer loses certainty. The client starts repeating themselves. Everyone becomes slower because the record is no longer trustworthy.

## What the workspace protects

A good workspace protects the work from confusion. It gives the client a place to see project state, billing, messages, approvals, resources, and support without turning the project into a chase.

It also protects future maintenance. Months after launch, the business should still know what was built, what access was handed over, what choices were made, and what needs care.

## The Sitemendr view

Sitemendr treats the workspace as part of delivery, not an afterthought. A project should leave behind more than a finished page. It should leave behind a clear operating record that the business can return to when something needs to be improved, repaired, renewed, or explained.`,
    featuredImage: editorialImages[0],
    author: { name: 'Sitemendr Editorial', email: 'editorial@sitemendr.com' },
    category: 'Workspace',
    tags: ['workspace', 'delivery', 'handoff'],
    publishedAt: '2026-05-24T08:00:00.000Z',
    readingTime: 4,
    views: 112,
    likes: 18,
  },
  {
    id: 'sitemendr-editorial-repair-before-rebuild',
    title: 'Repair before rebuild: when a damaged site still has value',
    slug: 'repair-before-rebuild',
    excerpt: 'Not every broken website needs to be thrown away. Some need diagnosis, cleanup, security, performance work, and a better operating foundation.',
    content: `A damaged website can be frustrating, but frustration is not a technical diagnosis. Before a business pays for a full rebuild, the existing system should be understood properly.

## A broken site is not always worthless

Some websites are slow because of media, scripts, hosting, plugins, or poor caching. Some break because updates were ignored. Some look old but still contain useful structure, content, traffic, or integrations.

Throwing everything away too quickly can waste money and erase useful context.

## What repair work should reveal

Repair work should answer direct questions. What is failing? What is still useful? What is risky? What can be stabilized? What should be rebuilt because it will keep causing trouble?

That clarity matters because it turns panic into a plan.

## The better decision

Sometimes repair is enough. Sometimes repair is the bridge to a proper rebuild. Either way, diagnosis gives the business a cleaner decision than guessing from the outside.`,
    featuredImage: editorialImages[1],
    author: { name: 'Sitemendr Editorial', email: 'editorial@sitemendr.com' },
    category: 'Repair',
    tags: ['repair', 'audit', 'recovery'],
    publishedAt: '2026-05-22T09:30:00.000Z',
    readingTime: 5,
    views: 96,
    likes: 14,
  },
  {
    id: 'sitemendr-editorial-commerce-before-checkout',
    title: 'Commerce work starts before the checkout button',
    slug: 'commerce-before-checkout',
    excerpt: 'A store is not only products and payments. The offer, product trust, page flow, delivery expectation, and checkout structure all carry the sale.',
    content: `A store can technically accept payments and still fail commercially. The checkout button is only one part of the buying journey.

## The sale begins earlier

Before someone reaches checkout, they judge the product, the promise, the photography, the pricing, the delivery expectation, the return logic, and the credibility of the business.

If those pieces are weak, a working checkout will not save the store.

## Structure creates confidence

Good commerce pages reduce doubt. They explain the product clearly, present proof, make delivery understandable, keep checkout calm, and avoid unnecessary friction.

Dropshipping and eCommerce work especially need this discipline because customers are sensitive to trust signals.

## What Sitemendr builds toward

The goal is not only to launch a storefront. The goal is to shape a buying path that feels considered from first impression to payment confirmation.`,
    featuredImage: editorialImages[2],
    author: { name: 'Sitemendr Editorial', email: 'editorial@sitemendr.com' },
    category: 'Commerce',
    tags: ['ecommerce', 'dropshipping', 'checkout'],
    publishedAt: '2026-05-20T10:00:00.000Z',
    readingTime: 4,
    views: 134,
    likes: 21,
  },
  {
    id: 'sitemendr-editorial-maintenance-is-not-emergency',
    title: 'Maintenance should not begin only after something breaks',
    slug: 'maintenance-before-emergency',
    excerpt: 'Ongoing care is how a business keeps its site updated, watched, backed up, corrected, and ready for the next decision.',
    content: `Maintenance is often treated like a rescue service. Something breaks, the business panics, and only then does the site receive attention.

## Quiet care matters

The most valuable maintenance is often invisible. Updates are handled before they become incidents. Backups are checked before they are needed. Small issues are corrected before they become expensive.

This kind of care protects reputation, time, and continuity.

## What monthly care should include

A maintenance plan should not be vague. The business should understand what is monitored, what is updated, what is backed up, what is reviewed, and how support requests are handled.

Without that clarity, maintenance becomes another unclear subscription.

## A better operating habit

Sitemendr treats maintenance as part of digital operations. The site is not abandoned after launch. It is kept alive with context, records, and practical care.`,
    featuredImage: editorialImages[3],
    author: { name: 'Sitemendr Editorial', email: 'editorial@sitemendr.com' },
    category: 'Maintenance',
    tags: ['maintenance', 'monitoring', 'support'],
    publishedAt: '2026-05-18T11:00:00.000Z',
    readingTime: 4,
    views: 88,
    likes: 11,
  },
  {
    id: 'sitemendr-editorial-build-scope',
    title: 'A clear build scope is a business asset',
    slug: 'clear-build-scope',
    excerpt: 'Custom development becomes easier to price, approve, build, and hand over when the scope explains the business problem before the feature list.',
    content: `A scope is not just a list of pages or features. It is the first serious document that tells the project what it is allowed to become.

## Features are not enough

Two businesses can ask for the same feature and need completely different work. A dashboard, portal, booking flow, or public website only makes sense when the business situation behind it is understood.

Without that understanding, scope becomes a shopping list instead of a delivery plan.

## What a good scope clarifies

It should explain who will use the system, what decisions it supports, what must be handed over, what risks must be avoided, and what success should look like.

That makes pricing more honest and delivery less chaotic.

## Why it matters

Clear scope protects both the client and the builder. It reduces guessing, keeps approvals grounded, and gives the finished work a stronger chance of becoming useful.`,
    featuredImage: editorialImages[4],
    author: { name: 'Sitemendr Editorial', email: 'editorial@sitemendr.com' },
    category: 'Build',
    tags: ['development', 'scope', 'planning'],
    publishedAt: '2026-05-16T12:00:00.000Z',
    readingTime: 5,
    views: 121,
    likes: 17,
  },
  {
    id: 'sitemendr-editorial-client-approval',
    title: 'Approval should be visible before delivery begins',
    slug: 'visible-approval-before-delivery',
    excerpt: 'Professional delivery needs visible decisions: price, scope, milestones, payment, responsibilities, and what happens after launch.',
    content: `A project becomes easier to manage when approval is not hidden inside casual conversation.

## Why visible approval matters

Before delivery begins, the client should understand what has been approved, what has not been approved, what the payment covers, and what the next stage requires.

This protects the project from confusion later.

## The delivery record

When approvals stay connected to the workspace, the business can return to the decision instead of searching through messages. That is useful during development and even more useful after handoff.

## Professional rhythm

Sitemendr’s direction is simple: make the important parts visible early. Scope, price, payment, files, progress, and support should not become a guessing game.`,
    featuredImage: editorialImages[5],
    author: { name: 'Sitemendr Editorial', email: 'editorial@sitemendr.com' },
    category: 'Process',
    tags: ['approval', 'process', 'delivery'],
    publishedAt: '2026-05-14T14:00:00.000Z',
    readingTime: 3,
    views: 77,
    likes: 9,
  },
];

export function findEditorialPost(slug: string) {
  return editorialPosts.find(post => post.slug === slug) || null;
}
