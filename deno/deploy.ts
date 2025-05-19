// Deno Deploy script
// This script deploys your Deno API to Deno Deploy using the Deno Deploy API

import { parse } from "https://deno.land/std@0.220.1/flags/mod.ts";
import { serve } from "https://deno.land/std@0.220.1/http/server.ts";

// Parse command line arguments
const flags = parse(Deno.args, {
  string: ["project", "entrypoint", "token"],
  boolean: ["create"],
  default: {
    project: "fin-path-insight-api",
    entrypoint: "./main.ts",
    create: false
  },
  alias: {
    p: "project",
    e: "entrypoint",
    t: "token",
    c: "create"
  },
});

/**
 * Load environment variables from a file
 */
async function loadEnvFile(path: string): Promise<Record<string, string>> {
  const envVars: Record<string, string> = {};
  
  try {
    const text = await Deno.readTextFile(path);
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') continue;
      
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('='); // Handle values that might contain = signs
      
      if (key && value) {
        const trimmedKey = key.trim();
        const trimmedValue = value.trim();
        envVars[trimmedKey] = trimmedValue;
        
        // Also set in Deno.env for convenience
        try {
          Deno.env.set(trimmedKey, trimmedValue);
        } catch (e) {
          // Some environments don't allow setting env vars, ignore errors
        }
      }
    }
    console.log(`✅ Loaded environment variables from ${path}`);
  } catch (error) {
    console.error(`⚠️ Warning: Could not load ${path}: ${error.message}`);
  }
  
  return envVars;
}

/**
 * Deploy to Deno Deploy
 */
async function deployToDeno() {
  console.log("🚀 Deploying to Deno Deploy...");
  
  // Load environment variables from .env.deploy
  const envVars = await loadEnvFile("./.env.deploy");
  
  // Get token from command line args, env vars, or .env.deploy file
  let token = flags.token || Deno.env.get("DENO_DEPLOY_TOKEN") || envVars["DENO_DEPLOY_TOKEN"];
  
  if (!token) {
    console.error("❌ Error: DENO_DEPLOY_TOKEN is not set");
    console.log("Please set the token using one of these methods:");
    console.log("1. Add --token=your_token to the command line");
    console.log("2. Set DENO_DEPLOY_TOKEN environment variable");
    console.log("3. Add DENO_DEPLOY_TOKEN=your_token to .env.deploy file");
    Deno.exit(1);
  }

  const project = flags.project;
  const entrypoint = flags.entrypoint;
  
  console.log(`Deploying ${entrypoint} to project ${project}`);
  
  try {
    // Check if project exists
    const checkResponse = await fetch(`https://dash.deno.com/api/projects/${project}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // If project doesn't exist and create flag is set, create it
    if (checkResponse.status === 404) {
      if (flags.create) {
        console.log(`Project ${project} not found. Creating new project...`);
        
        const createResponse = await fetch(`https://dash.deno.com/api/projects`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: project,
            type: 'playground'
          })
        });
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error(`❌ Failed to create project: ${createResponse.status}`);
          console.error(errorText);
          Deno.exit(1);
        }
        
        console.log(`✅ Project ${project} created successfully!`);
      } else {
        console.error(`❌ Project ${project} not found. Use --create flag to create it.`);
        Deno.exit(1);
      }
    }
    
    // Deploy the project
    console.log(`Deploying to project ${project}...`);
    
    // First, let's create a simple server to handle the deployment
    // This is a workaround for direct API deployment issues
    const handler = async (req: Request): Promise<Response> => {
      return new Response("Hello from FinPath API!", {
        headers: { "content-type": "text/plain" },
      });
    };
    
    // Start the server
    console.log("Starting local server...");
    
    // Instead of using the API directly, use deployctl CLI if available
    try {
      const deployctl = new Deno.Command("deployctl", {
        args: [
          "deploy",
          "--project", project,
          "--prod",
          entrypoint
        ],
        env: {
          "DENO_DEPLOY_TOKEN": token
        },
        stdout: "piped",
        stderr: "piped"
      });
      
      // Execute the command and get output
      const process = deployctl.spawn();
      const status = await process.status;
      const stdout = await process.output();
      const stderr = await process.stderrOutput();
      
      if (stdout.length > 0) {
        console.log(new TextDecoder().decode(stdout));
      }
      
      if (stderr.length > 0) {
        console.error(new TextDecoder().decode(stderr));
      }
      
      console.log("✅ Deployment completed!");
      console.log(`🌐 Your API will be available at: https://${project}.deno.dev`);
    } catch (deployError) {
      console.error("Failed to use deployctl, falling back to manual deployment...");
      
      // Fallback to manual deployment
      const response = await fetch(`https://dash.deno.com/api/deployments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: project,
          entryPointUrl: entrypoint,
          productionDeploy: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("✅ Deployment initiated successfully!");
        console.log(JSON.stringify(result, null, 2));
        console.log(`🌐 Your API will be available at: https://${project}.deno.dev`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Deployment failed with status ${response.status}`);
        console.error(errorText);
        Deno.exit(1);
      }
    }
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    Deno.exit(1);
  }
}

// Run the deployment
await deployToDeno();
