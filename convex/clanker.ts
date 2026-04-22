import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const OPENAI_MODEL = "gpt-4.1-mini";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const WALLET_COLORS = [
  "emerald",
  "blue",
  "violet",
  "amber",
  "rose",
  "cyan",
  "slate",
  "orange",
] as const;
const WALLET_ICONS = [
  "wallet",
  "bank",
  "credit-card",
  "piggy-bank",
  "safe",
  "vault",
] as const;
const CURRENCIES = ["USD", "EUR", "GBP", "RON", "JPY", "CHF"] as const;

type WalletColor = (typeof WALLET_COLORS)[number];
type WalletIcon = (typeof WALLET_ICONS)[number];
type Currency = (typeof CURRENCIES)[number];

type ProposedWalletOperation = {
  type: "create_wallet";
  name: string;
  currency?: string;
  color?: string;
  icon?: string;
  initialAmount?: number;
};

type ProposedTransactionOperation = {
  type: "create_transaction";
  walletName: string;
  categoryName?: string;
  categoryType?: "income" | "expense";
  amount: number;
  note?: string;
  date?: string;
};

type ProposedOperation = ProposedWalletOperation | ProposedTransactionOperation;

type ParsedAssistantResponse = {
  reply: string;
  operations: ProposedOperation[];
};

type OpenAiMessage = {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
};

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

