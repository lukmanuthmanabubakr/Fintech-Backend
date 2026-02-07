import "dotenv/config";
import app from "./app.js";
import { ensureClearingWallet } from "./modules/wallets/wallet.init.js";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await ensureClearingWallet();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
}

bootstrap();
