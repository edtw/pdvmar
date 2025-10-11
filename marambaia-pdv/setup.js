// setup.js - MongoDB Setup Script for Marambaia PDV
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Get platform-specific information
const isWindows = os.platform() === "win32";
const isLinux = os.platform() === "linux";
const isMac = os.platform() === "darwin";

// MongoDB connection string
let mongoUri = "mongodb://localhost:27017/marambaia_pdv";

console.log("==========================================================");
console.log("     🌊 Marambaia Beach PDV - Setup Script 🌊");
console.log("==========================================================");
console.log(
  `Platform detected: ${
    isWindows ? "Windows" : isLinux ? "Linux" : isMac ? "macOS" : "Unknown"
  }`
);
console.log("\n");

// Main setup function
async function setup() {
  try {
    // 1. Check MongoDB installation
    await checkMongoDB();

    // 2. Configure connection string and environment
    await configureEnvironment();

    // 3. Seed the database
    await seedDatabase();

    console.log("\n✅ Setup completed successfully!");
    console.log(
      'You can now start the application with "npm run dev" in both server and client directories.'
    );

    rl.close();
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    rl.close();
    process.exit(1);
  }
}

// Check MongoDB installation
async function checkMongoDB() {
  console.log("🔍 Checking MongoDB installation...");

  try {
    if (isWindows) {
      // Check if MongoDB is installed on Windows
      try {
        execSync("mongod --version", { stdio: "ignore" });
        console.log("✅ MongoDB is installed.");
      } catch (error) {
        console.log("❌ MongoDB is not installed or not in PATH.");
        console.log("\nPlease install MongoDB using one of these methods:");
        console.log(
          "1. Download and install MongoDB Community Server: https://www.mongodb.com/try/download/community"
        );
        console.log(
          "2. Use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas/register"
        );

        const answer = await askQuestion(
          "Would you like to use MongoDB Atlas instead of local installation? (y/n): "
        );
        if (answer.toLowerCase() === "y") {
          const uri = await askQuestion(
            "Please enter your MongoDB Atlas connection string: "
          );
          mongoUri = uri;
          return;
        } else {
          throw new Error("Please install MongoDB and run this script again.");
        }
      }

      // Check if MongoDB service is running on Windows
      try {
        execSync("sc query MongoDB", { stdio: "ignore" });
        console.log("✅ MongoDB service is running.");
      } catch (error) {
        console.log("⚠️ MongoDB service is not running.");
        console.log("Starting MongoDB service...");
        try {
          execSync("net start MongoDB", { stdio: "pipe" });
          console.log("✅ MongoDB service started successfully.");
        } catch (svcError) {
          console.log("❌ Failed to start MongoDB service.");
          console.log(
            'Please start it manually from Services or run "net start MongoDB" as administrator.'
          );

          const answer = await askQuestion(
            "Would you like to use MongoDB Atlas instead? (y/n): "
          );
          if (answer.toLowerCase() === "y") {
            const uri = await askQuestion(
              "Please enter your MongoDB Atlas connection string: "
            );
            mongoUri = uri;
            return;
          } else {
            throw new Error(
              "Please start MongoDB service and run this script again."
            );
          }
        }
      }
    } else if (isLinux || isMac) {
      // Check if MongoDB is installed on Linux/macOS
      try {
        execSync("mongod --version", { stdio: "ignore" });
        console.log("✅ MongoDB is installed.");
      } catch (error) {
        console.log("❌ MongoDB is not installed.");
        console.log("\nFor Ubuntu/Debian, you can install it with:");
        console.log("sudo apt-get update && sudo apt-get install -y mongodb");
        console.log("\nFor macOS with Homebrew:");
        console.log("brew tap mongodb/brew && brew install mongodb-community");

        const answer = await askQuestion(
          "Would you like to use MongoDB Atlas instead? (y/n): "
        );
        if (answer.toLowerCase() === "y") {
          const uri = await askQuestion(
            "Please enter your MongoDB Atlas connection string: "
          );
          mongoUri = uri;
          return;
        } else {
          throw new Error("Please install MongoDB and run this script again.");
        }
      }

      // Check if MongoDB service is running on Linux/macOS
      try {
        if (isLinux) {
          execSync("systemctl status mongodb || systemctl status mongod", {
            stdio: "ignore",
          });
        } else if (isMac) {
          execSync("brew services list | grep mongodb-community", {
            stdio: "ignore",
          });
        }
        console.log("✅ MongoDB service is running.");
      } catch (error) {
        console.log("⚠️ MongoDB service is not running.");
        console.log("Starting MongoDB service...");
        try {
          if (isLinux) {
            execSync(
              "sudo systemctl start mongodb || sudo systemctl start mongod",
              { stdio: "pipe" }
            );
          } else if (isMac) {
            execSync("brew services start mongodb-community", {
              stdio: "pipe",
            });
          }
          console.log("✅ MongoDB service started successfully.");
        } catch (svcError) {
          console.log("❌ Failed to start MongoDB service.");
          console.log("Please start it manually with:");
          if (isLinux) {
            console.log(
              "sudo systemctl start mongodb   OR   sudo systemctl start mongod"
            );
          } else if (isMac) {
            console.log("brew services start mongodb-community");
          }

          const answer = await askQuestion(
            "Would you like to use MongoDB Atlas instead? (y/n): "
          );
          if (answer.toLowerCase() === "y") {
            const uri = await askQuestion(
              "Please enter your MongoDB Atlas connection string: "
            );
            mongoUri = uri;
            return;
          } else {
            throw new Error(
              "Please start MongoDB service and run this script again."
            );
          }
        }
      }
    }

    // Verify MongoDB connection
    console.log("Testing MongoDB connection...");
    try {
      execSync(`mongosh --eval "db.adminCommand({ ping: 1 })"`, {
        stdio: "ignore",
      });
      console.log("✅ MongoDB connection successful.");
    } catch (error) {
      console.log("❌ Could not connect to MongoDB.");

      const answer = await askQuestion(
        "Would you like to use MongoDB Atlas instead? (y/n): "
      );
      if (answer.toLowerCase() === "y") {
        const uri = await askQuestion(
          "Please enter your MongoDB Atlas connection string: "
        );
        mongoUri = uri;
      } else {
        throw new Error(
          "Please ensure MongoDB is properly installed and running."
        );
      }
    }
  } catch (error) {
    throw error;
  }
}

