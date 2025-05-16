// Deno Deploy script
// This script helps deploy your Deno API to Deno Deploy

// @deno-types="https://deno.land/std@0.220.1/io/read_lines.ts"
import { readLines } from "https://deno.land/std@0.220.1/io/read_lines.ts";
// @deno-types="https://deno.land/std@0.220.1/flags/mod.ts"
import { parse } from "https://deno.land/std@0.220.1/flags/mod.ts";

// For TypeScript in non-Deno environments
declare global {
  interface Window {
    Deno?: {
      env: {
        get(key: string): string | undefined;
      };
      args: string[];
      exit(code: number): never;
      Command: any;
    };
  }
  var process: {
    exit(code: number): never;
  };
}

// Use window.Deno for TypeScript compatibility
const Deno = window.Deno;

const flags = parse(Deno?.args || [], {
  string: ["project", "entrypoint"],
  default: {
    project: "finpath-api",
    entrypoint: "./main.ts",
  },
});

async function deployToDeno() {
  console.log("🚀 Deploying to Deno Deploy...");
  
  // Check for DENO_DEPLOY_TOKEN
  const token = Deno?.env.get("DENO_DEPLOY_TOKEN");
  if (!token) {
    console.error("❌ Error: DENO_DEPLOY_TOKEN environment variable is not set.");
    console.log("Please set the token in your .env.deploy file or as an environment variable.");
    Deno?.exit(1);
    // For non-Deno environments
    process.exit(1);
  }

  // Build the deployment command
  if (!Deno?.Command) {
    console.error("❌ Error: This script must be run in a Deno environment.");
    console.log("Please run this script using 'deno run -A deploy.ts'");
    process.exit(1);
    return;
  }
  
  const deployCmd = new Deno.Command("deployctl", {
    args: [
      "deploy",
      "--project", flags.project,
      "--prod",
      flags.entrypoint,
    ],
    env: {
      "DENO_DEPLOY_TOKEN": token,
    },
    stdout: "piped",
    stderr: "piped",
  });

  const process = deployCmd.spawn();
  const status = await process.status;

  // Read and display output
  const output = await process.output();
  const error = await process.stderrOutput();
  
  if (new TextDecoder().decode(output)) {
    console.log(new TextDecoder().decode(output));
  }
  
  if (new TextDecoder().decode(error)) {
    console.error(new TextDecoder().decode(error));
  }

  if (!status.success) {
    console.error("❌ Deployment failed");
    Deno?.exit(1);
    // For non-Deno environments
    process.exit(1);
  }

  console.log("✅ Deployment successful!");
  console.log(`🌐 Your API is now available at: https://${flags.project}.deno.dev`);
}

// Run the deployment
await deployToDeno();
