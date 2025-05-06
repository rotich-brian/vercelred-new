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

          {/* Shebudriftaiter Script */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(s, u, z, p) {
                  s.src = u;
                  s.setAttribute('data-zone', z);
                  p.appendChild(s);
                })(document.createElement('script'), 'https://shebudriftaiter.net/tag.min.js', 8916172, document.body || document.documentElement);
              `,
            }}
          />
          {/* Shebudriftaiter Hell */}
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
