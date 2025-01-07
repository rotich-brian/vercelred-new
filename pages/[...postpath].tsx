// File: pages/[...postpath].tsx
import React from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";

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
  thumbnail: string | null;
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

const getExcerpt = (content: string): string => {
  const strippedContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return strippedContent.length > 160 
    ? `${strippedContent.substring(0, 157)}...` 
    : strippedContent;
};

// Function to extract first image from content
const extractFirstImage = (content: string): string | null => {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const match = content.match(imgRegex);
  return match ? match[1] : null;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  try {
    const apiKey = process.env.BLOGGER_API_KEY;
    const blogId = process.env.BLOGGER_BLOG_ID;
    const defaultOgImage = process.env.DEFAULT_OG_IMAGE || 'https://your-default-image.jpg';

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

    // Extract thumbnail from content
    const thumbnail = extractFirstImage(post.content) || defaultOgImage;

    // Get blog information for structured data
    const blogResponse = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogId}?key=${apiKey}`
    );
    const blogData = await blogResponse.json();

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": getExcerpt(post.content),
      "image": thumbnail,
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
        thumbnail
      },
    };
  } catch (error) {
    console.error("Error fetching post:", error);
    return { notFound: true };
  }
};

const Post: React.FC<PostProps> = ({ post, host, path, structuredData, thumbnail }) => {
  if (!post || !host) {
    return <div>Error loading post</div>;
  }

  const canonicalUrl = `https://${host}/${path}`;
  const excerpt = getExcerpt(post.content);
  const publishedDate = new Date(post.published).toISOString();
  const modifiedDate = new Date(post.updated).toISOString();

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{post.title}</title>
        <meta name="description" content={excerpt} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph Tags */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content={host.split(".")[0]} />
        <meta property="og:image" content={thumbnail || ''} />
        <meta property="og:image:alt" content={post.title} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={excerpt} />
        <meta name="twitter:image" content={thumbnail || ''} />

        {/* Article Tags */}
        <meta property="article:published_time" content={publishedDate} />
        <meta property="article:modified_time" content={modifiedDate} />
        {post.labels?.map(label => (
          <meta key={label} property="article:tag" content={label} />
        ))}

        {/* Structured Data */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      
      <div className="post-container max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center text-gray-600">
            {post.author.image && (
              <img 
                src={post.author.image.url} 
                alt={post.author.displayName}
                className="w-10 h-10 rounded-full mr-3"
              />
            )}
            <span className="mr-4">By {post.author.displayName}</span>
            <time dateTime={publishedDate}>
              {new Date(post.published).toLocaleDateString()}
            </time>
          </div>
        </header>

        {thumbnail && (
          <div className="mb-8">
            <img
              src={thumbnail}
              alt={post.title}
              className="w-full h-auto rounded-lg"
              loading="eager"
              width="1200"
              height="630"
            />
          </div>
        )}
        
        <article 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />

        {post.labels && post.labels.length > 0 && (
          <div className="mt-8 pt-4 border-t border-gray-200">
            <h2 className="text-xl font-semibold mb-2">Labels</h2>
            <div className="flex flex-wrap gap-2">
              {post.labels.map((label) => (
                <span 
                  key={label}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Post;
