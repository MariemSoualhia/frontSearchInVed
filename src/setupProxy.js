const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/hls", // Le chemin vers votre serveur HLS
    createProxyMiddleware({
      target: "http://your_server/path/to/output/", // L'URL de votre serveur HLS
      changeOrigin: true,
    })
  );
};
