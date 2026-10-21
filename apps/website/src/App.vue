<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  Zap,
  Monitor,
  Palette,
  ShieldCheck,
  Server,
  Database,
  Container,
  MessageSquareText,
  FolderOpen,
} from "lucide-vue-next";
import debrainLogo from "./assets/debrain-logo.png";
import trama from "./assets/trama.gif";

const visible = ref(false);
onMounted(() => requestAnimationFrame(() => (visible.value = true)));

const prompts = [
  {
    label: "Create a page",
    example: '"Create a page called Services with a title and a list of cards"',
  },
  {
    label: "Add a form",
    example: '"Add a contact form with name, email, and message that saves to the database"',
  },
  {
    label: "Add login",
    example: '"Add login and signup with email and password"',
  },
  {
    label: "Add a data table",
    example: '"Add a clients table with name, email, phone, and creation date"',
  },
];

const stack = [
  {
    icon: Zap,
    name: "Node.js 24+",
    role: "Runtime",
    note: "The engine that runs your backend. Fast, modern, and industry-standard.",
  },
  {
    icon: Monitor,
    name: "Vue 3",
    role: "Frontend",
    note: "Builds the pages your users see. Reactive, component-based, beginner-friendly.",
  },
  {
    icon: Palette,
    name: "Tailwind CSS v4",
    role: "Styles",
    note: "Handles all the visual design — colors, layout, spacing — with utility classes.",
  },
  {
    icon: ShieldCheck,
    name: "better-auth",
    role: "Authentication",
    note: "Login, signup, and sessions out of the box. Just tell the agent to add auth.",
  },
  {
    icon: Server,
    name: "Express 5",
    role: "Backend",
    note: "The server that handles API requests and business logic.",
  },
  {
    icon: Database,
    name: "SQLite + Drizzle",
    role: "Database",
    note: "A file-based database — no setup required. Drizzle handles queries safely.",
  },
  {
    icon: Container,
    name: "Docker",
    role: "Deploy",
    note: "Packages everything into a single container. One command to ship to production.",
  },
];

const tips = [
  {
    icon: MessageSquareText,
    tip: "Be specific with the agent",
    detail:
      'Instead of "add a contact form", say "add a contact form with name, email, and message fields that saves to the database".',
  },
  {
    icon: FolderOpen,
    tip: "Drop files into inbox/",
    detail:
      "Put logos, images, PDFs, or any asset into the inbox/ folder. The agent will pick them up when you ask it to use them.",
  },
];
</script>

