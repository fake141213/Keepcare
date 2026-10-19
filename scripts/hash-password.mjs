
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

try {
  const password = await rl.question("Enter admin password: ");

  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exitCode = 1;
  } else {
    const hash = await bcrypt.hash(password, 12);
    console.log("\nADMIN_PASSWORD_HASH=");
    console.log(hash);
  }
} finally {
  rl.close();
}
