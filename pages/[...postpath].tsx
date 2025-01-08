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
  thumbnail: string | null;
  debug?: any; // Added for debugging
}

const generateSlug = (title: string): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  console.log("Generated slug:", { originalTitle: title, slug });
  return slug;
};

const extractSlugFromUrl = (url: string): string => {
  const urlParts = url.split('/');
  const lastPart = urlParts[urlParts.length - 1];
  const slug = generateSlug(lastPart.replace('.html', ''));
  console.log("Extracted slug from URL:", { originalUrl: url, urlParts, lastPart, slug });
  return slug;
};

const getExcerpt = (content: string): string => {
  const strippedContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const excerpt = strippedContent.length > 160 
    ? `${strippedContent.substring(0, 157)}...` 
    : strippedContent;
  console.log("Generated excerpt length:", excerpt.length);
  return excerpt;
};

const extractFirstImage = (content: string): string | null => {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const match = content.match(imgRegex);
  const imageUrl = match ? match[1] : null;
  console.log("Extracted first image:", { found: !!imageUrl });
  return imageUrl;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const debugInfo: any = {};
  
  try {
    const apiKey = process.env.BLOGGER_API_KEY;
    const blogId = process.env.BLOGGER_BLOG_ID;
    const defaultOgImage = process.env.DEFAULT_OG_IMAGE || 'https://your-default-image.jpg';

    debugInfo.environmentCheck = {
      hasApiKey: !!apiKey,
      hasBlogId: !!blogId,
      hasDefaultOgImage: !!defaultOgImage
    };

    console.log("Environment check:", debugInfo.environmentCheck);

    if (!apiKey || !blogId) {
      throw new Error("Missing Blogger API configuration");
    }

    const pathArr = ctx.query.postpath as string[];
    debugInfo.requestPath = pathArr;
    console.log("Requested path:", pathArr);

    if (!pathArr || pathArr.length === 0) {
      console.log("No path provided");
      return { notFound: true };
    }

    const requestedSlug = pathArr[0];
    debugInfo.requestedSlug = requestedSlug;
    console.log("Processing requested slug:", requestedSlug);

    const searchUrl = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?key=${apiKey}`;
    debugInfo.searchUrl = searchUrl.replace(apiKey, '[REDACTED]');
    
    console.log("Fetching posts from Blogger API...");
    const searchResponse = await fetch(searchUrl);
    debugInfo.searchResponseStatus = searchResponse.status;
    console.log("Search response status:", searchResponse.status);

    if (!searchResponse.ok) {
      console.error("Failed to fetch posts:", searchResponse.status);
      return { notFound: true };
    }

    const searchData = await searchResponse.json();
    debugInfo.totalPosts = searchData.items?.length || 0;
    console.log("Total posts found:", debugInfo.totalPosts);

    // Log all post URLs and their slugs for debugging
    const allSlugs = searchData.items.map((post: BloggerPost) => ({
      url: post.url,
      slug: extractSlugFromUrl(post.url)
    }));
    console.log("All available slugs:", allSlugs);
    
    const matchingPost = searchData.items.find((post: BloggerPost) => {
      const postSlug = extractSlugFromUrl(post.url);
      console.log("Comparing slugs:", { postSlug, requestedSlug, matches: postSlug === requestedSlug });
      return postSlug === requestedSlug;
    });

    debugInfo.foundMatchingPost = !!matchingPost;
    console.log("Matching post found:", debugInfo.foundMatchingPost);

    if (!matchingPost) {
      console.log("No matching post found for slug:", requestedSlug);
      return { notFound: true };
    }

    if (pathArr.length > 1) {
      console.log("Redirecting to canonical URL");
      return {
        redirect: {
          destination: `/${requestedSlug}`,
          permanent: true,
        },
      };
    }

    const postUrl = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/${matchingPost.id}?key=${apiKey}`;
    debugInfo.postUrl = postUrl.replace(apiKey, '[REDACTED]');
    
    console.log("Fetching individual post data...");
    const postResponse = await fetch(postUrl);
    debugInfo.postResponseStatus = postResponse.status;
    console.log("Post response status:", postResponse.status);

    if (!postResponse.ok) {
      console.error("Failed to fetch post details:", postResponse.status);
      return { notFound: true };
    }

    const post: BloggerPost = await postResponse.json();
    const thumbnail = extractFirstImage(post.content) || defaultOgImage;

    const blogUrl = `https://www.googleapis.com/blogger/v3/blogs/${blogId}?key=${apiKey}`;
    const blogResponse = await fetch(blogUrl);
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

    console.log("Successfully prepared post data");
    return {
      props: {
        post,
        host: ctx.req.headers.host || "",
        path: requestedSlug,
        structuredData,
        thumbnail,
        debug: debugInfo // Include debug info in props
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    debugInfo.error = {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    };
    return { 
      notFound: true,
      props: {
        debug: debugInfo // Include debug info even in error case
      }
    };
  }
};

const Post: React.FC<PostProps> = ({ post, host, path, structuredData, thumbnail, debug }) => {
  // Log debug info on client side
  React.useEffect(() => {
    if (debug) {
      console.log("Page Debug Info:", debug);
    }
  }, [debug]);

  if (!post || !host) {
    console.error("Missing required props:", { hasPost: !!post, hasHost: !!host });
    return <div>Error loading post</div>;
  }

  const canonicalUrl = `https://${host}/${path}`;
  const excerpt = getExcerpt(post.content);
  const publishedDate = new Date(post.published).toISOString();
  const modifiedDate = new Date(post.updated).toISOString();

  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta name="description" content={excerpt} />
        <link rel="canonical" href={canonicalUrl} />

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

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={excerpt} />
        <meta name="twitter:image" content={thumbnail || ''} />

        <meta property="article:published_time" content={publishedDate} />
        <meta property="article:modified_time" content={modifiedDate} />
        {post.labels?.map(label => (
          <meta key={label} property="article:tag" content={label} />
        ))}

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
              <div className="relative w-10 h-10 mr-3">
                <Image 
                  src={post.author.image.url} 
                  alt={post.author.displayName}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </div>
            )}
            <span className="mr-4">By {post.author.displayName}</span>
            <time dateTime={publishedDate}>
              {new Date(post.published).toLocaleDateString()}
            </time>
          </div>
        </header>

        {thumbnail && (
          <Link href={post.url}>
            <a target="_blank" rel="noopener noreferrer" className="block mb-8">
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <Image
                  src={thumbnail}
                  alt={post.title}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                  priority
                />
              </div>
            </a>
          </Link>
        )}

        <article 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="flex justify-center mt-8">
          <Link href={post.url}>
            <a 
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read Full Post
            </a>
          </Link>
        </div>
        
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
        
        {/* Debug information in development */}
        {process.env.NODE_ENV === 'development' && debug && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Debug Information</h2>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(debug, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </>
  );
};

export default Post;
