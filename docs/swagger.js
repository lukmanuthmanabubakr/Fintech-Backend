import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Fintech Backend API",
      version: "1.0.0",
      description: "Auth + Wallet + Transactions API",
    },
    servers: [{ url: "http://localhost:5000" }],
    security: [{ bearerAuth: [] }],

    // ADD THIS
    tags: [
      { name: "Auth", description: "User registration and login" },
      { name: "Wallets", description: "Wallet actions (credit, debit)" },
      { name: "Transactions", description: "User transaction history" },
      { name: "Dev", description: "Development-only endpoints" },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },

  apis: [
    "./src/modules/auth/**/*.routes.js",
    "./src/modules/wallets/**/*.routes.js",
    "./src/modules/payments/**/*.routes.js",
    "./src/modules/webhooks/**/*.routes.js",
    "./src/modules/transactions/**/*.routes.js",
  ],
});
