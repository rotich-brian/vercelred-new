import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Favicon links */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="icon" href="/favicon-32x32.png" sizes="32x32" />
          <link rel="icon" href="/favicon-16x16.png" sizes="16x16" />

          {/* Google Analytics */}
          <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-GX8LVXESV4"
          ></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-GX8LVXESV4');
              `,
            }}
          />

          {/* Profitable CPM Rate Script */}
          <script
            async
            src="//pl25596196.profitablecpmrate.com/33/44/7b/33447b828b53f96077881ee158b6b1a8.js"
          ></script>

          {/* Effective Rate CPM Script - Itrend Social Bar */}
          {/* <script
            type="text/javascript"
            src="//pl19567778.effectiveratecpm.com/88/1f/cb/881fcb4c0fb57b122184be197c17ae56.js"
          ></script> */}

          {/* Effective Rate CPM Script - Itrend Popunder */}
          <script
            async
            src="//pl19643500.effectiveratecpm.com/22/5a/ee/225aee6de36429ed1b2ae90624cca61d.js"
          ></script>

          {/* Shebudriftaiter Script */}
          {/* <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(s, u, z, p) {
                  s.src = u;
                  s.setAttribute('data-zone', z);
                  p.appendChild(s);
                })(document.createElement('script'), 'https://shebudriftaiter.net/tag.min.js', 8916172, document.body || document.documentElement);
              `,
            }}
          /> */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