// Configure environment variables
async function configureEnvironment() {
  console.log("\n🔧 Configuring environment...");

  // Create .env file in server directory
  const envPath = path.join(__dirname, ".env");
  const envContent = `
NODE_ENV=development
PORT=3001
MONGODB_URI=${mongoUri}
JWT_SECRET=marambaia_beach_pdv_secret_key
JWT_EXPIRES_IN=12h
FRONTEND_URL=http://localhost:3000
  `.trim();

  fs.writeFileSync(envPath, envContent);
  console.log("✅ Created .env file in server directory.");

  // Create .env file in client directory if needed
  const clientEnvPath = path.join(__dirname, "..", "client", ".env");
  const clientDirExists = fs.existsSync(path.join(__dirname, "..", "client"));

  if (clientDirExists) {
    const clientEnvContent = `
APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
    `.trim();

    fs.writeFileSync(clientEnvPath, clientEnvContent);
    console.log("✅ Created .env file in client directory.");
  }

  console.log("✅ Environment configuration completed.");
}

// Seed the database with initial data
async function seedDatabase() {
  console.log("\n🌱 Seeding database with initial data...");

  try {
    execSync("node utils/seed.js", { stdio: "inherit" });
    console.log("✅ Database seeded successfully.");
  } catch (error) {
    console.error("❌ Failed to seed database:", error.message);
    throw new Error(
      "Database seeding failed. Please check MongoDB connection and try again."
    );
  }
}

// Helper function to prompt user for input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Start the setup process
setup();