<template>
  <div class="relative min-h-screen bg-white text-neutral-800 antialiased overflow-hidden">
    <!-- Plants decoration bottom-left -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 520"
      fill="none"
      class="pointer-events-none select-none fixed bottom-0 left-0 w-72 opacity-[0.35]"
      aria-hidden="true"
    >
      <!-- Ground cluster: small leaves at base -->
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 55 520; 2.5 55 520; 0 55 520; -1.5 55 520; 0 55 520"
          keyTimes="0;0.25;0.5;0.75;1"
          dur="5s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1"
        />
        <path d="M55 520 C48 506 30 494 14 478 C30 474 48 486 55 520Z" fill="#d1d5db" />
        <path
          d="M55 520 C36 498 14 478"
          stroke="#9ca3af"
          stroke-width="0.8"
          stroke-linecap="round"
        />
        <path d="M55 520 C62 506 80 493 96 478 C80 474 62 486 55 520Z" fill="#d1d5db" />
        <path
          d="M55 520 C74 497 96 478"
          stroke="#9ca3af"
          stroke-width="0.8"
          stroke-linecap="round"
        />
        <path d="M52 514 C44 498 36 485 25 472 C36 469 50 480 52 514Z" fill="#d4d8dc" />
      </g>

      <!-- Tall plant, left -->
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-1 70 520; 1.4 70 520; -1 70 520"
          dur="9s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
        />
        <path
          d="M70 520 C67 445 76 370 64 295 C52 218 68 155 58 80"
          stroke="#b8bec6"
          stroke-width="1.8"
          stroke-linecap="round"
        />
        <!-- leaf pairs along stem -->
        <path d="M68 470 C50 454 28 440 18 420 C40 418 62 434 68 470Z" fill="#d1d5db" />
        <path
          d="M68 470 C40 442 18 420"
          stroke="#9ca3af"
          stroke-width="0.7"
          stroke-linecap="round"
        />
        <path d="M66 405 C85 390 106 375 112 354 C90 352 68 368 66 405Z" fill="#d1d5db" />
        <path
          d="M66 405 C90 375 112 354"
          stroke="#9ca3af"
          stroke-width="0.7"
          stroke-linecap="round"
        />
        <path d="M64 338 C44 322 22 305 14 283 C36 281 58 298 64 338Z" fill="#d1d5db" />
        <path
          d="M64 338 C36 308 14 283"
          stroke="#9ca3af"
          stroke-width="0.7"
          stroke-linecap="round"
        />
        <path d="M62 272 C80 255 100 237 106 214 C84 212 63 230 62 272Z" fill="#d1d5db" />
        <path
          d="M62 272 C84 237 106 214"
          stroke="#9ca3af"
          stroke-width="0.7"
          stroke-linecap="round"
        />
        <path d="M60 208 C40 190 18 170 10 148 C32 146 56 166 60 208Z" fill="#d1d5db" />
        <path
          d="M60 208 C32 170 10 148"
          stroke="#9ca3af"
          stroke-width="0.7"
          stroke-linecap="round"
        />
        <path d="M58 144 C72 124 76 100 58 78 C52 100 52 124 58 144Z" fill="#d1d5db" />
      </g>

      <!-- Medium plant, right of tall -->
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0.8 155 520; -1.6 155 520; 0.8 155 520"
          dur="7s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
        />
        <path
          d="M155 520 C152 458 160 396 148 334 C136 272 152 218 142 165"
          stroke="#b8bec6"
          stroke-width="1.6"
          stroke-linecap="round"
        />
        <path d="M153 478 C136 462 114 448 104 428 C126 426 148 442 153 478Z" fill="#d1d5db" />
        <path
          d="M153 478 C126 450 104 428"
          stroke="#9ca3af"
          stroke-width="0.7"
          stroke-linecap="round"
        />
        <path d="M151 415 C170 400 190 384 196 362 C174 360 152 378 151 415Z" fill="#d1d5db" />
        <path
          d="M151 415 C174 384 196 362"
          stroke="#9ca3af"
          stroke-width="0.7"
          stroke-linecap="round"
        />
        <path d="M149 352 C130 336 108 318 100 296 C122 294 145 314 149 352Z" fill="#d1d5db" />
        <path
          d="M149 352 C122 320 100 296"
          stroke="#9ca3af"
          stroke-width="0.7"
          stroke-linecap="round"
        />
        <path d="M147 288 C164 270 182 250 186 228 C164 226 146 246 147 288Z" fill="#d1d5db" />
        <path
          d="M147 288 C164 250 186 228"
          stroke="#9ca3af"
          stroke-width="0.7"
          stroke-linecap="round"
        />
        <path d="M144 222 C148 200 145 178 142 158 C138 178 138 200 144 222Z" fill="#d1d5db" />
      </g>
    </svg>

    <!-- Background trama -->
    <img
      :src="trama"
      aria-hidden="true"
      class="pointer-events-none select-none fixed top-0 right-0 w-[280px] opacity-[0.06] mix-blend-multiply"
    />

    <!-- Hero -->
    <header
      :class="[
        'flex flex-col items-center justify-center pt-20 pb-16 px-6 text-center transition-all duration-700',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      ]"
    >
      <h1 class="text-3xl font-semibold tracking-tight text-neutral-900 mb-3">
        Build something incredible.
      </h1>
      <p class="text-base text-neutral-500 max-w-md leading-relaxed">
        Frontend, backend, database, auth, and deploy — everything is wired up. Open your AI agent
        in this folder and start describing what you want to build.
      </p>
    </header>

    <main class="max-w-3xl mx-auto px-6 pb-24 flex flex-col gap-16">
      <!-- What to tell your AI agent -->
      <section
        :class="[
          'transition-all duration-700 delay-150',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        ]"
      >
        <h2 class="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-2">
          What to tell your AI agent
        </h2>
        <p class="text-sm text-neutral-500 mb-5">
          Open Claude Code (or any AI agent) in this folder and try prompts like these:
        </p>
        <div class="flex flex-col gap-2">
          <div
            v-for="item in prompts"
            :key="item.label"
            class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 p-4 rounded-xl border border-neutral-100 bg-neutral-50/60"
          >
            <span
              class="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-400 shrink-0 w-32"
              >{{ item.label }}</span
            >
            <span class="text-sm text-neutral-600 italic">{{ item.example }}</span>
          </div>
        </div>
      </section>

      <!-- Stack -->
      <section
        :class="[
          'transition-all duration-700 delay-300',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        ]"
      >
        <h2 class="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-6">
          What's included
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="item in stack"
            :key="item.name"
            class="flex gap-4 p-4 rounded-xl border border-neutral-100 bg-white hover:border-neutral-200 hover:shadow-sm transition-all duration-200"
          >
            <component :is="item.icon" class="w-4 h-4 shrink-0 mt-0.5 text-neutral-400" />
            <div class="flex flex-col gap-0.5 min-w-0">
              <div class="flex items-baseline gap-2">
                <span class="text-sm font-semibold text-neutral-800">{{ item.name }}</span>
                <span class="text-[10px] font-mono text-neutral-400 shrink-0">{{ item.role }}</span>
              </div>
              <p class="text-xs text-neutral-500 leading-relaxed">{{ item.note }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Tips -->
      <section
        :class="[
          'transition-all duration-700 delay-[450ms]',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        ]"
      >
        <h2 class="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-6">
          Tips for working with the AI agent
        </h2>
        <div class="flex flex-col gap-3">
          <div
            v-for="item in tips"
            :key="item.tip"
            class="flex gap-4 p-4 rounded-xl border border-neutral-100 bg-white"
          >
            <component :is="item.icon" class="w-4 h-4 shrink-0 mt-0.5 text-neutral-400" />
            <div class="flex flex-col gap-1 min-w-0">
              <span class="text-sm font-semibold text-neutral-800">{{ item.tip }}</span>
              <p class="text-sm text-neutral-500 leading-relaxed">{{ item.detail }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer
      :class="[
        'py-8 px-6 text-center transition-all duration-700 delay-500',
        visible ? 'opacity-100' : 'opacity-0',
      ]"
    >
      <img
        :src="debrainLogo"
        alt="DËBRAIN"
        class="w-16 brightness-0 opacity-25 select-none mx-auto mb-4"
        draggable="false"
      />
      <p class="text-xs text-neutral-400">
        Need help? Contact
        <a
          href="mailto:jose@hellodebrain.com"
          class="text-neutral-600 hover:text-neutral-900 underline underline-offset-2 transition-colors"
          >jose@hellodebrain.com</a
        >
      </p>
    </footer>
  </div>
</template>
