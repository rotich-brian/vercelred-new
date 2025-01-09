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
  isSocialMediaCrawler: boolean;
  socialPlatform: 'facebook' | 'twitter' | null;
}

const Post: React.FC<PostProps> = ({ 
  post, 
  host, 
  path, 
  structuredData, 
  thumbnail,
  isSocialMediaCrawler,
  socialPlatform 
}) => {
  if (!post || !host) {
    return <div>Error loading post</div>;
  }

  const canonicalUrl = `https://${host}/${path}`;
  const excerpt = getExcerpt(post.content);
  const publishedDate = new Date(post.published).toISOString();
  const modifiedDate = new Date(post.updated).toISOString();

  const sanitizedContent = removeVideoContainers(post.content);

  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta name="description" content={excerpt} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.title} />
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
        <meta name="twitter:description" content={post.title} />
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

        <style>
          {`
            .thumbnail-container {
              position: relative;
              cursor: pointer;
              overflow: hidden;
              border-radius: 0.5rem;
            }

            .play-button-overlay {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 80px;
              height: 80px;
              background-color: rgba(0, 0, 0, 0.7);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s ease;
            }

            .play-button-overlay::before {
              content: '';
              width: 0;
              height: 0;
              border-top: 20px solid transparent;
              border-bottom: 20px solid transparent;
              border-left: 30px solid white;
              margin-left: 7px;
            }

            .thumbnail-container:hover .play-button-overlay {
              background-color: rgba(0, 0, 0, 0.9);
              transform: translate(-50%, -50%) scale(1.1);
            }

            .thumbnail-container::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.2);
              opacity: 0;
              transition: opacity 0.3s ease;
            }

            .thumbnail-container:hover::after {
              opacity: 1;
            }
          `}
        </style>
      </Head>
      
      <div className="post-container max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center text-gray-600">
            <span className="mr-4">By {post.author.displayName}</span>
            <time dateTime={publishedDate}>
              {new Date(post.published).toLocaleDateString()}
            </time>
          </div>
        </header>

        {thumbnail && (
          <div className="mb-8">
            <div 
              className="thumbnail-container"
              onClick={() => window.location.href = post.url}
            >
              <img
                src={thumbnail}
                alt={post.title}
                className="w-full h-auto"
                loading="eager"
                width="1200"
                height="630"
              />
              <div className="play-button-overlay" />
            </div>
          </div>
        )}
        
        <article 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
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

const getExcerpt = (content: string): string => {
  const strippedContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return strippedContent.length > 160 
    ? `${strippedContent.substring(0, 157)}...` 
    : strippedContent;
};

const removeVideoContainers = (html: string): string => {
  return html
    .replace(/<div class="video-container-custom11">[\s\S]*?<\/div>/gi, '')
    .replace(/<div class="button-container">[\s\S]*?<\/div>/gi, '')
    .replace(/<script>[\s\S]*?function changeStream[\s\S]*?<\/script>/gi, '');
};

export default Post;