function getEnvVar(name: string): string | undefined {
  const maybeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return maybeProcess?.env?.[name];
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function asCurrency(value?: string, fallback: Currency = "EUR"): Currency {
  if (!value) return fallback;
  const normalized = value.toUpperCase();
  return CURRENCIES.find((currency) => currency === normalized) ?? fallback;
}

function asWalletColor(
  value?: string,
  fallback: WalletColor = "blue",
): WalletColor {
  if (!value) return fallback;
  return WALLET_COLORS.find((color) => color === value) ?? fallback;
}

function asWalletIcon(value?: string, fallback: WalletIcon = "wallet"): WalletIcon {
  if (!value) return fallback;
  return WALLET_ICONS.find((icon) => icon === value) ?? fallback;
}

function parseAssistantJson(rawContent: string): ParsedAssistantResponse {
  const parsed = JSON.parse(rawContent) as Partial<ParsedAssistantResponse>;
  const reply =
    typeof parsed.reply === "string" && parsed.reply.trim().length > 0
      ? parsed.reply.trim()
      : "I could not parse a clear request, but I am ready for another try.";
  const operations = Array.isArray(parsed.operations)
    ? (parsed.operations as ProposedOperation[])
    : [];
  return { reply, operations };
}

export const runChat = action({
  args: {
    message: v.string(),
    screenshots: v.array(
      v.object({
        name: v.string(),
        dataUrl: v.string(),
      }),
    ),
  },
  returns: v.object({
    reply: v.string(),
    createdWallets: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
      }),
    ),
    createdTransactions: v.array(
      v.object({
        id: v.string(),
        walletName: v.string(),
        categoryName: v.string(),
        amount: v.number(),
      }),
    ),
    warnings: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const apiKey = getEnvVar("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error(
        "Missing OPENAI_API_KEY in Convex environment variables.",
      );
    }

    const user = await ctx.runQuery(api.users.getMyUser, {});
    if (!user) {
      throw new Error("User profile not found");
    }

    const wallets = await ctx.runQuery(api.wallets.list, {});
    const expenseCategories = await ctx.runQuery(api.categories.list, {
      type: "expense",
    });
    const incomeCategories = await ctx.runQuery(api.categories.list, {
      type: "income",
    });
    const preferences = await ctx.runQuery(api.userPreferences.get, {});
    const defaultCurrency = preferences?.defaultCurrency ?? "EUR";

    const systemPrompt = `You are Clanker, a precise finance assistant.
You receive a user request and optional screenshots from a banking app.
Extract intent and return JSON only, with this shape:
{
  "reply": "short helpful summary",
  "operations": [
    {
      "type": "create_wallet",
      "name": "Main Card",
      "currency": "EUR",
      "color": "blue",
      "icon": "bank",
      "initialAmount": 1200
    },
    {
      "type": "create_transaction",
      "walletName": "Main Card",
      "categoryName": "Groceries",
      "categoryType": "expense",
      "amount": 45.21,
      "note": "Kaufland",
      "date": "2026-04-21"
    }
  ]
}

Rules:
- Return JSON only, no markdown.
- Allowed wallet colors: ${WALLET_COLORS.join(", ")}.
- Allowed wallet icons: ${WALLET_ICONS.join(", ")}.
- Allowed currencies: ${CURRENCIES.join(", ")}.
- For transactions, amount must be positive. Sign will be inferred from categoryType.
- If data is uncertain, include fewer operations and explain uncertainty in reply.

Current wallets:
${wallets.map((wallet) => `- ${wallet.name} (${wallet.currency})`).join("\n") || "- none"}

Current expense categories:
${expenseCategories.map((category) => `- ${category.name}`).join("\n") || "- none"}

Current income categories:
${incomeCategories.map((category) => `- ${category.name}`).join("\n") || "- none"}`;

    const userContent: OpenAiMessage["content"] = [
      {
        type: "text",
        text: `User request: ${args.message.trim()}`,
      },
      ...args.screenshots.map((screenshot) => ({
        type: "image_url" as const,
        image_url: { url: screenshot.dataUrl },
      })),
    ];

    const requestBody = {
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ] satisfies OpenAiMessage[],
      response_format: { type: "json_object" },
    };

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as OpenAiChatCompletionResponse;
    const rawContent = payload.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error("OpenAI returned an empty response");
    }

    const parsed = parseAssistantJson(rawContent);
    const createdWallets: Array<{ id: string; name: string }> = [];
    const createdTransactions: Array<{
      id: string;
      walletName: string;
      categoryName: string;
      amount: number;
    }> = [];
    const warnings: string[] = [];

    const walletByName = new Map<string, { id: string; name: string }>(
      wallets.map((wallet) => [normalizeText(wallet.name), wallet]),
    );
    const expenseByName = new Map(
      expenseCategories.map((category) => [normalizeText(category.name), category]),
    );
    const incomeByName = new Map(
      incomeCategories.map((category) => [normalizeText(category.name), category]),
    );

    for (const operation of parsed.operations) {
      if (operation.type === "create_wallet") {
        const name = operation.name?.trim();
        if (!name) {
          warnings.push("Skipped a wallet creation because name was missing.");
          continue;
        }

        const existingWallet = walletByName.get(normalizeText(name));
        if (existingWallet) {
          warnings.push(`Wallet "${name}" already exists, so it was skipped.`);
          continue;
        }

        const initialAmount = Number.isFinite(operation.initialAmount)
          ? operation.initialAmount!
          : 0;

        const wallet = await ctx.runMutation(api.wallets.create, {
          name,
          currency: asCurrency(operation.currency, defaultCurrency),
          color: asWalletColor(operation.color),
          icon: asWalletIcon(operation.icon),
          initialAmount,
        });

        createdWallets.push({ id: wallet.id, name: wallet.name });
        walletByName.set(normalizeText(wallet.name), {
          id: wallet.id as string,
          name: wallet.name,
        });
        continue;
      }

      const walletName = operation.walletName?.trim();
      const amount = Number(operation.amount);
      if (!walletName || !Number.isFinite(amount) || amount <= 0) {
        warnings.push(
          "Skipped a transaction because wallet name or amount was invalid.",
        );
        continue;
      }

      const wallet = walletByName.get(normalizeText(walletName));
      if (!wallet) {
        warnings.push(`Wallet "${walletName}" was not found, transaction skipped.`);
        continue;
      }

      const targetType = operation.categoryType ?? "expense";
      const categoryLookup = targetType === "income" ? incomeByName : expenseByName;
      const fallbackCategories =
        targetType === "income" ? incomeCategories : expenseCategories;
      const categoryName = operation.categoryName?.trim();
      const category =
        (categoryName
          ? categoryLookup.get(normalizeText(categoryName))
          : undefined) ?? fallbackCategories[0];

      if (!category) {
        warnings.push(
          `No ${targetType} category available for transaction on "${walletName}".`,
        );
        continue;
      }

      const parsedDate = operation.date ? Date.parse(operation.date) : NaN;
      const date = Number.isFinite(parsedDate) ? parsedDate : Date.now();

      const created = await ctx.runMutation(api.transactions.create, {
        walletId: wallet.id as Id<"wallets">,
        categoryId: category.id as Id<"categories">,
        amount: Math.abs(amount),
        note: operation.note?.trim() ? operation.note.trim() : undefined,
        date,
      });

      createdTransactions.push({
        id: String(created.id),
        walletName: wallet.name,
        categoryName: category.name,
        amount: created.amount,
      });
    }

    return {
      reply: parsed.reply,
      createdWallets,
      createdTransactions,
      warnings,
    };
  },
});
