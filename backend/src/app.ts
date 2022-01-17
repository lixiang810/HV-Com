import express from 'express';
import path from 'path';
import { createServer } from 'vite';
import apiRouter from './apiRouter';
import errorHandler from './middlewares/errorHandler';
import requestLogger from './middlewares/requestLogger';
import storageProvider from './storageProvider';
import argv from './utils/argv';

const root = path.resolve(`${__dirname}/../../`);
const app = express();

(async () => {
  // test script will init the provider.
  if (!argv.test) await storageProvider.init();
  if (argv.dev) {
    const viteDevServer = await createServer({
      root: path.join(root, 'frontend'),
      server: { middlewareMode: 'html' },
    });
    app.use(viteDevServer.middlewares);
  } else {
    app.use(express.static(path.join(root, 'frontend', 'dist')));
  }
})();

app.use(express.json());
app.use(requestLogger);
app.use('/api', apiRouter);
app.use(errorHandler);

export default app;
