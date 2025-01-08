import React from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";
import Image from "next/image";
import Link from "next/link";

// Define the BlogPost type similar to GraphQL schema
interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  link: string;
  dateGmt: string;
  modifiedGmt: string;
  author: {
    node: {
      name: string;
      image?: {
        url: string;
      }
    }
  };
  featuredImage: {
    node: {
      sourceUrl: string;
      altText: string;
    }
  };
}

interface PostProps {
  post: BlogPost;
  host: string;
  path: string;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  try {
    const apiKey = process.env.BLOGGER_API_KEY;
    const blogId = process.env.BLOGGER_BLOG_ID;
    
    if (!apiKey || !blogId) {
      throw new Error("Missing Blogger API configuration");
    }

    const pathArr = ctx.query.postpath as string[];
    if (!pathArr?.length) {
      return { notFound: true };
    }

    const path = pathArr.join("/");
    const referringURL = ctx.req.headers?.referer || null;
    const fbclid = ctx.query.fbclid;

    // Handle Facebook redirects similar to GraphQL example
    if (referringURL?.includes("facebook.com") || fbclid) {
      return {
        redirect: {
          permanent: false,
          destination: `https://www.blogger.com/blog/${blogId}/${encodeURI(path)}`,
        },
      };
    }

    // Fetch post data
    const response = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/bypath?path=${path}&key=${apiKey}`
    );

    if (!response.ok) {
      return { notFound: true };
    }

    const bloggerPost = await response.json();

    // Transform Blogger data to match GraphQL schema structure
    const post: BlogPost = {
      id: bloggerPost.id,
      title: bloggerPost.title,
      content: bloggerPost.content,
      excerpt: bloggerPost.content.substring(0, 160) + "...", // Create excerpt from content
      link: bloggerPost.url,
      dateGmt: bloggerPost.published,
      modifiedGmt: bloggerPost.updated,
      author: {
        node: {
          name: bloggerPost.author.displayName,
          image: bloggerPost.author.image ? {
            url: bloggerPost.author.image.url
          } : undefined
        }
      },
      featuredImage: {
        node: {
          sourceUrl: extractFirstImage(bloggerPost.content) || '/default-image.jpg',
          altText: bloggerPost.title
        }
      }
    };

    return {
      props: {
        post,
        host: ctx.req.headers.host || "",
        path,
      },
    };
  } catch (error) {
    console.error("Error fetching post:", error);
    return { notFound: true };
  }
};

// Helper function to extract first image from content
const extractFirstImage = (content: string): string | null => {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const match = content.match(imgRegex);
  return match ? match[1] : null;
};

// Helper function to remove HTML tags from excerpt
const removeTags = (str: string) => {
  if (!str) return "";
  return str.replace(/(<([^>]+)>)/gi, "").replace(/\[[^\]]*\]/, "");
};

const Post: React.FC<PostProps> = ({ post, host, path }) => {
  if (!post || !host) {
    return <div>Error loading post</div>;
  }

  const canonicalUrl = `https://${host}/${path}`;

  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta property="og:title" content={post.title} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:description" content={removeTags(post.excerpt)} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content={host.split(".")[0]} />
        <meta property="article:published_time" content={post.dateGmt} />
        <meta property="article:modified_time" content={post.modifiedGmt} />
        <meta property="og:image" content={post.featuredImage.node.sourceUrl} />
        <meta
          property="og:image:alt"
          content={post.featuredImage.node.altText}
        />
      </Head>

      <div className="post-container">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        
        <div className="mb-8">
          <Image
            src={post.featuredImage.node.sourceUrl}
            alt={post.featuredImage.node.altText}
            width={1200}
            height={630}
            className="rounded-lg"
          />
        </div>

        <div className="flex items-center gap-4 mb-8 text-gray-600">
          {post.author.node.image && (
            <Image
              src={post.author.node.image.url}
              alt={post.author.node.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          )}
          <span>{post.author.node.name}</span>
          <span>•</span>
          <time dateTime={post.dateGmt}>
            {new Date(post.dateGmt).toLocaleDateString()}
          </time>
        </div>

        <article
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </>
  );
};

export default Post;
