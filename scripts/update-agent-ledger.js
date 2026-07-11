#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const ledgerPath = path.resolve(scriptDirectory, "..", "artifacts", "agent_ledger.json");
const usage = `Usage:
  node scripts/update-agent-ledger.js <agent-key> [options]

Options:
  --status <value>             --branch <value>
  --working-on <value>         --files <comma,separated,paths>
  --systems <comma,separated>  --risk <value>
  --rate-limited <true|false>  --cooldown-until <value>
  --handoff-needed <value>     --expires-at <value>
  --clear-locks
`;

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function parseBoolean(value, option) {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${option} must be true or false`);
}

function parseList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function loadLedger() {
  if (!fs.existsSync(ledgerPath)) {
    throw new Error(`Ledger not found: ${ledgerPath}`);
  }
  const raw = fs.readFileSync(ledgerPath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${ledgerPath}: ${error.message}`);
  }
}

function parseOptions(args) {
  const fieldMap = {
    "--status": "status",
    "--branch": "branch",
    "--working-on": "working_on",
    "--files": "files_locked",
    "--systems": "systems_locked",
    "--risk": "risk_level",
    "--rate-limited": "rate_limited",
    "--cooldown-until": "cooldown_until",
    "--handoff-needed": "handoff_needed",
    "--expires-at": "expires_at"
  };
  const updates = {};
  let clearLocks = false;

  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === "--clear-locks") {
      clearLocks = true;
      continue;
    }
    const field = fieldMap[option];
    if (!field) throw new Error(`Unknown option: ${option}`);
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for ${option}`);
    }
    index += 1;
    if (option === "--files" || option === "--systems") updates[field] = parseList(value);
    else if (option === "--rate-limited") updates[field] = parseBoolean(value, option);
    else updates[field] = value;
  }
  return { clearLocks, updates };
}

function writeLedger(ledger) {
  const tempPath = `${ledgerPath}.tmp-${process.pid}`;
  const output = `${JSON.stringify(ledger, null, 2)}\n`;
  try {
    fs.writeFileSync(tempPath, output, "utf8");
    fs.renameSync(tempPath, ledgerPath);
  } catch (error) {
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
    throw error;
  }
}

function main() {
  const [agentKey, ...args] = process.argv.slice(2);
  if (!agentKey) {
    console.error(usage);
    process.exitCode = 1;
    return;
  }

  let ledger;
  try {
    ledger = loadLedger();
  } catch (error) {
    fail(error.message);
    return;
  }

  if (!ledger.agents || !ledger.agents[agentKey]) {
    fail(`Unknown agent key: ${agentKey}\nValid agent keys: ${Object.keys(ledger.agents || {}).join(", ")}`);
    return;
  }

  let parsed;
  try {
    parsed = parseOptions(args);
  } catch (error) {
    fail(`${error.message}\n\n${usage}`);
    return;
  }

  const agent = ledger.agents[agentKey];
  if (parsed.clearLocks) {
    Object.assign(agent, {
      files_locked: [],
      systems_locked: [],
      working_on: null,
      risk_level: null,
      handoff_needed: null,
      cooldown_until: null,
      expires_at: null,
      rate_limited: false
    });
  }
  Object.assign(agent, parsed.updates);
  const now = new Date().toISOString();
  agent.last_seen = now;
  ledger.last_updated = now;

  try {
    writeLedger(ledger);
  } catch (error) {
    fail(`Could not update ledger: ${error.message}`);
    return;
  }
  console.log(`Updated ${agentKey} in ${ledgerPath}`);
}

main();
