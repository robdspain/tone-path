import { NextPageContext } from 'next';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';

interface ErrorProps {
  statusCode: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

function Error({ statusCode }: ErrorProps) {
  return (
    <>
      <Head>
        <title>{statusCode ? `${statusCode} - Error` : 'Error'}</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl"
        >
          <h1 className="text-6xl font-bold mb-4 gradient-text">
            {statusCode || 'Error'}
          </h1>
          <h2 className="text-3xl font-semibold mb-4">
            {statusCode === 404
              ? 'Page Not Found'
              : statusCode === 500
              ? 'Server Error'
              : 'Something went wrong'}
          </h2>
          <p className="text-gray-400 mb-8">
            {statusCode === 404
              ? "The page you're looking for doesn't exist or has been moved."
              : statusCode === 500
              ? 'An error occurred on the server. Please try again later.'
              : 'An unexpected error occurred. Please try again.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-semibold shadow-glow-primary"
              >
                Go Back Home
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
            >
              Reload Page
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err as any).statusCode : 404;
  return { statusCode };
};

Error.displayName = 'ErrorPage';

export default Error;

