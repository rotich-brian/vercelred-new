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

interface BloggerImage {
  url: string;
}

interface BloggerPost {
  id: string;
  title: string;
  content: string;
  published: string;
  updated: string;
  url: string;
  author: BloggerAuthor;
  images?: BloggerImage[];
  labels?: string[];
}

interface PostProps {
  post: BloggerPost;
  host: string;
  path: string;
}

const getExcerpt = (content: string): string => {
  const firstParagraph = content.split('</p>')[0].replace(/<\/?[^>]+(>|$)/g, "");
  return firstParagraph.length > 160 
    ? `${firstParagraph.substring(0, 157)}...` 
    : firstParagraph;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  try {
    const apiKey = process.env.BLOGGER_API_KEY;
    const blogId = process.env.BLOGGER_BLOG_ID;

    if (!apiKey || !blogId) {
      throw new Error("Missing Blogger API configuration");
    }

    // Get the path from the URL
    const pathArr = ctx.query.postpath as string[];
    if (!pathArr || pathArr.length === 0) {
      return { notFound: true };
    }

    const path = pathArr.join('/');

    // Check for Facebook referrer
    const referringURL = ctx.req.headers?.referer || null;
    const fbclid = ctx.query.fbclid;
    
    if (referringURL?.includes("facebook.com") || fbclid) {
      return {
        redirect: {
          permanent: false,
          destination: `https://www.blogger.com/${path}`,
        },
      };
    }

    // First, fetch the list of posts to find the matching URL path
    const searchResponse = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?key=${apiKey}`
    );

    if (!searchResponse.ok) {
      console.error(`Blogger API error: ${searchResponse.status}`);
      return { notFound: true };
    }

    const searchData = await searchResponse.json();
    const matchingPost = searchData.items.find((post: BloggerPost) => {
      // Extract the path from the Blogger post URL
      const bloggerUrl = new URL(post.url);
      const bloggerPath = bloggerUrl.pathname.split('/').pop();
      return bloggerPath === path;
    });

    if (!matchingPost) {
      return { notFound: true };
    }

    // Fetch the full post data
    const postResponse = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/${matchingPost.id}?key=${apiKey}`
    );

    if (!postResponse.ok) {
      console.error(`Blogger API error: ${postResponse.status}`);
      return { notFound: true };
    }

    const post: BloggerPost = await postResponse.json();

    return {
      props: {
        path,
        post,
        host: ctx.req.headers.host || "",
      },
    };
  } catch (error) {
    console.error("Error fetching post:", error);
    return { notFound: true };
  }
};

const Post: React.FC<PostProps> = ({ post, host, path }) => {
  if (!post || !host) {
    return <div>Error loading post</div>;
  }

  const canonicalUrl = `https://${host}/${path}`;
  const featuredImage = post.images?.[0]?.url;
  const excerpt = getExcerpt(post.content);

  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta property="og:title" content={post.title} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content={host.split(".")[0]} />
        <meta property="article:published_time" content={post.published} />
        <meta property="article:modified_time" content={post.updated} />
        {featuredImage && (
          <>
            <meta property="og:image" content={featuredImage} />
            <meta property="og:image:alt" content={post.title} />
          </>
        )}
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
            <time dateTime={post.published}>
              {new Date(post.published).toLocaleDateString()}
            </time>
          </div>
        </header>

        {featuredImage && (
          <img
            src={featuredImage}
            alt={post.title}
            className="w-full h-auto rounded-lg mb-8"
            loading="eager"
          />
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
