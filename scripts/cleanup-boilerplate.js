#!/usr/bin/env node

import { writeFileSync, unlinkSync, existsSync } from "fs";
import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

const filesToDelete = [
  "apps/website/src/counter.ts",
  "apps/website/public/favicon.png",
  "apps/website/src/assets/debrain-logo.png",
  "apps/website/src/assets/trama.gif",
];

const cleanAppVue = `<script setup lang="ts">
import { ref } from "vue";

// Your app starts here
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Your UI goes here -->
    <h1 class="text-2xl font-bold p-8">Ready to build something great.</h1>
  </div>
</template>
`;

console.log("\n⚠️  CLEANUP BOILERPLATE — Destructive Operation\n");
console.log("This will delete the following files:");
filesToDelete.forEach((file) => console.log(`  - ${file}`));
console.log("  - apps/website/src/App.vue (will be replaced with blank template)\n");

const answer = await question("Are you sure you want to continue? (yes/no): ");

if (answer.toLowerCase() !== "yes") {
  console.log("\n❌ Cleanup cancelled.\n");
  rl.close();
  process.exit(0);
}

console.log("\n🧹 Cleaning up boilerplate...\n");

// Delete files
for (const file of filesToDelete) {
  try {
    if (existsSync(file)) {
      unlinkSync(file);
      console.log(`✓ Deleted ${file}`);
    } else {
      console.log(`⊘ Skipped ${file} (not found)`);
    }
  } catch (error) {
    console.error(`✗ Error deleting ${file}:`, error.message);
  }
}

// Replace App.vue
try {
  writeFileSync("apps/website/src/App.vue", cleanAppVue, "utf-8");
  console.log("✓ Created clean apps/website/src/App.vue");
} catch (error) {
  console.error("✗ Error creating App.vue:", error.message);
}

console.log("\n✨ Cleanup complete! Ready to build.\n");
rl.close();
