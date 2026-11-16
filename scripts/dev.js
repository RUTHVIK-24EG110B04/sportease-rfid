const { spawn } = require("child_process");

function run(command, args, name) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
    cwd: require("path").join(__dirname, ".."),
  });
  child.on("exit", (code) => {
    if (code) process.exit(code);
  });
  child.on("error", (err) => {
    console.error(`[${name}] ${err.message}`);
    process.exit(1);
  });
}

run("node", ["--experimental-sqlite", "server/index.js"], "api");
run("npx", ["--yes", "vite"], "web");
