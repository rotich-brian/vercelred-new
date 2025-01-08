import React from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";
import Link from "next/link";
import Image from "next/image";

interface BloggerAuthor {
  id: string;
  displayName: string;
  url?: string;
  image?: {
    url: string;
  };
}

interface BloggerPost {
  id: string;
  title: string;
  content: string;
  published: string;
  updated: string;
  url: string;
  author: BloggerAuthor;
  labels?: string[];
}

interface PostProps {
  post: BloggerPost;
  host: string;
  path: string;
  structuredData: any;
  featuredImage: string | null;
}

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const extractSlugFromUrl = (url: string): string => {
  const urlParts = url.split('/');
  const lastPart = urlParts[urlParts.length - 1];
  return generateSlug(lastPart.replace('.html', ''));
};

const extractFirstImage = (content: string): string | null => {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const match = content.match(imgRegex);
  return match ? match[1] : null;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  try {
    const apiKey = process.env.BLOGGER_API_KEY;
    const blogId = process.env.BLOGGER_BLOG_ID;
    const defaultOgImage = process.env.DEFAULT_OG_IMAGE || '/default-image.jpg';

    if (!apiKey || !blogId) {
      throw new Error("Missing Blogger API configuration");
    }

    const pathArr = ctx.query.postpath as string[];
    if (!pathArr || pathArr.length === 0) {
      return { notFound: true };
    }

    const requestedSlug = pathArr[0];

    const searchResponse = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?key=${apiKey}`
    );

    if (!searchResponse.ok) {
      return { notFound: true };
    }

    const searchData = await searchResponse.json();
    
    const matchingPost = searchData.items.find((post: BloggerPost) => {
      const postSlug = extractSlugFromUrl(post.url);
      return postSlug === requestedSlug;
    });

    if (!matchingPost) {
      return { notFound: true };
    }

    if (pathArr.length > 1) {
      return {
        redirect: {
          destination: `/${requestedSlug}`,
          permanent: true,
        },
      };
    }

    const postResponse = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/${matchingPost.id}?key=${apiKey}`
    );

    if (!postResponse.ok) {
      return { notFound: true };
    }

    const post: BloggerPost = await postResponse.json();
    const featuredImage = extractFirstImage(post.content) || defaultOgImage;

    const blogResponse = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogId}?key=${apiKey}`
    );
    const blogData = await blogResponse.json();

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.title,
      "image": featuredImage,
      "datePublished": post.published,
      "dateModified": post.updated,
      "author": {
        "@type": "Person",
        "name": post.author.displayName,
        "url": post.author.url
      },
      "publisher": {
        "@type": "Organization",
        "name": blogData.name,
        "logo": {
          "@type": "ImageObject",
          "url": `https://${ctx.req.headers.host}/logo.png`
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://${ctx.req.headers.host}/${requestedSlug}`
      }
    };

    return {
      props: {
        post,
        host: ctx.req.headers.host || "",
        path: requestedSlug,
        structuredData,
        featuredImage
      },
    };
  } catch (error) {
    console.error("Error fetching post:", error);
    return { notFound: true };
  }
};

const Post: React.FC<PostProps> = ({ post, host, path, structuredData, featuredImage }) => {
  if (!post || !host) {
    return <div>Error loading post</div>;
  }

  const canonicalUrl = `https://${host}/${path}`;
  const publishedDate = new Date(post.published).toISOString();
  const modifiedDate = new Date(post.updated).toISOString();

  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta name="description" content={post.title} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.title} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={featuredImage || ''} />
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      
      <main className="min-h-screen bg-gray-100">
        <article className="max-w-4xl mx-auto p-8 bg-white shadow-md rounded-lg">
          {/* Post Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {post.author.image && (
                <Image 
                  src={post.author.image.url} 
                  alt={post.author.displayName}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <span>{post.author.displayName}</span>
              <span>•</span>
              <time dateTime={publishedDate}>
                {new Date(post.published).toLocaleDateString()}
              </time>
            </div>
          </header>

          {/* Featured Image */}
          {featuredImage && (
            <div className="overflow-hidden rounded-lg mb-8">
              <Image
                src={featuredImage}
                alt={post.title}
                layout="responsive"
                width={1200}
                height={630}
                className="rounded-lg"
              />
            </div>
          )}

          {/* Post Content */}
          <div
            className="prose max-w-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Read Full Post */}
          <div className="mt-8 text-right">
            <Link href={post.url}>
              <a 
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read Full Post →
              </a>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
};

export default Post;
