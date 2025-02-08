import Document, { Html, Head, Main, NextScript } from 'next/document';

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

          <script 
              src="https://richinfo.co/richpartners/pops/js/richads-pu-ob.js" 
                data-pubid="959538" 
                  data-siteid="357373" 
                    async data-cfasync="false">
          </script>
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
