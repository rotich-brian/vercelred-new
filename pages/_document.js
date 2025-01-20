import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* Add the favicon link */}
          <link rel="icon" href="/favicon.ico" />
          {/* You can also add other icon sizes for various devices */}
          <link rel="icon" href="/favicon-32x32.png" sizes="32x32" />
          <link rel="icon" href="/favicon-16x16.png" sizes="16x16" />
        </Head>
        <body>
          <Main />
          <NextScript />

          <script type='text/javascript' src='//pl25596196.profitablecpmrate.com/33/44/7b/33447b828b53f96077881ee158b6b1a8.js'></script>
        </body>
      </Html>
    );
  }
}

export default MyDocument;

