// One-time promotion script — there is no API route that can grant admin,
// by design. Run manually on the server:
//   node scripts/make-admin.js someone@example.com
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const sequelize = require("../src/db");
const User = require("../src/models/user");

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/make-admin.js <email>");
    process.exit(1);
  }

  await sequelize.authenticate();
  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.error(`No account found for ${email}. Register it first, then re-run this script.`);
    process.exit(1);
  }

  user.isAdmin = true;
  await user.save();
  console.log(`${email} is now an admin.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
