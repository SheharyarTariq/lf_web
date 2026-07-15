import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Laundry Guides & Tips — Laundry Free Blog",
  description:
    "Practical laundry guides from the Laundry Free team — how to wash different fabrics, care for your clothes and get the most from a laundry collection service in Surrey.",
  alternates: { canonical: "/blog" },
};

const POSTS = [
  {
    slug: "how-laundry-collection-works",
    title: "How a Laundry Collection Service Works — Step by Step",
    description:
      "What actually happens from the moment you book a laundry pickup to the moment your clean clothes arrive back at your door.",
    readTime: "4 min read",
    date: "July 2026",
    tags: ["Laundry Service", "How It Works"],
  },
  {
    slug: "wash-and-fold-guide",
    title: "What Is Wash & Fold — and Is It Worth It?",
    description:
      "A plain-English guide to wash and fold laundry services: what they include, how they price items and why they are different from a standard laundrette.",
    readTime: "5 min read",
    date: "July 2026",
    tags: ["Wash & Fold", "Guide"],
  },
];

export default function BlogIndex() {
  return (
    <main className="flex-1">
      <section className="bg-dark pt-16 pb-14 px-12 text-center max-[860px]:pt-12 max-[860px]:px-5 max-[860px]:pb-10">
        <div className="text-[11px] font-bold tracking-[3px] uppercase text-lime/70 mb-3">Laundry Free</div>
        <h1 className="text-[clamp(32px,5vw,52px)] font-extrabold leading-none tracking-[-2px] text-white mb-5">
          Laundry <em className="text-lime not-italic">Guides</em>
        </h1>
        <p className="text-[16px] text-white/55 max-w-[440px] mx-auto leading-[1.65]">
          Practical advice on caring for your clothes, understanding laundry services and getting the best results.
        </p>
      </section>

      <section className="bg-white py-16 px-12 max-[860px]:py-12 max-[860px]:px-5">
        <div className="max-w-[800px] mx-auto">
          <div className="flex flex-col gap-6">
            {POSTS.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block p-8 rounded-[20px] bg-lf-bg border border-lf-border no-underline group hover:border-dark transition-colors duration-[200ms]"
              >
                <div className="flex gap-2 flex-wrap mb-3">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold tracking-[2px] uppercase text-muted bg-white border border-lf-border py-1 px-3 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-[20px] font-extrabold tracking-[-0.5px] text-dark mb-2 group-hover:text-dark/80 transition-colors">
                  {post.title}
                </h2>
                <p className="text-[14px] text-muted leading-[1.65] mb-4">{post.description}</p>
                <div className="flex items-center gap-3 text-[12px] text-muted/70">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                  <span className="ml-auto text-dark font-semibold group-hover:underline">Read →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
