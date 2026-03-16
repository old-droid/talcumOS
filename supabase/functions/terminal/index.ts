import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
  
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  const { action, command, sessionId, cwd } = await req.json();
  const sid = sessionId || "default";

  // Get or create terminal session in DB
  async function getSession() {
    const { data } = await supabase.from("settings").select("value").eq("key", `terminal_${sid}`).single();
    if (data?.value) {
      return JSON.parse(data.value);
    }
    return { cwd: "/home/user", history: [], env: { USER: "user", HOME: "/home/user" } };
  }

  async function saveSession(session: any) {
    await supabase.from("settings").upsert({ key: `terminal_${sid}`, value: JSON.stringify(session) }, { onConflict: "key" });
  }

  if (action === "init") {
    const session = await getSession();
    return new Response(JSON.stringify({ 
      cwd: session.cwd,
      sessionId: sid,
      welcome: `╔═══════════════════════════════════════╗
║     TalcumOS Terminal v1.0          ║
║     Edge Function Shell             ║
╚═══════════════════════════════════════╝

Type 'help' for commands.`
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (action === "exec") {
    const session = await getSession();
    let output = "";
    let newCwd = session.cwd;

    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    session.history.push(command);
    await saveSession(session);

    // File system stored in Supabase
    async function getFS() {
      const { data } = await supabase.from("settings").select("value").eq("key", `fs_${sid}`).single();
      return data?.value ? JSON.parse(data.value) : { "/home/user": { type: "dir", content: {} } };
    }

    async function saveFS(fs: any) {
      await supabase.from("settings").upsert({ key: `fs_${sid}`, value: JSON.stringify(fs) }, { onConflict: "key" });
    }

    const resolvePath = (p: string): string => {
      if (p.startsWith("/")) return p;
      if (p.startsWith("~")) return "/home/user";
      return session.cwd + "/" + p;
    };

    const fs = await getFS();

    switch (cmd) {
      case "":
        break;
      case "help":
        output = `Commands: ls cd pwd whoami date hostname uname echo env mkdir touch cat rm write sync clear help
Files saved to Supabase!`;
        break;
      case "pwd":
        output = session.cwd;
        break;
      case "whoami":
        output = "user";
        break;
      case "date":
        output = new Date().toString();
        break;
      case "hostname":
        output = "talcumos-edge";
        break;
      case "uname":
        output = args.includes("-a") ? "Linux talcumos-edge 1.0.0-generic #1 SMP x86_64 GNU/Linux" : "Linux";
        break;
      case "id":
        output = "uid=1000(user) gid=1000(user) groups=1000(user)";
        break;
      case "echo":
        output = args.join(" ");
        break;
      case "env":
        output = "USER=user\nHOME=/home/user\nSHELL=/bin/sh\nPWD=" + session.cwd;
        break;
      case "uptime":
        output = " 12:00:00 up 1 day,  1:23,  1 user,  load average: 0.10, 0.20, 0.15";
        break;
      case "ls": {
        const path = args[0] ? resolvePath(args[0]) : session.cwd;
        const pathParts = path.split("/").filter(p => p);
        let current: any = fs;
        for (const p of pathParts) {
          if (current[p]) current = current[p].content;
          else { output = `ls: ${args[0]}: No such file or directory`; break; }
        }
        if (!output) {
          output = Object.entries(current).map(([n, info]: [string, any]) => info.type === "dir" ? n + "/" : n).join("  ") || "(empty)";
        }
        break;
      }
      case "cd": {
        const path = args[0] ? resolvePath(args[0]) : "/home/user";
        const pathParts = path.split("/").filter(p => p);
        let current: any = fs;
        let valid = path === "/home/user";
        for (const p of pathParts) {
          if (current[p]?.type === "dir") { current = current[p].content; valid = true; }
          else valid = false;
        }
        if (valid) { newCwd = path; output = ""; }
        else output = `cd: ${args[0]}: No such directory`;
        break;
      }
      case "mkdir": {
        if (!args[0]) { output = "mkdir: missing operand"; break; }
        const path = resolvePath(args[0]);
        const pathParts = path.split("/").filter(p => p);
        let current: any = fs;
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) current[pathParts[i]] = { type: "dir", content: {} };
          current = current[pathParts[i]].content;
        }
        current[pathParts[pathParts.length - 1]] = { type: "dir", content: {} };
        await saveFS(fs);
        break;
      }
      case "touch": {
        if (!args[0]) { output = "touch: missing operand"; break; }
        const path = resolvePath(args[0]);
        const pathParts = path.split("/").filter(p => p);
        let current: any = fs;
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) current[pathParts[i]] = { type: "dir", content: {} };
          current = current[pathParts[i]].content;
        }
        current[pathParts[pathParts.length - 1]] = { type: "file", content: "" };
        await saveFS(fs);
        break;
      }
      case "write": {
        if (!args[0]) { output = "write: missing file"; break; }
        const content = args.slice(1).join(" ");
        const path = resolvePath(args[0]);
        const pathParts = path.split("/").filter(p => p);
        let current: any = fs;
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) current[pathParts[i]] = { type: "dir", content: {} };
          current = current[pathParts[i]].content;
        }
        current[pathParts[pathParts.length - 1]] = { type: "file", content };
        await saveFS(fs);
        output = `Saved to ${args[0]} (Supabase)`;
        break;
      }
      case "cat": {
        if (!args[0]) { output = "cat: missing operand"; break; }
        const path = resolvePath(args[0]);
        const pathParts = path.split("/").filter(p => p);
        let current: any = fs;
        for (const p of pathParts) {
          if (current[p]) current = current[p].content;
          else { output = `cat: ${args[0]}: No such file`; break; }
        }
        if (!output) output = typeof current === "object" ? "" : (current?.content || "");
        break;
      }
      case "rm": {
        if (!args[0]) { output = "rm: missing operand"; break; }
        const path = resolvePath(args[0]);
        const pathParts = path.split("/").filter(p => p);
        let current: any = fs;
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) { output = `rm: ${args[0]}: No such file`; break; }
          current = current[pathParts[i]].content;
        }
        if (!output) delete current[pathParts[pathParts.length - 1]];
        await saveFS(fs);
        break;
      }
      case "sync":
        output = "✓ Synced to Supabase!";
        break;
      case "clear":
        output = "CLEAR";
        break;
      default:
        output = `${cmd}: command not found`;
    }

    session.cwd = newCwd;
    await saveSession(session);

    return new Response(JSON.stringify({ 
      output,
      cwd: newCwd,
      sessionId: sid
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
});
